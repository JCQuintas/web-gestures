# @web-gestures/testing

A utility package for simulating user gestures in browser testing environments. This package works alongside `@web-gestures/core` to make it easy to test gesture interactions in your web applications.

## Installation

```bash
# Using npm
npm install @web-gestures/testing --save-dev

# Using pnpm
pnpm add @web-gestures/testing -D

# Using yarn
yarn add @web-gestures/testing --dev
```

## Usage

This package provides a simple and intuitive API for simulating all gesture types supported by the `@web-gestures/core` package.

The main entry point is the `userGesture` object.

```typescript
import { mouseGesture, touchGesture, penGesture } from '@web-gestures/testing';

const touch = touchGesture.setup({
  // advanceTimers:
});

const mouse = mouseGesture.setup({
  // advanceTimers:
});

await touch
  .pinch({
    target: document.querySelector('#target'),
    duration: 500,
  })
  .byDistance({
    pointers: [
      { id: 10, x: 0, y: 0 },
      { id: 11, x: 100, y: 100 },
    ],
    distance: 100,
    duration: 500,
    angle: 0,
  })
  .byPoints({
    start: [
      { id: 10, x: 100, y: 100 },
      { id: 11, x: 200, y: 200 },
    ],
    end: [
      { id: 10, x: 150, y: 150 },
      { id: 11, x: 250, y: 250 },
    ],
    duration: 500,
  })
  .run({
    releasePointers: false,
  });

await mouse.tap({
  target: document.querySelector('#target'),
  pointers: {
    amount: 3,
    distance: 5,
  },
  taps: 2,
  delay: 50,
});
```
