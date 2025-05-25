# @web-gestures/matchers

Custom Vitest matchers for testing web gestures.

## Installation

```bash
npm install --save-dev @web-gestures/matchers
# or
yarn add --dev @web-gestures/matchers
# or
pnpm add -D @web-gestures/matchers
```

## Usage

Add the matchers to your Vitest setup file:

```ts
// In your vitest.setup.ts or similar
import { matchers } from '@web-gestures/matchers';

expect.extend(matchers);
```

Now you can use the custom matchers in your tests:

```ts
import { expect, test } from 'vitest';

test('handle move gesture', () => {
  const element = document.createElement('div');
  // Trigger some gesture on the element

  // Use matchers to verify the gesture behavior
  expect(receivedEvent).toBeGestureEventOfType('move');
  expect(receivedEvent).toHaveGestureProperty('deltaX', 10);
  expect(receivedEvent).toHaveGestureCoordinates(100, 200);
});
```

## Available Matchers

### `toBeGestureEventOfType(type: string)`

Checks if the received value is a gesture event of the specified type.

```ts
// Pass
expect({
  type: 'move',
  detail: { type: 'move', x: 100, y: 200 },
}).toBeGestureEventOfType('move');

// Fail
expect({ type: 'click' }).toBeGestureEventOfType('move');
```

### `toHaveGestureProperty(property: string, value?: unknown)`

Checks if the received gesture event has the specified property with an optional expected value.

```ts
const gestureEvent = {
  type: 'pinch',
  detail: {
    type: 'pinch',
    scale: 1.5,
    center: { x: 100, y: 200 },
  },
};

// Check property exists
expect(gestureEvent).toHaveGestureProperty('scale');

// Check property has specific value
expect(gestureEvent).toHaveGestureProperty('scale', 1.5);
```

### `toHaveGestureCoordinates(x: number, y: number, delta?: number)`

Checks if the received gesture event has coordinates matching the expected values, with an optional delta for floating-point comparison.

```ts
const gestureEvent = {
  type: 'pan',
  detail: {
    type: 'pan',
    x: 100,
    y: 200,
  },
};

// Exact coordinates
expect(gestureEvent).toHaveGestureCoordinates(100, 200);

// Coordinates within delta
expect(gestureEvent).toHaveGestureCoordinates(100.005, 200.008, 0.01);
```
