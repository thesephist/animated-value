const identity = t => t;

const now = new Date().getTime();

class AnimatedValue {

    constructor({
        start = 0,
        end = 1,
        ease: identity,
    }) {
        this.start = start;
        this.end = end;
        this.ease = ease;

        this._duration = null;
        this._startTime = null;
        this._fillState = start;
    }

    get finished() {
        // todo
    }

    value() {
        if (this._startTime == null) { // means it's paused
            return this._fillState;
        } else {
            const elapsedTime = now() - this._startTime;
            const elapsedDuration = elapsedTime > this._duration ? 1 : elapsedTime / this._duration;
            return (this.end - this.start) * this.ease(elapsedDuration) + this.start;
        }
    }

    play(duration) {
        if (typeof duration !== 'number') {
            throw new Error(`${duration} is not a valid animation duration. Please pass a time duration in miliseconds.`);
        }

        this._duration = duration;
        this._startTime = now();
    }

    pause() {
        this._fillState = this.value();
        this._startTime = null;
    }

    resume() {
        // TODO: deduce startTime retroactively from fillState position and _duration
    }

    reset() {
        this._fillState = this.start;
        this._duration = null;
        this._startTime = null;
    }

    playToEnd(duration, render) {
        this.play(duration);
        const fn = () => {
            render();
            if (this.finished) {
                this.pause();
            } else {
                requestAnimationFrame(fn);
            }
        }
        fn();
    }

}

class CompositeAnimatedValue {

    constructor(animatedValues) {
        this.values = animatedValues;
    }

    play(duration) {

    }

    pause() {

    }

    reset() {

    }

    playToEnd() {

    }

}

const compose = (...animatedValues) => {
    return new CompositeAnimatedValue(animatedValues);
}

export {
    AnimatedValue,
    compose,
}

