//> Animation curves are usually defined as cubic Bezier
//  curves, but it turns out computing these functions on the fly
//  from the time domain is pretty tricky. We depend on this ~500B
//  library to resolve Bezier curves for us.
import * as Bezier from 'bezier-easing';

//> Linear easing curve
const identity = t => t;

//> Animation involves lots of measuring time.
//  This is a shortcut to get the current unix epoch time
//  in milliseconds.
const now = () => new Date().getTime();

//> AnimatedValue's animation objects are state machines, with
//  three states. These three states are represented as these
//  constants.
const STATE_UNSTARTED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

//> By default, `AnimatedValue.CURVES` provides a useful set of
//  easing curves we can use out of the box.
const CURVES = {
    LINEAR: identity,
    EASE: Bezier(0.25, 0.1, 0.25, 1),
    EASE_IN: Bezier(0.42, 0, 1, 1),
    EASE_OUT: Bezier(0, 0, 0.58, 1),
    EASE_IN_OUT: Bezier(0.42, 0, 0.58, 1),
    EASE_IN_BACK: Bezier(0.6, -0.28, 0.735, 0.045),
    EASE_OUT_BACK: Bezier(0.175, 0.885, 0.32, 1.275),
    EXPO_IN: Bezier(0.95, 0.05, 0.795, 0.035),
    EXPO_OUT: Bezier(0.19, 1, 0.22, 1),
    EXPO_IN_OUT: Bezier(1, 0, 0, 1),
}

//> The `Playable` class represents something whose timeline
//  can be played, paused, and reset. Both a single AnimatedValue,
//  as well as `CompositeAnimatedValue` (a combination of more than
//  one AV) inherit from `Playable`. This class enables us to have
//  polymorphic, imperative animation control APIs.
class Playable {

    constructor() {
        //> A `Playable` is a state machine.
        this.state = STATE_UNSTARTED;
        //> The duration requested for an animation play-through
        this._duration = null;
        //> When did our current animation run start? `null` if the
        //  animation is not currently playing.
        this._startTime = null;
        //> If we are paused, we keep track of how far through the
        //  animation we were here.
        this._pausedTime = null;
        //> Callback after each frame is rendered during play
        this._callback = null;
        //> A promise that resolves when the currently playing animation
        //  either finishes (resolves to `true`) or is reset (resolves to `false`).
        this._promise = Promise.resolve();
        //> Temporary variable we use as a pointer to the resolver of `this._promise`,
        //  so we can resolve the promise outside of the promise body.
        this._promiseResolver = null;
    }

    play(duration, callback) {
        if (this.state === STATE_PLAYING) {
            return this._promise;
        }

        this.state = STATE_PLAYING;
        this._duration = duration;
        this._startTime = now();

        this._promise = new Promise((res, _rej) => {
            this._promiseResolver = res;
            this._callback = () => {
                if (callback !== undefined) {
                    callback();
                }
                //> Sometimes, in between frames, the user
                //  will pause the animation but we assume it isn't paused
                //  so we keep playing. This checks if we're supposed to
                //  still be playing the next frame.
                if (this.state === STATE_PLAYING) {
                    if (now() - this._startTime > this._duration) {
                        this.pause();
                        if (this._promiseResolver !== null) {
                            this._promiseResolver(true);
                            this._promiseResolver = null;
                        }
                    } else {
                        requestAnimationFrame(this._callback);
                    }
                }
            }
            this._callback();
        });
        return this._promise;
    }

    pause() {
        if (this.state === STATE_PLAYING) {
            this.state = STATE_PAUSED;
            this._pausedTime = now() - this._startTime;
            this._startTime = null;
        }
    }

    resume() {
        if (this.state === STATE_PAUSED) {
            this.state = STATE_PLAYING;
            this._startTime = now() - this._pausedTime;
            this._pausedTime = null;
            this._callback();
        }
    }

    reset() {
        if (this._promiseResolver !== null) {
            this._promiseResolver(false);
            this._promiseResolver = null;
        }
        this.state = STATE_UNSTARTED;
        this._duration = null;
        this._startTime = null;
        this._pausedTime = null;
        this._callback = null;
    }

}

//> `AnimatedValue` represents a single value (number) that can
//  be animated with a duration and an easing curve. Most often,
//  an `AnimatedValue` corresponds to a single CSS property that
//  we're animating on a component, like translate / scale / opacity.
class AnimatedValue extends Playable {

    constructor({
        start = 0,
        end = 1,
        ease = identity,
    }) {
        super();
        this.start = start;
        this.end = end;
        //> We accept an array of cubic Bezier points as an easing function,
        //  in which case we create a Bezier curve out of them.
        this.ease = Array.isArray(ease) ? Bezier(...ease) : ease;
        //> The fill state represents the value of the animated value whenever
        //  the animation is not running. The value is initialized to the start position.
        this._fillState = start;
    }

    //> Statically defined so consumers of the API can define easing curves
    //  as `AnimatedValue.CURVES.[CURVE_NAME]`.
    static get CURVES() {
        return CURVES;
    }

    //> Statically defined constructor for a composite animation, which takes
    //  multiple `Playable`s (either single or composite animated values) and
    //  plays all of them concurrently.
    static compose(...playables) {
        return new CompositeAnimatedValue(playables);
    }

    //> What's the current numerical value of this animated value?
    //  This API is intentionally not implemented as a getter, to communicate
    //  to the API consumer that value computation has a nonzero cost with each access.
    value() {
        if (this.state !== STATE_PLAYING) {
            //> If the animation is not playing, just return the last fill value
            return this._fillState;
        } else {
            const elapsedTime = now() - this._startTime;
            const elapsedDuration = elapsedTime > this._duration ? 1 : elapsedTime / this._duration;
            return (this.end - this.start) * this.ease(elapsedDuration) + this.start;
        }
    }

    pause() {
        if (this.state === STATE_PLAYING) {
            //> The order of `super` call matters here, because we can't get the value if we aren't playing
            this._fillState = this.value();
        }
        super.pause();
    }

    reset() {
        super.reset();
        this._fillState = this.start;
    }

}

//> A `CompositeAnimatedValue` is a `Playable` wrapper around many (single, composite) animated values,
//  that can run all of the animations in the same duration, concurrently. `CompositeAnimatedValue`
//  is polymorphic, and can take any `Playable` as a sub-animation.
class CompositeAnimatedValue extends Playable {

    constructor(playables) {
        super();
        this._playables = playables;
    }

    play(duration, callback) {
        //> `CompositeAnimatedValue#play()` swallows the callback here and calls it once
        //  for the entire composition, efficiently, so the callback isn't called N
        //  times for N animated values below this composite animation.
        const ret = super.play(duration, callback);
        for (const av of this._playables) {
            av.play(duration);
        }
        return ret;
    }

    pause() {
        super.pause();
        for (const av of this._playables) {
            av.pause();
        }
    }

    resume() {
        if (this.state === STATE_PAUSED) {
            for (const av of this._playables) {
                av.resume();
            }
        }
        //> Order of `super.resume()` call is important -- if we resume first, the checks above don't work
        super.resume();
    }

    reset() {
        super.reset();
        for (const av of this._playables) {
            av.reset();
        }
    }

}

if (typeof window === 'object') {
    window.AnimatedValue = AnimatedValue;
} else if (module && module.exports) {
    module.exports = { AnimatedValue };
}
