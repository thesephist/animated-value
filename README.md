# `animated-value`

[![npm animated-value](https://img.shields.io/npm/v/animated-value.svg)](http://npm.im/animated-value)
[![gzip size](http://img.badgesize.io/https://unpkg.com/animated-value/dist/index.min.js?compression=gzip)](https://unpkg.com/animated-value/dist/index.min.js)
[![install size](https://packagephobia.now.sh/badge?p=animated-value)](https://packagephobia.now.sh/result?p=animated-value)

`animated-value` is an **imperative animation API for declarative UI renderers**, like React, Preact, and Torus. It allows us to build rich, fully interactive animations with the full benefits of a JavaScript-driven imperative animation system -- custom tweening and physics including spring-based interactive physics, full interruptibility and redirectability, reliable chaining and callbacks, and more -- within the robust declarative UI frameworks we use to build apps today.

You can see a simple demo of `animated-value` [here](https://animated-value.surge.sh); the source is linked, and also found under `demo/`.

## Imperative animation what?

It's 2019! We build a lot of our user interfaces with web technologies, and most of us use _declarative_ rendering frameworks like **React** to define our user interfaces as a function of state. But this makes imperative animation -- being able to tell the UI "Here's where you start, and I'm going to tell you how to move through the animation" -- hairy.

In declarative UI frameworks, it's also tricky to implement animations that we can start, stop, pause, and rewind programmatically based on timers or events -- CSS transitions sometimes fall short.

Enter `animated-value`!

## Using `animated-value`

You can import `animated-value` with a script tag...

```html
<script src="https://unpkg.com/animated-value/dist/index.min.js"></script>
```

... and you'll find the `AnimatedValue` object in the global scope (as `window.AnimatedValue`).

Alternatively, you can install `animated-value` using npm...

```sh
npm install animated-value
```

... and import it into your code.

```javascript
import { AnimatedValue } from 'animated-value';

const animatedOpacity = new AnimatedValue(/*...*/);
// ...
```

If you're not to keen on reading gobs of documentation, feel free to skip down to the **Examples** section below.

### `AnimatedValue`

The `AnimatedValue` class represents a value (usually a CSS property) that you can define an animation for. An animation is defined by three things:

- `start`: The initial value of the `AnimatedValue`
- `end`: The final value of the `AnimatedValue`
- `ease`: An easing function that maps `[0, 1)` to itself, mapping time to progress.

The **start** and **end** values are numbers. For example, if we want to reveal a component by increasing the opacity from 0 to 1, we would have `start: 0` and `end: 1`. We can also update the start and end positions of existing animated values by setting the `.start` and `.end` properties of the animated value instance. Note that if an animation is in progress, this will cause the animation to "jump" to the updated value in the next frame, unless we first pause the animation, update, and resume from the new position.

The **ease** argument can be a function that maps time to progress through the animation (both on a 0 to 1 scale), like `t => Math.pow(t, 2)`, or an array of four numbers that define a cubic Bezier curve, like `[0, 1, 1, 0]`.

An `AnimatedValue` object has a **value** at any given time, and you can ask for the value at the current time by calling `AnimatedValue#value()`. If the animation hasn't started yet, this will be initialized to the start value.

When we render declaratively, we can use the `#value()` getter to get the value of an animated property at render time (see examples below for reference).

### Easing curves

The library comes bundled with a short list of useful easing functions you can pass to the `AnimatedValue` constructor, under `AnimatedValue.CURVES`. This includes the full set of CSS default named easing curves (`CURVES.EASE_IN`, `CURVES.EASE_OUT`, `CURVES.EASE_IN_OUT`, `CURVES.LINEAR`, etc.) as well as a few extras:

- `EXPO_IN`: a sharper ease-in, with a more dramatic acceleration and an elastic feel
- `EXPO_OUT`: a sharper ease-out
- `EXPO_IN_OUT`: a sharper ease-in-out
- `EASE_IN_BACK`: an ease-in that retreats a bit before shooting to the end (reverse of `EASE_OUT_BACK`)
- `EASE_OUT_BACK`: an ease-out that overshoots a bit before returning to the end

You can check out the exact definitions of all the pre-defined easing curves in `src/index.js`, defined using cubic Bezier coefficients.

### Controlling animations

The power in `animated-value` comes in more than being able to define animations -- CSS can do that just fine. With `AnimatedValue` objects, we can finely control when animations start, stop, pause, and get reset, and we can group animations into larger groups of animated properties to control them together, as a single unit of animation.

Let's create an animated value for opacity, for a fade-in effect:

```javascript
const animatedOpacity = new AnimatedValue({
    start: 0,
    end: 1,
});

animatedOpacity.value(); // 0, our start value, since we haven't started the animation yet
```

To play the animation, we call `play()` with a duration, in milliseconds.

```javascript
animatedOpacity.play(2000); // play for two seconds

// one second later...
animatedOpacity.value();
// returns 1, since we're halfway through the (linear) animation from 0 to 1
```

But it's no good if the value is never rendered to the UI. In rendering, `animated-value` is framework-agnostic (as you can see in the examples down below). To render the animated property to the UI, we can simply slot the animated value's `value()` in our rendering code. Here's one way to do it.

```javascript
class MyAnimatedComponent extends React.Component {

    constructor(props) {
        super(props);
        this.animatedOpacity = new AnimatedValue({
            start: 0,
            end: 1,
        });
    }

    // We'll call this method to start the animation
    startAnimation() {
        this.animatedOpacity.play(2000);
    }

    render() {
        return <div
            class="square"
            style={{opacity: this.animatedOpacity.value()}}
            >
            </div>;
    }

}
```

This way, when the component is rendered, the opacity style will be the current value of the animated opacity property.

To make this animation work, we also need to make sure we're re-rendering the component every frame. We can use `requestAnimationFrame` to achieve this, by forcing a re-render every frame using something like `Component.forceUpdate()`. But `animated-value` comes with a built-in way of invoking an update every frame while an animation is running.

`AnimatedValue#play()` takes a second argument, which is a callback that'll be called every single frame until the animation is finished. We can call `play()` with the callback as an update to the local state, and React will re-render the component with the right opacity every frame.

```javascript
class MyAnimatedComponent extends React.Component {

    constructor(props) {
        super(props);
        this.animatedOpacity = new AnimatedValue({
            start: 0,
            end: 1,
        });
        this.state = {
            opacity: this.animatedOpacity.value(),
        }
    }

    // We'll call this method to start the animation
    startAnimation() {
        this.animatedOpacity.play(2000, () => {
            // This will be called every frame, with a new opacity value
            this.setState({
                opacity: this.animatedOpacity.value(),
            });
        });
    }

    render() {
        return <div
            class="square"
            style={{opacity: this.animatedOpacity.value()}}>
            </div>;
    }

}
```

And we've animated our React component with `animated-value`!

Of course, if this was all we could do, there wouldn't be use for such an elaborate solution. Since we have a handle on the `animatedOpacity` object, we can play, pause, and reset/re-play the animation at any time, in response to user events, timers, or anything else in your code.

We can pause the animation anytime through the play with `pause()`, and reset the animation to its original state with `reset()`. Both of these can be called at any time during or before/after animation plays.

```javascript
animatedOpacity.play(2000);
animatedOpacity.pause(); // pause the animation where it is
animatedOpacity.resume(); // resume the animation from where it was left off

animatedOpacity.play(2000);
animatedOpacity.reset(); // stop the animation immediately where it is, and reset to the start

animatedOpacity.play(2000);
// calling play again in the middle of an animation will be ignored.
animatedOpacity.play(2000); // ignored
// to re-start an animation, call `reset()`, then `play()` again.
```

### Chaining animations with the Promise API

`AnimatedValue#play()` returns a promise that resolves as soon as the animation is either complete, or reset.

If the animation runs to its full completion (even after pauses and resumes), the returned promise will resolve to `true`. If the animation is reset at some point and fails to run to completion, it'll resolve to `false`. The promise returned from `play()` never rejects.

If you can `play()` multiple times in a row without resetting in between, you'll receive the same promise multiple times.

This allows us to chain animations and other actions together.

```javascript
const animatedOpacity = new AnimatedOpacity({
    start: 0,
    end: 1,
    ease: AnimatedValue.CURVES.EASE_OUT,
});

animatedOpacity.play(2000).then((finished) => {
    if (finished) {
        console.log('Animation ran successfully to the end');
    } else {
        console.log('Animation was reset in the middle!');
    }
});
```

### Composite animations

Frequently, we have to animate multiple properties concurrently. If we're revealing a dialog box, for example, we may want to animate the opacity, vertical position, and scale of the box all together, in the same duration.

Rather than calling `play()` on each animated value, we can compose these related animations together into a _Composite_ animated value. We can treat composite values exactly the same as normal, single animated values, with one difference -- we can't call `value()` to ask for the current value of a composite animated property, since it doesn't make sense for a set of properties to have a single value.

For example, let's create a composite animated value that combines travel in the x- and y-directions, so it looks like the animated component is "swinging" on its way to the diagonal end.

We can create a composite animated value by passing individual animated values into `AnimatedValue.compose()`:

```javascript
const animatedX = new AnimatedValue({
    start: 0,
    end: 100, // 100px end
    ease: AnimatedValue.CURVES.EASE_OUT,
});
const animatedY = new AnimatedValue({
    start: 0,
    end: 100, // 100px end
    ease: AnimatedValue.CURVES.EASE_IN,
});
const animatedSwing = AnimatedValue.compose(animatedX, animatedY);

// play both animation values together, for 2000ms
animatedSwing.play(2000);
```

Composite values like this have the same play/pause/resume/reset API as singular `AnimatedValue`s. In fact, the animations API are polymorphic under the hood -- you can pass composite animated values as sub-animations to bigger composite animated values!

## Spring physics and `AnimatedValue.Dynamic`

Going beyond simple easing-based animations, one way to add more liveliness and delight into UI animation is to use spring physics-based animation. This means that, rather than depending on Bezier curves for defining the progression of a value over time, we'll treat the value as if it had inertia and were pulled to new values by a string.

You can check out [this excellent talk at WWDC 2017, titled "Designing Fluid Interfaces,"](https://developer.apple.com/videos/play/wwdc2018/803/) for an overview of physics-based animation in UI.

`animated-value` provides a second kind of animation primitive, the **dynamic animated value**, from which we can build fluid, spring physics-based animations. Like `AnimatedValue`s, dynamic values can be applied to any numerical value and animated over time. We can create new dynamic values like this

```javascript
const springPosition = new AnimatedValue.Dynamic({
    start: 0,
    stiffness: 5,
    damping: .4,
});
...
springPosition.playTo(250, () => render());
```

There are two critical differences to remember when we're using dynamic values to build animated components.

First, **dynamic values do not take end values**. Instead, we define a current value and animate the value _to_ a new destination value using `.playTo(newValue)`.

Second, **dynamic values are parameterized by stiffness and damping, not an easing curve**. The stiffness and damping constants determine the behavior of the "spring" powering the animation.

- The **damping** determines how "bouncy" the spring is and covers the range [0, 1). The higher the damping, the less bouncy the spring.
- The **stiffness** determines how strong the spring's recoil force is. Feel free to experiment with these values to find a value that feels right! `animated-value` comes with sane defaults that should feel natural in most UIs.

Like normal `AnimatedValue`s, `AnimatedValue.Dynamic` are also perfectly *reentrant, interruptible, smooth, and redirectable*. You can call `.playTo(endValue)` with new values repeatedly, even in the middle of other animations, and the value will transition smoothly and realistically to new values.

Dynamic values by nature cannot be reset nor played without destination values, but they can still be paused and resumed at any time. Because of some of these API differences, and because it would simply be jarring in UI, dynamic values cannot be composed with `AnimatedValue.compose` -- doing so will result in console warnings and unsupported behaviors.

### Summary

Using singular `AnimatedValue`s, we can define individual properties and how we want them to behave when we control our animations. And with composite animated values, we can define higher-level animations that correspond to a concept, like "reveal" or "bounce out". In either case, `animated-value` is great for animations that we want to be able to imperatively control tightly inside a component.

## Examples

`animated-value` was made to fit right into declarative component frameworks on the web, so the best way to illustrate its API might be to show some use cases. Here, I've written one way to use the library for **React** and **[Torus](https://github.com/thesephist/torus)**.

### React

Here's an example of `AnimatedValue` used in a React component to animate a reveal-in motion.

In just a few extra lines, we've defined fully controllable, 60fps-animated properties on our component that fits right into React's declarative rendering style while being fully controllable from our application logic.

```javascript
class AnimatedSquare extends Component {

    constructor(props) {
        super(props);
        this.state = {
            opacity: 0,
            xOffset: 0,
        }

        this.animatedOpacity = new AnimatedValue({
            start: 0,
            end: 1,
            // linear easing by default
        });
        this.animatedXOffset = new AnimatedValue({
            start: 0,
            end: 200,
            ease: AnimatedValue.CURVES.EASE_OUT_BACK,
        });
        // we want to run both concurrently, as a "reveal" animation
        this.animatedReveal = AnimatedValue.compose(
            this.animatedOpacity,
            this.animatedXOffset,
        );
    }

    reveal() {
        // Play the animation for 800ms
        this.animatedReveal.play(800, () => {
            this.setState({
                opacity: this.animatedOpacity.value(),
                xOffset: this.animatedXOffset.value(),
            });
        });
    }

    componentDidMount() {
        // start the animation on mount
        this.reveal();
    }

    render() {
        const animatedProperties = {
            opacity: this.state.opacity,
            transform: `translateX(${this.state.xOffset})`,
        }
        return (
            <div class="square" style={animatedProperties}>
            </div>
        );
    }

}
```

### Torus

[Torus](https://github.com/thesephist/torus) is a lightweight UI framework I wrote with a declarative UI rendering API, and it goes well with `animated-value`. Here's what the equivalent component and animation would look like in Torus.

```javascript
class AnimatedSquare extends Component {

    init() {
        this.animatedOpacity = new AnimatedValue({
            start: 0,
            end: 1,
            // linear easing by default
        });
        this.animatedXOffset = new AnimatedValue({
            start: 0,
            end: 200,
            ease: AnimatedValue.CURVES.EASE_OUT_BACK,
        });
        // we want to run both concurrently, as a "reveal" animation
        this.animatedReveal = AnimatedValue.compose(
            this.animatedOpacity,
            this.animatedXOffset
        );

        // start the animation
        this.reveal();
    }

    reveal() {
        // Run the reveal animation for 800ms, and re-render each frame
        //  (that's what the call to `this.render()` does).
        this.animatedReveal.play(800, () => this.render());
    }

    compose() {
        return jdom`<div class="square" style="
            opacity: ${this.animatedOpacity.value()};
            transform: translateX(${this.animatedXOffset.value()}px)
        "></div>`;
    }

}
```
