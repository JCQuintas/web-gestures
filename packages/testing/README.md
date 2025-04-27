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

The main entry point is the `userGesture` object, which has methods for each gesture type:

```typescript
import { userGesture } from '@web-gestures/testing';

// Simulate a pan gesture
await userGesture.pan({
  element: myElement,
  start: { x: 50, y: 50 },
  end: { x: 150, y: 150 },
});

// Simulate a pinch gesture
await userGesture.pinch({
  element: myElement,
  center: { x: 100, y: 100 },
  startDistance: 50,
  endDistance: 150,
});
```

## API Reference

### Global Setup

You can set global options that will apply to all gesture simulations:

```typescript
import { userGesture } from '@web-gestures/testing';

// Set global options
userGesture.setup({
  element: document.getElementById('gesture-target'), // Default element
  pointerType: 'touch', // Default pointer type
});

// Now you can omit these options in individual gesture calls
await userGesture.pan({
  start: { x: 50, y: 50 },
  end: { x: 150, y: 150 },
});
```

### Common Options

All gesture methods accept these common properties:

- `element`: The target element to perform the gesture on
- `pointerType`: Type of pointer ('mouse', 'touch', or 'pen') - defaults to 'mouse'
- `skipPointerDown`: If true, skips the initial pointer down event (useful for chaining gestures)
- `skipPointerUp`: If true, skips the final pointer up event (useful for chaining gestures)

### Pan (Drag) Gesture

```typescript
await userGesture.pan({
  element: HTMLElement,
  start: { x: number, y: number }, // Start position
  end: { x: number, y: number }, // End position
  duration?: number, // Duration in ms (default: 300)
  steps?: number // Number of intermediate points (default: 10)
});
```

### Pinch Gesture

```typescript
await userGesture.pinch({
  element: HTMLElement,
  center: { x: number, y: number }, // Center position
  startDistance: number, // Initial distance between points
  endDistance: number, // Final distance between points
  duration?: number, // Duration in ms (default: 300)
  steps?: number // Number of intermediate points (default: 10)
});
```

### Rotate Gesture

```typescript
await userGesture.rotate({
  element: HTMLElement,
  center: { x: number, y: number }, // Center of rotation
  radius?: number, // Radius of rotation (default: 50)
  startAngle?: number, // Starting angle in degrees (default: 0)
  endAngle?: number, // Ending angle in degrees (default: 90)
  duration?: number, // Duration in ms (default: 300)
  steps?: number // Number of intermediate points (default: 10)
});
```

### Press (Long-press) Gesture

```typescript
await userGesture.press({
  element: HTMLElement,
  position: { x: number, y: number }, // Position of the press
  duration?: number // Duration in ms (default: 500)
});
```

### Tap Gesture

```typescript
await userGesture.tap({
  element: HTMLElement,
  position: { x: number, y: number }, // Position of the tap
  taps?: number, // Number of taps (default: 1)
  delay?: number // Delay between taps in ms (default: 100)
});
```

### Move (Hover) Gesture

```typescript
await userGesture.move({
  element: HTMLElement,
  start: { x: number, y: number }, // Start position
  end: { x: number, y: number }, // End position
  duration?: number, // Duration in ms (default: 300)
  steps?: number // Number of intermediate points (default: 10)
});
```

### Wheel (Scroll) Gesture

```typescript
await userGesture.wheel({
  element: HTMLElement,
  position: { x: number, y: number }, // Position for wheel event
  deltaX?: number, // Horizontal scroll amount (default: 0)
  deltaY?: number, // Vertical scroll amount (default: 100)
  deltaZ?: number, // Z-axis scroll amount (default: 0)
  steps?: number, // Number of wheel events (default: 1)
  stepDelay?: number // Delay between events in ms (default: 50)
});
```

## Examples

### Example: Testing Pan Gesture

```typescript
import { userGesture } from '@web-gestures/testing';

// In your test
test('element responds to pan gesture', async () => {
  // Get the element to test
  const element = document.getElementById('my-element');

  // Simulate the pan gesture
  await userGesture.pan({
    element,
    start: { x: 50, y: 50 },
    end: { x: 150, y: 100 },
  });

  // Assert the expected result
  expect(/* your assertions */).toEqual(/* expected result */);
});
```

### Example: Testing Pinch Gesture

```typescript
import { userGesture } from '@web-gestures/testing';

test('element responds to pinch gesture', async () => {
  const element = document.getElementById('my-element');

  await userGesture.pinch({
    element,
    center: { x: 100, y: 100 },
    startDistance: 100,
    endDistance: 200,
  });

  // Assert the expected result
});
```

## Chaining Gestures

You can chain multiple gestures together by using the `skipPointerUp` and `skipPointerDown` options:

```typescript
// First gesture: Pan
await userGesture.pan({
  element,
  start: { x: 50, y: 50 },
  end: { x: 150, y: 50 },
  skipPointerUp: true, // Keep the pointer down after panning
});

// Second gesture: Pinch from the end point of the pan
await userGesture.pinch({
  element,
  center: { x: 150, y: 50 }, // Same as pan end position
  startDistance: 100,
  endDistance: 200,
  skipPointerDown: true, // Skip the pointer down since it's already down
});
```

## Advanced Usage

For advanced scenarios, you can also access the underlying simulator classes directly:

```typescript
import { PanSimulator } from '@web-gestures/testing';

const simulator = new PanSimulator({
  element: myElement,
  start: { x: 0, y: 0 },
  end: { x: 100, y: 100 },
});

await simulator.simulatePan();
```

## License

MIT
