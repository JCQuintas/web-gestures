// filepath: /Users/jcquintas/dev/gesture-events-2/src/gestures/PanGesture.test.ts
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { PanEvent, PanGesture } from './PanGesture';

describe('PanGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'pan', PanGesture<'pan'>>;
  let target: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '300px';
    document.body.appendChild(container);

    target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    target.style.backgroundColor = 'blue';
    target.style.position = 'absolute';
    target.style.top = '50%';
    target.style.left = '50%';
    target.style.transform = 'translate(-50%, -50%)';
    container.appendChild(target);

    gestureManager = new GestureManager({
      gestures: [new PanGesture({ name: 'pan' })],
    });

    gestureManager.registerElement('pan', target);
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire pan start, ongoing and end events on drag', async () => {
    // Setup listeners
    const panStartHandler = vi.fn();
    const panOngoingHandler = vi.fn();
    const panEndHandler = vi.fn();

    target.addEventListener('panStart', panStartHandler);
    target.addEventListener('pan', panOngoingHandler);
    target.addEventListener('panEnd', panEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a drag sequence: down, move beyond threshold, move more, end
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 170, y: 150 } }, // Move 20px horizontally (exceeds threshold)
      { target, coords: { x: 190, y: 150 } }, // Move more
      { keys: '[/MouseLeft]', target, coords: { x: 190, y: 150 } }, // Release
    ]);

    // Verify pan events were fired
    expect(panStartHandler).toHaveBeenCalledTimes(1);
    expect(panOngoingHandler).toHaveBeenCalledTimes(1);
    expect(panEndHandler).toHaveBeenCalledTimes(1);

    // Verify event data for start event
    const startEvent = panStartHandler.mock.calls[0][0] as PanEvent;
    expect(startEvent.detail.phase).toBe('start');
    expect(startEvent.detail.deltaX).toBeGreaterThanOrEqual(10); // Should be at least the threshold
    expect(startEvent.detail.deltaY).toBeCloseTo(0);
    expect(startEvent.detail.direction).toBe('right'); // Moving right

    // Verify event data for end event
    const endEvent = panEndHandler.mock.calls[0][0] as PanEvent;
    expect(endEvent.detail.phase).toBe('end');
    expect(endEvent.detail.totalDeltaX).toBeGreaterThan(0);
  });

  it('should not start pan gesture if movement is below threshold', async () => {
    // Setup listeners
    const panStartHandler = vi.fn();

    target.addEventListener('panStart', panStartHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a small movement that doesn't exceed threshold
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 155, y: 150 } }, // Move 5px (below default threshold of 10px)
      { keys: '[/MouseLeft]', target, coords: { x: 155, y: 150 } },
    ]);

    // Verify no pan events were fired
    expect(panStartHandler).not.toHaveBeenCalled();
  });

  it('should respect direction constraints', async () => {
    // Reconfigure gesture with direction constraints
    gestureManager.setGestureOptions('pan', target, {
      direction: ['right', 'left'], // Only horizontal movements allowed
    });

    // Setup listeners
    const panStartHandler = vi.fn();

    target.addEventListener('panStart', panStartHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a vertical drag that should be ignored
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 150, y: 170 } }, // Move 20px vertically
      { keys: '[/MouseLeft]', target, coords: { x: 150, y: 170 } },
    ]);

    // Verify no pan events were fired since movement was vertical
    expect(panStartHandler).not.toHaveBeenCalled();

    // Now try a horizontal movement that should be detected
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 170, y: 150 } }, // Move 20px horizontally
      { keys: '[/MouseLeft]', target, coords: { x: 170, y: 150 } },
    ]);

    // Verify pan start was called for horizontal movement
    expect(panStartHandler).toHaveBeenCalledTimes(1);
  });

  it('should cancel pan gesture on pointercancel', async () => {
    // Setup listeners
    const panStartHandler = vi.fn();
    const panHandler = vi.fn();
    const panEndHandler = vi.fn();
    const panCancelHandler = vi.fn();

    target.addEventListener('panStart', panStartHandler);
    target.addEventListener('pan', panHandler);
    target.addEventListener('panEnd', panEndHandler);
    target.addEventListener('panCancel', panCancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate multiple movement segments
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 110, y: 150 } }, // Move out of threshold
      { target, coords: { x: 190, y: 170 } }, // +20px horizontally, +20px vertically
      { target, coords: { x: 210, y: 190 }, releasePrevious: false }, // +20px horizontally, +20px vertically
    ]);

    // Ensure the gesture started
    expect(panStartHandler).toHaveBeenCalledTimes(1);
    expect(panHandler).toHaveBeenCalledTimes(2);
    expect(panEndHandler).not.toHaveBeenCalled();

    // Then dispatch pointercancel
    const pointercancelEvent = new PointerEvent('contextmenu', {
      bubbles: true,
      clientX: 180,
      clientY: 150,
    });
    container.dispatchEvent(pointercancelEvent);

    // Verify cancel was called
    expect(panCancelHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle multi-pointer panning', async () => {
    // Reconfigure gesture for multi-pointer support
    gestureManager.setGestureOptions('pan', target, {
      minPointers: 2,
      maxPointers: 2,
    });

    // Setup listeners
    const panStartHandler = vi.fn();
    const panOngoingHandler = vi.fn();
    const panEndHandler = vi.fn();

    target.addEventListener('panStart', panStartHandler);
    target.addEventListener('pan', panOngoingHandler);
    target.addEventListener('panEnd', panEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a two-finger pan
    await user.pointer([
      // First pointer down
      { keys: '[TouchA>][TouchB>]', target, coords: { x: 140, y: 150 } },
      // Trigger threshold
      { pointerName: 'TouchA', target, coords: { x: 150, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Move both pointers
      { pointerName: 'TouchA', target, coords: { x: 170, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 190, y: 150 } },
      // Release both pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 190, y: 150 } },
    ]);

    // Verify pan events were fired
    expect(panStartHandler).toHaveBeenCalledTimes(1);
    expect(panEndHandler).toHaveBeenCalledTimes(1);

    // Check event details
    const event = panStartHandler.mock.calls[0][0] as PanEvent;
    expect(event.detail.pointers.length).toBe(2);
  });

  it('should track total delta across multiple moves', async () => {
    // Setup listeners
    const panOngoingHandler = vi.fn();
    const panEndHandler = vi.fn();

    target.addEventListener('pan', panOngoingHandler);
    target.addEventListener('panEnd', panEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate multiple movement segments
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 160, y: 150 } }, // Move out of threshold
      { target, coords: { x: 190, y: 170 } }, // +30px horizontally, +20px vertically
      { target, coords: { x: 210, y: 190 } }, // +20px horizontally, +20px vertically
      { keys: '[/MouseLeft]', target, coords: { x: 210, y: 190 } },
    ]);

    // Get the final event
    const endEvent = panEndHandler.mock.calls[0][0] as PanEvent;

    // Verify total deltas
    expect(endEvent.detail.totalDeltaX).toBeCloseTo(50); // Total horizontal movement
    expect(endEvent.detail.totalDeltaY).toBeCloseTo(40); // Total vertical movement
    expect(endEvent.detail.deltaX).toBeGreaterThan(0); // Delta from start position
    expect(endEvent.detail.deltaY).toBeGreaterThan(0);
  });

  it('should respect preventDefault and stopPropagation options', async () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('pan', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(PointerEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(PointerEvent.prototype, 'stopPropagation');

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pan
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 170, y: 150 } }, // Move beyond threshold
      { keys: '[/MouseLeft]', target, coords: { x: 170, y: 150 } },
    ]);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should calculate velocity correctly', async () => {
    // Setup listener
    const panEndHandler = vi.fn();
    target.addEventListener('panEnd', panEndHandler);

    // Create user-event instance with controlled timing
    const user = userEvent.setup({ delay: 100 }); // 100ms between actions

    // Simulate a drag with controlled timing
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 250, y: 150 } }, // Move 100px horizontally
      { keys: '[/MouseLeft]', target, coords: { x: 250, y: 150 } },
    ]);

    // Get the final event
    const endEvent = panEndHandler.mock.calls[0][0] as PanEvent;

    // Verify velocity calculations
    expect(endEvent.detail.velocityX).toBeGreaterThan(0); // Should have positive x velocity
    expect(endEvent.detail.velocityY).toBeCloseTo(0, 1); // Y velocity should be near zero
    expect(endEvent.detail.velocity).toBeGreaterThan(0); // Overall velocity should be positive
  });

  it('should include active gestures in event detail', async () => {
    // Setup listener
    const panStartHandler = vi.fn();
    target.addEventListener('panStart', panStartHandler);

    const user = userEvent.setup();

    // Simulate a pan
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 170, y: 150 } }, // Move beyond threshold
      { keys: '[/MouseLeft]', target, coords: { x: 170, y: 150 } },
    ]);

    // Verify event includes active gestures
    const event = panStartHandler.mock.calls[0][0] as PanEvent;
    expect(event.detail.activeGestures).toBeDefined();
    expect(event.detail.activeGestures.pan).toBe(true);
  });

  it('should allow changing options dynamically', async () => {
    // Change threshold after initialization
    gestureManager.setGestureOptions('pan', target, {
      threshold: 30, // Higher threshold
    });

    // Setup listeners
    const panStartHandler = vi.fn();
    target.addEventListener('panStart', panStartHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a small drag that would trigger the original threshold but not the new one
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 170, y: 150 } }, // Move 20px (below new threshold of 30px)
      { keys: '[/MouseLeft]', target, coords: { x: 170, y: 150 } },
    ]);

    // Verify no pan was triggered with higher threshold
    expect(panStartHandler).not.toHaveBeenCalled();

    // Now try a larger movement that should trigger with the new threshold
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 150, y: 150 } },
      { target, coords: { x: 190, y: 150 } }, // Move 40px (above threshold)
      { keys: '[/MouseLeft]', target, coords: { x: 190, y: 150 } },
    ]);

    // Verify pan was triggered
    expect(panStartHandler).toHaveBeenCalledTimes(1);
  });
});
