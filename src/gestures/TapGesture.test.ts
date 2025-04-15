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
      gestures: [
        new TapGesture({
          name: 'tap',
          minPointers: 1,
          maxPointers: 1,
        }),
      ],
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
});
