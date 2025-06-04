# @web-gestures/core

This package provides a configurable and extensible API for detecting and handling user gestures in web applications. It supports a wide range of gesture types including tap, press, move, pan, pinch, rotate, and wheel gestures.

You can also create custom gestures by extending the base gesture classes provided in this library.

## Installation

```bash
# Using npm
npm install @web-gestures/core

# Using pnpm
pnpm add @web-gestures/core

# Using yarn
yarn add @web-gestures/core
```

## Basic Usage

```javascript
import { GestureManager, TapGesture, PanGesture } from '@web-gestures/core';

// Initialize gesture manager with pre-configured gestures
const gestureManager = new GestureManager({
  gestures: [
    new TapGesture({
      // Required name, it is used to generate the event names
      name: 'tap',
    }),
    new PanGesture({
      name: 'pan',
    }),
  ],
});

// Register elements for gestures - return value is an element with typed event listeners
const target = gestureManager.registerElement(
  ['tap', 'pan'], // Gestures to enable
  document.getElementById('gesture-target')
);

// Add event listeners with properly typed event data
target.addEventListener('tap', event => {
  const detail = event.detail;
  console.log(`Tap at: x=${detail.x}, y=${detail.y}`);
});

target.addEventListener('panStart', event => {
  console.log('Pan started', event.detail.centroid);
});

target.addEventListener('pan', event => {
  // Update element position based on pan
  const targetX = event.detail.totalDeltaX;
  const targetY = event.detail.totalDeltaY;
  target.style.transform = `translate(${targetX}px, ${targetY}px)`;
});
```

## Supported Gestures

### Tap Gesture

Detects when a user taps on an element. Configurable for number of taps and pointers required.

```javascript
import { TapGesture } from '@web-gestures/core';

const tapGesture = new TapGesture({
  name: 'tap', // Optional name for the gesture
  pointers: 1, // Number of pointers required (fingers/mouse)
  taps: 1, // Number of taps required (1 for single tap, 2 for double tap, etc.)
  interval: 300, // Maximum time between taps (ms)
  maxDistance: 10, // Maximum distance pointer can move for it to still be a tap
  preventDefault: true, // Prevent default browser behavior
});

tapGesture.addEventListener('tap', event => console.log(event.detail));
```

### Press Gesture

Detects when a user presses and holds on an element for a specified duration.

```javascript
import { PressGesture } from '@web-gestures/core';

const pressGesture = new PressGesture({
  name: 'press', // Required name for the gesture
  minPointers: 1, // Minimum number of pointers required
  maxPointers: 1, // Maximum number of pointers allowed
  duration: 500, // Time required to hold (ms)
  maxDistance: 10, // Maximum distance pointer can move during press
  threshold: 0, // Distance threshold for gesture activation (px)
  preventDefault: true, // Prevent default browser behavior
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

pressGesture.addEventListener('pressStart', event => console.log(event.detail));
pressGesture.addEventListener('press', event => console.log(event.detail));
pressGesture.addEventListener('pressEnd', event => console.log(event.detail));
```

### Move Gesture

Detects when a pointer enters, moves within, and leaves an element. This gesture doesn't work with touch pointers.

```javascript
import { MoveGesture } from '@web-gestures/core';

const moveGesture = new MoveGesture({
  name: 'move', // Required name for the gesture
  minPointers: 1, // Minimum number of pointers required
  maxPointers: 1, // Maximum number of pointers allowed
  threshold: 0, // Distance threshold for gesture activation (px)
  preventDefault: false, // Prevent default browser behavior
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

moveGesture.addEventListener('moveStart', event => console.log(event.detail));
moveGesture.addEventListener('move', event => console.log(event.detail));
moveGesture.addEventListener('moveEnd', event => console.log(event.detail));
```

### Pan Gesture

Detects when a user drags across an element in any direction.

```javascript
import { PanGesture } from '@web-gestures/core';

const panGesture = new PanGesture({
  name: 'pan', // Required name for the gesture
  minPointers: 1, // Minimum number of pointers required
  maxPointers: Infinity, // Maximum number of pointers allowed
  threshold: 10, // Distance threshold for gesture activation (px)
  direction: ['up', 'down', 'left', 'right'], // Allowed directions
  preventDefault: true, // Prevent default browser behavior
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

panGesture.addEventListener('panStart', event => console.log(event.detail));
panGesture.addEventListener('pan', event => console.log(event.detail));
panGesture.addEventListener('panEnd', event => console.log(event.detail));
panGesture.addEventListener('panCancel', event => console.log(event.detail));
```

### Pinch Gesture

Detects when a user pinches in or out on an element using two or more pointers.

```javascript
import { PinchGesture } from '@web-gestures/core';

const pinchGesture = new PinchGesture({
  name: 'pinch', // Required name for the gesture
  minPointers: 2, // Minimum number of pointers required
  maxPointers: Infinity, // Maximum number of pointers allowed
  threshold: 2, // Distance threshold for gesture activation (px)
  preventDefault: true, // Prevent default browser behavior
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

pinchGesture.addEventListener('pinchStart', event => console.log(event.detail));
pinchGesture.addEventListener('pinch', event => console.log(event.detail));
pinchGesture.addEventListener('pinchEnd', event => console.log(event.detail));
pinchGesture.addEventListener('pinchCancel', event => console.log(event.detail));
```

### Rotate Gesture

Detects when a user rotates pointers around a center point.

```javascript
import { RotateGesture } from '@web-gestures/core';

const rotateGesture = new RotateGesture({
  name: 'rotate', // Required name for the gesture
  minPointers: 2, // Minimum number of pointers required
  maxPointers: Infinity, // Maximum number of pointers allowed
  threshold: 0, // Distance threshold for gesture activation (px)
  preventDefault: true, // Prevent default browser behavior
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

rotateGesture.addEventListener('rotateStart', event => console.log(event.detail));
rotateGesture.addEventListener('rotate', event => console.log(event.detail));
rotateGesture.addEventListener('rotateEnd', event => console.log(event.detail));
rotateGesture.addEventListener('rotateCancel', event => console.log(event.detail));
```

### Turn Wheel Gesture

Detects mouse wheel events on an element.

```javascript
import { TurnWheelGesture } from '@web-gestures/core';

const turnWheelGesture = new TurnWheelGesture({
  name: 'turnWheel', // Required name for the gesture
  sensitivity: 1, // Sensitivity multiplier for wheel events
  max: Number.MAX_SAFE_INTEGER, // Maximum value for accumulated deltas
  min: Number.MIN_SAFE_INTEGER, // Minimum value for accumulated deltas
  initialDelta: 0, // Initial value for totalDelta values
  invert: false, // Invert the direction of delta changes
  preventDefault: true, // Prevent default browser scrolling
  stopPropagation: false, // Stop event propagation
  preventIf: [], // Gesture names that should prevent this gesture
});

turnWheelGesture.addEventListener('turnWheel', event => console.log(event.detail));
```

## Advanced Usage

### Combining Multiple Gestures

```javascript
// Add multiple gestures to the same element
const target = gestureManager.registerElement(['pan', 'pinch', 'rotate'], element);

// Handle multiple gesture events
target.addEventListener('pinch', event => {
  const scale = event.detail.totalScale;
  // Update scale transform
});

target.addEventListener('rotate', event => {
  const rotation = event.detail.totalRotation;
  // Update rotation transform
});

target.addEventListener('pan', event => {
  const tx = event.detail.totalDeltaX;
  const ty = event.detail.totalDeltaY;
  // Update position transform
});

// Combined transform example
function updateElementTransform(el, { scale, rotation, translateX, translateY }) {
  const transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`;
  el.style.transform = transform;
}
```

### Gesture Conflict Resolution

You can specify which gestures should take precedence:

```javascript
import { GestureManager, PanGesture, PinchGesture } from '@web-gestures/core';

const gestureManager = new GestureManager({
  gestures: [
    new PanGesture({
      name: 'pan',
      preventIf: ['pinch'], // Pan will be prevented when pinch is active
    }),
    new PinchGesture({
      name: 'pinch',
      preventIf: [], // Pinch has priority over other gestures
    }),
  ],
});
```

## Testing

For testing your gesture-based interfaces, use the `@web-gestures/testing` package, which provides utilities for simulating gesture events.
