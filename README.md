# `animated-value`

`animated-value` is an imperative animation API for declarative UI renderers, like React, Preact, and Torus.

## Motivation

It's 2019! We build a lot of our user interfaces with web technologies, and a lot of us use declarative rendering frameworks like React to define our user interfaces as a function of state. But this makes imperative animation -- being able to tell the UI "Here's where you start, and I'm going to tell you how to move through the animation" -- hairy.

Enter `animated-value`!

## API

The `AnimatedValue` class represents a value (usually a CSS property) that you can define an animation for. An animation is defined by three things:

- `start`: The initial value of the `AnimatedValue`
- `end`: The final value of the `AnimatedValue`
- `ease`: An easing function that maps `[0, 1)` to itself, mapping time to progress.

## Roadmap

- `AnimatedValue#play()` should return a promise that resolves when animation completes, and rejects when it's interrupted (cancelled).
