# Web Gestures

A modern and robust multi-pointer gesture detection library for JavaScript and TypeScript applications. It is built on top of the Pointer Events API, and leverages the Event Target API to provide a flexible and extensible framework for detecting user gestures in across all modern browsers.

## Packages

This monorepo contains the following packages:

### [@web-gestures/core](./packages/core/README.md)

The core library for detecting and handling user gestures in web applications. It provides a flexible API for configuring and responding to various gesture interactions including tap, press, move, pan, pinch, rotate, and turn wheel.

### [@web-gestures/testing](./packages/testing/README.md)

A utility package for simulating user gestures in browser testing environments. This package works alongside `@web-gestures/core` to make it easy to test gesture interactions in your web applications.

### [@web-gestures/matchers](./packages/matchers/README.md)

Vitest matchers for testing custom gestures, making it easier to ensure your gesture implementations behave as expected.

## Supported Gestures

The following gestures are supported by the `@web-gestures/core` library:

- [Tap](./packages/core/README.md#tap-gesture) - Detects when a user taps on an element
- [Press](./packages/core/README.md#press-gesture) - Detects when a user presses and holds on an element
- [Move](./packages/core/README.md#move-gesture) - Detects when a pointer enters, moves within, and leaves an element
- [Pan](./packages/core/README.md#pan-gesture) - Detects when a user drags across an element in any direction
- [Pinch](./packages/core/README.md#pinch-gesture) - Detects when a user pinches in or out on an element
- [Rotate](./packages/core/README.md#rotate-gesture) - Detects when a user rotates pointers around a center point
- [Turn Wheel](./packages/core/README.md#turn-wheel-gesture) - Detects mouse wheel events on an element

## Installation

Each package can be installed separately depending on your needs:

```bash
# Install the core library
npm install @web-gestures/core

# Install the testing utilities (dev dependency)
npm install @web-gestures/testing --save-dev

# Install the test matchers (dev dependency)
npm install @web-gestures/matchers --save-dev
```
