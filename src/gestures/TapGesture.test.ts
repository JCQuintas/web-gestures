import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { TapEvent, TapGesture } from './TapGesture';

describe('TapGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'tap', TapGesture<'tap'>>;
  let target: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    document.body.appendChild(container);

    target = document.createElement('div');
    target.style.width = '20px';
    target.style.height = '20px';
    target.style.backgroundColor = 'red';
    target.style.position = 'absolute';
    target.style.top = '50%';
    target.style.left = '50%';
    target.style.transform = 'translate(-50%, -50%)';
    container.appendChild(target);

    gestureManager = new GestureManager({
      gestures: [new TapGesture({ name: 'tap' })],
    });

    gestureManager.registerElement('tap', target);
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire a tap event on quick tap', async () => {
    // Setup listener
    const tapHandler = vi.fn();
    target.addEventListener('tap', tapHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pointer event sequence
    await user.pointer([{ keys: '[MouseLeft]', target, coords: { x: 50, y: 50 } }]);

    // Verify the tap event was fired
    expect(tapHandler).toHaveBeenCalledTimes(1);

    // Verify event data
    const event = tapHandler.mock.calls[0][0] as TapEvent;
    expect(event.detail.phase).toBe('end');
    expect(event.detail.tapCount).toBe(1);
    expect(event.detail.x).toBeCloseTo(50);
    expect(event.detail.y).toBeCloseTo(50);
  });

  it('should not fire a tap event when moved beyond maxDistance', async () => {
    // Setup listeners
    const tapHandler = vi.fn();
    const tapCancelHandler = vi.fn();
    target.addEventListener('tap', tapHandler);
    target.addEventListener('tapCancel', tapCancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pointer event sequence with movement
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { target, coords: { x: 80, y: 80 } }, // Move more than default maxDistance (10px)
      { keys: '[/MouseLeft]', target, coords: { x: 80, y: 80 } },
    ]);

    // Verify no tap event was fired but cancel was
    expect(tapHandler).not.toHaveBeenCalled();
    expect(tapCancelHandler).toHaveBeenCalledTimes(1);
  });

  it('should allow changing options dynamically', async () => {
    gestureManager.setGestureOptions('tap', target, {
      maxDistance: 500,
    });

    // Setup listeners
    const tapHandler = vi.fn();
    const tapCancelHandler = vi.fn();
    target.addEventListener('tap', tapHandler);
    target.addEventListener('tapCancel', tapCancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pointer event sequence with movement
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { target, coords: { x: 80, y: 80 } }, // Move more than default maxDistance (10px)
      { keys: '[/MouseLeft]', target, coords: { x: 80, y: 80 } },
    ]);

    // Verify no tap event was fired but cancel was
    expect(tapHandler).toHaveBeenCalledTimes(1);
    expect(tapCancelHandler).not.toHaveBeenCalled();
  });

  it('should detect multi-tap gestures', async () => {
    gestureManager.setGestureOptions('tap', target, {
      taps: 2,
    });

    // Setup listener
    const tapHandler = vi.fn();
    target.addEventListener('tap', tapHandler);

    // Simulate a double-tap sequence
    await userEvent.pointer([
      { keys: '[MouseLeft]', target, coords: { x: 50, y: 50 } },
      { keys: '[MouseLeft]', target, coords: { x: 52, y: 52 } }, // Slight movement is ok
    ]);

    // Verify tap event was fired after second tap
    expect(tapHandler).toHaveBeenCalledTimes(1);

    // Verify event data shows 2 taps
    const event = tapHandler.mock.calls[0][0] as TapEvent;
    expect(event.detail.tapCount).toBe(2);
  });

  it('should handle multi-pointer taps', async () => {
    // Reconfigure gesture with multi-pointer support
    gestureManager.setGestureOptions('tap', target, {
      minPointers: 2,
      maxPointers: 2,
    });

    // Setup listener
    const tapHandler = vi.fn();
    const cancelHandler = vi.fn();
    target.addEventListener('tap', tapHandler);
    target.addEventListener('tapCancel', cancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a two-finger tap
    await user.pointer([
      // First pointer down
      { keys: '[TouchA>]', target, coords: { x: 45, y: 45 } },
      // Second pointer down
      { keys: '[TouchB>]', target, coords: { x: 55, y: 55 } },
      // Both pointers up
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 45, y: 45 } },
    ]);

    // Verify the tap event was fired
    expect(tapHandler).toHaveBeenCalledTimes(1);
    expect(cancelHandler).not.toHaveBeenCalled();
  });

  it('should respect preventDefault and stopPropagation options', async () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('tap', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(PointerEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(PointerEvent.prototype, 'stopPropagation');

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a tap
    await user.pointer([{ keys: '[MouseLeft]', target, coords: { x: 50, y: 50 } }]);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should include active gestures in event detail', async () => {
    // Setup listener
    const tapHandler = vi.fn();
    target.addEventListener('tap', tapHandler);

    const user = userEvent.setup();

    // Simulate a tap
    await user.pointer([{ keys: '[MouseLeft]', target, coords: { x: 50, y: 50 } }]);

    // Verify event includes active gestures
    const event = tapHandler.mock.calls[0][0] as TapEvent;
    expect(event.detail.activeGestures).toBeDefined();
    expect(event.detail.activeGestures.tap).toBe(true);
  });

  it('should cancel tap on pointercancel event', async () => {
    // Setup listeners
    const tapHandler = vi.fn();
    const cancelHandler = vi.fn();
    target.addEventListener('tap', tapHandler);
    target.addEventListener('tapCancel', cancelHandler);

    // Manually dispatch events since userEvent doesn't support pointercancel
    const pointerdownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: 50,
      clientY: 50,
    });
    target.dispatchEvent(pointerdownEvent);

    // Then dispatch pointercancel
    const pointercancelEvent = new PointerEvent('pointercancel', {
      bubbles: true,
      clientX: 50,
      clientY: 50,
    });
    target.dispatchEvent(pointercancelEvent);

    // Verify cancel was called but not tap
    expect(tapHandler).not.toHaveBeenCalled();
    expect(cancelHandler).toHaveBeenCalledTimes(1);
  });

  it('should allow movement within maxDistance', async () => {
    // Set a specific maxDistance
    gestureManager.setGestureOptions('tap', target, {
      maxDistance: 15,
    });

    // Setup listener
    const tapHandler = vi.fn();
    target.addEventListener('tap', tapHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a tap with a slight movement (less than maxDistance)
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { target, coords: { x: 60, y: 60 } }, // Move 14.14 pixels (10√2)
      { keys: '[/MouseLeft]', target, coords: { x: 60, y: 60 } },
    ]);

    // Verify tap event was fired
    expect(tapHandler).toHaveBeenCalledTimes(1);

    // Verify the coordinates in the event are the final position
    const event = tapHandler.mock.calls[0][0] as TapEvent;
    expect(event.detail.x).toBeCloseTo(60);
    expect(event.detail.y).toBeCloseTo(60);
  });

  it('should include correct data in tapCancel event', async () => {
    // Setup listener
    const cancelHandler = vi.fn();
    target.addEventListener('tapCancel', cancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a tap that moves too far
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { target, coords: { x: 80, y: 80 } }, // Move beyond maxDistance
      { keys: '[/MouseLeft]', target, coords: { x: 80, y: 80 } },
    ]);

    // Verify cancel event was fired with correct data
    expect(cancelHandler).toHaveBeenCalledTimes(1);

    const event = cancelHandler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.phase).toBe('cancel');
    expect(event.detail.x).toBeCloseTo(80);
    expect(event.detail.y).toBeCloseTo(80);
    expect(event.detail.tapCount).toBe(0);
    expect(event.detail.srcEvent).toBeDefined();
  });

  it('should detect triple-tap gestures', async () => {
    // Configure for triple-tap
    gestureManager.setGestureOptions('tap', target, {
      taps: 3,
    });

    // Setup listener
    const tapHandler = vi.fn();
    target.addEventListener('tap', tapHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a triple tap sequence
    await user.pointer([
      { keys: '[MouseLeft]', target, coords: { x: 50, y: 50 } },
      { keys: '[MouseLeft]', target, coords: { x: 51, y: 51 } },
      { keys: '[MouseLeft]', target, coords: { x: 52, y: 52 } },
    ]);

    // Verify the triple-tap event
    expect(tapHandler).toHaveBeenCalledTimes(1);
    const event = tapHandler.mock.calls[0][0] as TapEvent;
    expect(event.detail.tapCount).toBe(3);
  });
});
