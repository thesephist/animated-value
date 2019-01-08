import * as Bezier from 'bezier-easing';

const identity = t => t;

const now = () => new Date().getTime();

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

class AnimatedValue {

    constructor({
        // Rather than start and stop, how about rangeMin and rangeMax? More flexible model for easing.
        start = 0,
        end = 1,
        ease = identity,
    }) {
        this.start = start;
        this.end = end;
        this.ease = Array.isArray(ease) ? Bezier(...ease) : ease;

        this.reset();
    }

    static get CURVES() {
        return CURVES;
    }

    static compose(...animatedValues) {
        return new CompositeAnimatedValue(animatedValues);
    }

    get isRunning() {
        return this._startTime !== null;
    }

    get isFinished() {
        return this._duration === null;
    }

    value() {
        if (!this.isRunning) { // means it's paused
            return this._fillState;
        } else {
            const elapsedTime = now() - this._startTime;
            const elapsedDuration = elapsedTime > this._duration ? 1 : elapsedTime / this._duration;
            return (this.end - this.start) * this.ease(elapsedDuration) + this.start;
        }
    }

    play(duration, render) {
        this._duration = duration;
        this._startTime = now();

        this._callback = () => {
            if (render !== undefined) {
                render(this.value());
            }
            if (now() - this._startTime > this._duration) {
                this.pause();
            } else {
                requestAnimationFrame(this._callback);
            }
        }
        this._callback();
    }

    pause() {
        if (this.isRunning) {
            this._fillState = this.value();
            this._pausedTime = now() - this._startTime;
            this._startTime = null;
        }
    }

    resume() {
        if (!this.isFinished && !this.isRunning) {
            this._startTime = now() - this._pausedTime;
            this._pausedTime = null;
            this._callback();
        }
    }

    reset() {
        this._fillState = this.start;
        this._duration = null;
        this._startTime = null;
        this._pausedTime = null;
    }

    update({
        start,
        end,
        duration,
    }) {
        this.start = start || this.start;
        this.end = end || this.end;
        this.duration = duration || this.duration;
    }

}

class CompositeAnimatedValue {

    constructor(animatedValues) {
        this._animatedValues = animatedValues;
        this.reset();
    }

    get isRunning() {
        return this._startTime !== null;
    }

    get isFinished() {
        return this._duration === null;
    }

    play(duration, render) {
        this._duration = duration;
        this._startTime = now();

        for (const av of this._animatedValues) {
            av.play(duration);
        }

        this._callback = () => {
            if (render !== undefined) {
                render(this._animatedValues.map(av => av.value()));
            }
            if (now() - this._startTime > this._duration) {
                this.pause();
            } else {
                requestAnimationFrame(this._callback);
            }
        }
        this._callback();
    }

    pause() {
        if (this.isRunning) {
            this._pausedTime = now() - this._startTime;
            this._startTime = null;
        }
        for (const av of this._animatedValues) {
            av.pause();
        }
    }

    resume() {
        if (!this.isFinished && !this.isRunning) {
            this._startTime = now() - this._pausedTime;
            this._pausedTime = null;
            this._callback();
            for (const av of this._animatedValues) {
                av.resume();
            }
        }
    }

    reset() {
        this._duration = null;
        this._startTime = null;
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
