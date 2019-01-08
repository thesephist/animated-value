import * as Bezier from 'bezier-easing';

const identity = t => t;

const now = () => new Date().getTime();

const STATE_UNSTARTED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

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

class Playable {

    constructor() {
        this.state = STATE_UNSTARTED;
        this._duration = null;
        this._startTime = null;
        this._pausedTime = null;
        this._callback = null;
        this._promise = Promise.resolve();
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

class AnimatedValue extends Playable {

    constructor({
        start = 0,
        end = 1,
        ease = identity,
    }) {
        super();
        this.start = start;
        this.end = end;
        this.ease = Array.isArray(ease) ? Bezier(...ease) : ease;
        this._fillState = start;
    }

    static get CURVES() {
        return CURVES;
    }

    static compose(...animatedValues) {
        return new CompositeAnimatedValue(animatedValues);
    }

    value() {
        if (this.state !== STATE_PLAYING) { // means it's paused or finished
            return this._fillState;
        } else {
            const elapsedTime = now() - this._startTime;
            const elapsedDuration = elapsedTime > this._duration ? 1 : elapsedTime / this._duration;
            return (this.end - this.start) * this.ease(elapsedDuration) + this.start;
        }
    }

    pause() {
        if (this.state === STATE_PLAYING) {
            //> The order matters here, because we can't get the value if we aren't playing
            this._fillState = this.value();
        }
        super.pause();
    }

    reset() {
        super.reset();
        this._fillState = this.start;
    }

}

class CompositeAnimatedValue extends Playable {

    constructor(animatedValues) {
        super();
        this._animatedValues = animatedValues;
    }

    play(duration, callback) {
        //> Play swallows the callback here and calls it once
        //  for the entire composition, efficiently.
        const ret = super.play(duration, callback);
        for (const av of this._animatedValues) {
            av.play(duration);
        }
        return ret;
    }

    pause() {
        super.pause();
        for (const av of this._animatedValues) {
            av.pause();
        }
    }

    resume() {
        if (this.state === STATE_PAUSED) {
            for (const av of this._animatedValues) {
                av.resume();
            }
        }
        //> Order is important -- if we resume first, the checks above don't work
        super.resume();
    }

    reset() {
        super.reset();
        for (const av of this._animatedValues) {
            av.reset();
        }
    }

}

if (typeof window === 'object') {
    window.AnimatedValue = AnimatedValue;
} else if (module && module.exports) {
    module.exports = { AnimatedValue };
}
