//> Animation curves are usually defined as cubic Bezier
//  curves, but it turns out computing these functions on the fly
//  from the time domain is pretty tricky. We depend on this ~500B
//  library to resolve Bezier curves for us.
import * as Bezier from 'bezier-easing';

//> Spring physics-based easing functions comes from this external
//  dependency that resolves spring physics curves into functions.
import {springFactory} from './spring.js';

//> Linear easing curve
const identity = t => t;

//> Animation involves lots of measuring time.
//  This is a shortcut to get the current unix epoch time
//  in milliseconds.
const now = () => Date.now();

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

//> ## Unified frame loop

//> This section implements a unified frame loop for all animations
//  performed by animated-value. Rather than each animated value orchestrating
//  its own animation frame loop, if we implement one frame loop for the whole
//  library and hook into it from each animated value, we can save many unnecessary
//  calls to and from `requestAnimationFrame` during animation and keep code efficient.

//> Is the unified frame loop (UFL) currently running?
let rafRunning = false;
//> Queue of callbacks to be run on the next animation frame
let rafQueue = [];
//> The function that runs at most once every animation frame. This calls
//  all queued callbacks once, and if necessary, enqueues a recursive call in the
//  next frame.
const runAnimationFrame = () => {
    requestAnimationFrame(() => {
        const q = rafQueue;
        rafQueue = [];
        for (const cb of q) {
            cb();
        }
        if (rafQueue.length > 0) {
            runAnimationFrame();
        } else {
            rafRunning = false;
        }
    });
}
//> The animation frame callback that enqueues new callbacks into the next
//  frame callback and optionally starts the frame loop if one is not running.
const raf = callback => {
    rafQueue.push(callback);

    if (!rafRunning) {
        rafRunning = true;
        runAnimationFrame();
    }
}

//> ## `Playable` interface

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
                        raf(this._callback);
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
    } = {}) {
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

    static get Kinetic() {
        return KineticValue;
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
            return ((this.end - this.start) * this.ease(elapsedDuration)) + this.start;
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
        for (const p of this._playables) {
            if (p instanceof KineticValue) {
                console.warn('AnimatedValue.Kinetic cannot be composed into composite animated values. Doing so may result in buggy and undefined behavior.');
            }
        }
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

//> A `KineticValue` or `AnimatedValue.Kinetic` is an animated value whose animations are defined by
//  spring physics. As such, it takes only a starting position and some phsyics constants, and are
//  aniamted to destination coordinates. Kinetic values also cannot be reset.
class KineticValue extends AnimatedValue {

    constructor({
        start = 0,
        end = null,
        stiffness = 3,
        damping = .8,
        duration = 1000,
    } = {}) {
        if (end === null) {
            end = start;
        }
        stiffness = ~~stiffness;

        const ease = springFactory({
            damping,
            stiffness,
            initial_velocity: 0,
        });
        super({
            start,
            end,
            //> Functions from `springFactory` start at 1 and go to 0, so
            //  we need to invert it for our use case.
            ease: t => 1 - ease(t),
        });
        this.damping = damping;
        this.stiffness = stiffness;
        //> In kinetic physics-based animations, the animation duration is a parameter
        //  over the whole spring, not a single animation. So we set it for the value itself
        //  and store it here to use it in every animation instance.
        this._dynDuration = duration;
    }

    //> `playTo()` substitutes `play()` for kinetic values, and is the way to animate the
    //  spring animated value to a new value.
    playTo(end, callback) {
        const n = now();
        //> Get elapsed time scaled to the range [0, 1]
        const elapsed = (n - this._startTime) / this._duration;

        //> Determine instantaneous velocity
        const DIFF = 0.0001;
        const velDiff = (this.ease(elapsed) - this.ease(elapsed - DIFF)) / DIFF;

        //> Scale the velocity to the new start and end coordinates, since the distance
        //  covered will modify how the [0, 1] range scales out to real values.
        const scaledVel = velDiff * (this.end - this.start) / (end - this.value());

        //> Create a new easing curve based on the new velocity
        const ease = springFactory({
            damping: this.damping,
            stiffness: this.stiffness,
            initial_velocity: -scaledVel,
        });
        //> Reset animation values so the next frame will render  using the new animation parameters
        this.start = this.value();
        this.end = end;
        this.ease = t => 1 - ease(t);
        this._startTime = n;

        //> If there is not already an animation running, start it.
        if (this.state !== STATE_PLAYING) {
            super.play(this._dynDuration, callback);
        }
        //> Return promise for chaining calls.
        return this._promise;
    }

    //> Warnings for APIs that do not apply to kinetic values
    play() {
        console.warn('Kinetic Animated Values should be played with playTo()');
    }

    reset() {
        console.warn('Kinetic Animated Values cannot be reset');
    }

}

if (typeof window === 'object') {
    window.AnimatedValue = AnimatedValue;
} else if (module && module.exports) {
    module.exports = {AnimatedValue};
}
