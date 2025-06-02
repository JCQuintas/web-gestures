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

## Basic Usage

The testing library provides two main user gesture simulators:

- `MouseUserGesture`: Simulates mouse-based interactions (tap, press, move, pan, wheel)
- `TouchUserGesture`: Simulates touch-based interactions (tap, press, pan, pinch, rotate)

### Mouse Gesture Simulation

```javascript
import { MouseUserGesture } from '@web-gestures/testing';
import { GestureManager, TapGesture } from '@web-gestures/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Mouse Gesture Tests', () => {
  let mouse;
  let gestureManager;
  let element;
  let tapGesture;

  beforeEach(() => {
    // Create a new mouse gesture simulator
    mouse = new MouseUserGesture();

    // Create and append a test element
    element = document.createElement('div');
    document.body.appendChild(element);

    // Set up gesture manager with a tap gesture
    gestureManager = new GestureManager();
    tapGesture = new TapGesture({ pointers: 1, taps: 1 });
    gestureManager.addGesture(tapGesture, element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle tap gesture', async () => {
    // Set up spy
    const tapHandler = vi.fn();
    tapGesture.addEventListener('tap', tapHandler);

    // Simulate a tap on the element
    await mouse.tap(element);

    // Verify the handler was called
    expect(tapHandler).toHaveBeenCalled();
  });

  it('should handle double tap gesture', async () => {
    // Configure tap gesture for double taps
    const doubleTapGesture = new TapGesture({ pointers: 1, taps: 2 });
    gestureManager.addGesture(doubleTapGesture, element);

    const doubleTapHandler = vi.fn();
    doubleTapGesture.addEventListener('tap', doubleTapHandler);

    // Simulate a double tap
    await mouse.tap(element, { taps: 2 });

    expect(doubleTapHandler).toHaveBeenCalled();
  });
});
```

### Touch Gesture Simulation

```javascript
import { TouchUserGesture } from '@web-gestures/testing';
import { GestureManager, PinchGesture, RotateGesture } from '@web-gestures/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Touch Gesture Tests', () => {
  let touch;
  let gestureManager;
  let element;

  beforeEach(() => {
    // Create a new touch gesture simulator
    touch = new TouchUserGesture();

    // Create and append a test element
    element = document.createElement('div');
    document.body.appendChild(element);

    // Set up gesture manager
    gestureManager = new GestureManager();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle pinch gesture', async () => {
    // Create and add pinch gesture
    const pinchGesture = new PinchGesture({ pointers: 2 });
    gestureManager.addGesture(pinchGesture, element);

    // Set up spy
    const pinchHandler = vi.fn();
    pinchGesture.addEventListener('pinch', pinchHandler);

    // Simulate a pinch gesture (pinch in)
    await touch.pinch(element, {
      scale: 0.5, // Pinch in (scale < 1)
      center: { x: 100, y: 100 },
      steps: 5,
    });

    expect(pinchHandler).toHaveBeenCalled();

    // Check for specific scale value
    const eventDetail = pinchHandler.mock.calls[0][0].detail;
    expect(eventDetail.totalScale).toBeCloseTo(0.5, 1);
  });

  it('should handle rotate gesture', async () => {
    // Create and add rotate gesture
    const rotateGesture = new RotateGesture({ pointers: 2 });
    gestureManager.addGesture(rotateGesture, element);

    // Set up spy
    const rotateHandler = vi.fn();
    rotateGesture.addEventListener('rotate', rotateHandler);

    // Simulate a rotate gesture
    await touch.rotate(element, {
      angle: 90, // Rotate 90 degrees
      center: { x: 100, y: 100 },
      steps: 5,
    });

    expect(rotateHandler).toHaveBeenCalled();
  });
});
```

## Gesture Types & Options

### Tap Gesture

```javascript
// Mouse tap
await mouse.tap(element, {
  // Optional options
  taps: 2, // Number of taps (default: 1)
  delay: 100, // Delay between taps in ms (default: 50)
  pointer: {
    // Mouse pointer options
    button: 0, // Mouse button (0 = left, 1 = middle, 2 = right)
    clientX: 100, // X coordinate
    clientY: 100, // Y coordinate
  },
});

// Touch tap
await touch.tap(element, {
  taps: 2,
  delay: 100,
  pointers: {
    amount: 1, // Number of touch points
    distance: 50, // Distance between touch points
  },
});
```

### Press Gesture

```javascript
// Mouse press
await mouse.press(element, {
  duration: 500, // Press duration in ms (default: 500)
  pointer: {
    // Mouse pointer options
    button: 0, // Mouse button
    clientX: 100, // X coordinate
    clientY: 100, // Y coordinate
  },
});

// Touch press
await touch.press(element, {
  duration: 500,
  pointers: {
    amount: 1, // Number of touch points
    distance: 50, // Distance between touch points
  },
});
```

### Pan Gesture

```javascript
// Mouse pan
await mouse.pan(element, {
  start: { x: 100, y: 100 }, // Start coordinates
  end: { x: 200, y: 150 }, // End coordinates
  steps: 10, // Number of intermediate points (default: 10)
  duration: 300, // Duration of the pan in ms (default: 100)
  pointer: { button: 0 }, // Mouse button options
});

// Touch pan
await touch.pan(element, {
  start: { x: 100, y: 100 },
  end: { x: 200, y: 150 },
  steps: 10,
  duration: 300,
  pointers: {
    amount: 2, // Two-finger pan
    distance: 50, // Distance between touch points
  },
});
```

### Pinch Gesture

```javascript
// Touch pinch (only available for touch)
await touch.pinch(element, {
  scale: 0.5, // Scale factor (< 1 to pinch in, > 1 to pinch out)
  center: { x: 100, y: 100 }, // Center point of the pinch
  steps: 10, // Number of intermediate points
  duration: 300, // Duration of the pinch in ms
  startScale: 1, // Starting scale factor (default: 1)
  pointers: {
    amount: 2, // Number of touch points (default: 2)
    distance: 100, // Initial distance between touch points
  },
});
```

### Rotate Gesture

```javascript
// Touch rotate (only available for touch)
await touch.rotate(element, {
  angle: 90, // Rotation angle in degrees
  center: { x: 100, y: 100 }, // Center point of the rotation
  steps: 10, // Number of intermediate points
  duration: 300, // Duration of the rotation in ms
  startAngle: 0, // Starting angle (default: 0)
  pointers: {
    amount: 2, // Number of touch points (default: 2)
    distance: 100, // Distance between touch points
  },
});
```

### Turn Wheel Gesture

```javascript
// Mouse wheel (only available for mouse)
await mouse.turnWheel(element, {
  deltaY: 100, // Vertical scroll amount
  deltaX: 0, // Horizontal scroll amount
  deltaZ: 0, // Z-axis scroll amount
  pointer: {
    // Mouse pointer position
    clientX: 100,
    clientY: 100,
  },
});
```

## Advanced Usage

### Testing with Fake Timers

```javascript
import { MouseUserGesture } from '@web-gestures/testing';
import { vi } from 'vitest';

describe('Gesture with fake timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should work with fake timers', async () => {
    // Configure the gesture simulator to use fake timers
    const mouse = new MouseUserGesture({
      advanceTimers: async ms => {
        await vi.advanceTimersByTimeAsync(ms);
      },
    });

    // Now gestures will use the fake timer
    await mouse.press(element, { duration: 1000 });
  });
});
```

### Custom Plugins

```javascript
import { UserGesture } from '@web-gestures/testing';

// Create a custom gesture plugin
const customGesturePlugin = {
  name: 'customGesture',
  gesture: async (element, options = {}) => {
    // Custom gesture implementation
    // ...
  },
};

// Create user gesture with custom plugin
const userGesture = new UserGesture('mouse', {
  plugins: [customGesturePlugin],
});

// Use the custom gesture
await userGesture.customGesture(element, {
  /* options */
});
```

### Testing Gesture Sequences

```javascript
import { TouchUserGesture } from '@web-gestures/testing';

describe('Complex gesture sequence', () => {
  it('should handle a sequence of gestures', async () => {
    const touch = new TouchUserGesture();

    // Perform a sequence of gestures
    await touch.tap(element);
    await touch.pan(element, {
      start: { x: 100, y: 100 },
      end: { x: 200, y: 100 },
    });
    await touch.pinch(element, { scale: 1.5 });
    await touch.rotate(element, { angle: 45 });

    // Verify the final state
    // ...
  });
});
```

## Integration with Testing Frameworks

### Using with Jest

```javascript
import { MouseUserGesture } from '@web-gestures/testing';
import { GestureManager, TapGesture } from '@web-gestures/core';

describe('Gesture Component Tests with Jest', () => {
  let mouse;
  let element;

  beforeEach(() => {
    mouse = new MouseUserGesture();
    element = document.createElement('div');
    document.body.appendChild(element);

    // Setup Jest spies
    jest.spyOn(element, 'addEventListener');
  });

  it('should work with Jest spies', async () => {
    const tapGesture = new TapGesture();
    const manager = new GestureManager();
    manager.addGesture(tapGesture, element);

    await mouse.tap(element);

    // Assertions using Jest matchers
    expect(element.addEventListener).toHaveBeenCalled();
  });
});
```

### Using with Testing Library

```javascript
import { render, screen } from '@testing-library/dom';
import { MouseUserGesture } from '@web-gestures/testing';
import { GestureManager, TapGesture } from '@web-gestures/core';

describe('Integration with Testing Library', () => {
  let mouse;

  beforeEach(() => {
    mouse = new MouseUserGesture();

    // Render a component using Testing Library
    render(`
      <div>
        <button id="tap-button">Tap Me</button>
      </div>
    `);
  });

  it('should work with Testing Library', async () => {
    const button = screen.getByText('Tap Me');
    const tapHandler = jest.fn();
    button.addEventListener('tap', tapHandler);

    // Use GestureManager with the button
    const manager = new GestureManager();
    const tapGesture = new TapGesture();
    manager.addGesture(tapGesture, button);

    // Simulate a tap
    await mouse.tap(button);

    // Assert using Testing Library helpers
    expect(tapHandler).toHaveBeenCalled();
  });
});
```
