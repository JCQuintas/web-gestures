import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { PinchEvent, PinchGesture } from './PinchGesture';

describe('PinchGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'pinch', PinchGesture<'pinch'>>;
  let target: HTMLElement;
  let scaleDisplay: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '300px';
    document.body.appendChild(container);

    scaleDisplay = document.createElement('div');
    scaleDisplay.style.width = '100px';
    scaleDisplay.style.height = '100px';
    scaleDisplay.style.backgroundColor = 'red';
    scaleDisplay.style.position = 'absolute';
    scaleDisplay.style.top = '50%';
    scaleDisplay.style.left = '50%';
    scaleDisplay.style.transform = 'translate(-50%, -50%)';
    container.appendChild(scaleDisplay);

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
      gestures: [new PinchGesture({ name: 'pinch' })],
    });

    const typedTarget = gestureManager.registerElement('pinch', target);

    typedTarget.addEventListener('pinch', event => {
      const scale = event.detail.scale;
      scaleDisplay.style.transform = `translate(-50%, -50%) scale(${scale})`;
    });
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire pinch start, ongoing and end events on pinch', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchOngoingHandler = vi.fn();
    const pinchEndHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchOngoingHandler);
    target.addEventListener('pinchEnd', pinchEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pinch sequence: two pointers down, move them, release
    await user.pointer([
      // Two pointers down
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // Move pointers apart (zoom in)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Release pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Verify pinch events were fired
    expect(pinchStartHandler).toHaveBeenCalledTimes(1);
    expect(pinchOngoingHandler).toHaveBeenCalledTimes(2);
    expect(pinchEndHandler).toHaveBeenCalledTimes(1);

    // Verify event data for start event
    const startEvent = pinchStartHandler.mock.calls[0][0] as PinchEvent;
    expect(startEvent.detail.phase).toBe('start');
    expect(startEvent.detail.scale).toBeCloseTo(1); // Initial scale should be 1

    // Verify event data for ongoing event
    const moveEvent = pinchOngoingHandler.mock.calls[0][0] as PinchEvent;
    expect(moveEvent.detail.phase).toBe('ongoing');
    expect(moveEvent.detail.scale).toBeGreaterThan(1); // Scale should increase when pinching out

    // Verify event data for end event
    const endEvent = pinchEndHandler.mock.calls[0][0] as PinchEvent;
    expect(endEvent.detail.phase).toBe('end');
    expect(endEvent.detail.totalScale).toBeGreaterThan(1); // Total scale should be preserved
  });

  it('should track total scale across multiple pinch movements', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchOngoingHandler = vi.fn();
    const pinchEndHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchOngoingHandler);
    target.addEventListener('pinchEnd', pinchEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate multiple pinch segments
    await user.pointer([
      // Two pointers down
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // Move pointers apart (zoom in)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Release pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    await user.pointer([
      // Two pointers down
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // Move pointers apart (zoom in)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Release pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Verify ongoing events captured the scale changes
    expect(pinchOngoingHandler).toHaveBeenCalledTimes(4);

    // Get the final event
    const endEvent = pinchEndHandler.mock.calls[0][0] as PinchEvent;

    // Verify total scale is tracked correctly
    expect(endEvent.detail.totalScale).toBeGreaterThan(1.3333);
    expect(endEvent.detail.distance).toBeGreaterThan(0);
  });

  it('should handle pinch in (decreasing scale) correctly', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchOngoingHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchOngoingHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pinch-in gesture (fingers moving closer together)
    await user.pointer([
      // Start with two fingers far apart
      { keys: '[TouchA>]', target, coords: { x: 120, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 180, y: 150 } },
      // Move fingers closer (zooming out)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Release
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Get the ongoing event
    const moveEvent = pinchOngoingHandler.mock.calls[0][0] as PinchEvent;

    // Verify scale decreases when pinching in
    expect(moveEvent.detail.scale).toBeLessThan(1);
    expect(moveEvent.detail.totalScale).toBeLessThan(1);
  });

  it('should cancel pinch gesture on pointercancel', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchCancelHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinchCancel', pinchCancelHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Start a pinch gesture
    await user.pointer([
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
    ]);

    // Ensure the gesture started
    expect(pinchStartHandler).toHaveBeenCalledTimes(1);

    // Then dispatch pointercancel (e.g., system interruption)
    const pointercancelEvent = new PointerEvent('pointercancel', {
      bubbles: true,
      clientX: 150,
      clientY: 150,
      pointerId: 2, // Match one of the active pointers
    });
    target.dispatchEvent(pointercancelEvent);

    // Verify cancel was called
    expect(pinchCancelHandler).toHaveBeenCalledTimes(1);

    // Verify data in cancel event
    const cancelEvent = pinchCancelHandler.mock.calls[0][0] as PinchEvent;
    expect(cancelEvent.detail.phase).toBe('cancel');
  });

  it('should respect preventDefault and stopPropagation options', async () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('pinch', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(PointerEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(PointerEvent.prototype, 'stopPropagation');

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pinch
    await user.pointer([
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should include active gestures in event detail', async () => {
    // Setup listener
    const pinchStartHandler = vi.fn();
    target.addEventListener('pinchStart', pinchStartHandler);

    const user = userEvent.setup();

    // Simulate a pinch
    await user.pointer([
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
    ]);

    // Verify event includes active gestures
    const event = pinchStartHandler.mock.calls[0][0] as PinchEvent;
    expect(event.detail.activeGestures).toBeDefined();
    expect(event.detail.activeGestures.pinch).toBe(true);
  });

  it('should calculate velocity correctly during pinch', async () => {
    // Setup listener
    const pinchHandler = vi.fn();
    target.addEventListener('pinch', pinchHandler);

    // Create user-event instance with controlled timing
    const user = userEvent.setup({ delay: 100 }); // 100ms between actions

    // Simulate a pinch with controlled timing
    await user.pointer([
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Get the event
    const event = pinchHandler.mock.calls[0][0] as PinchEvent;

    // Verify velocity was calculated
    expect(event.detail.velocity).not.toBe(0);
  });

  it('should maintain gesture state when some pointers are removed', async () => {
    // Setup for a 3-finger pinch
    gestureManager.setGestureOptions('pinch', target, {
      maxPointers: 3,
    });

    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchHandler = vi.fn();
    const pinchEndHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchHandler);
    target.addEventListener('pinchEnd', pinchEndHandler);

    const touchA = 2;
    const touchB = 3;
    const touchC = 4;
    let touchIds = [touchA, touchB, touchC];

    // Using native dispatch to simulate pointer events
    // Since userEvent doesn't seem to trigger pointer events correctly in this case.

    touchIds.forEach(id => {
      target.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          clientX: 140 + id * 10,
          clientY: 150,
          pointerId: id,
          pointerType: 'touch',
        })
      );
    });

    // Move fingers apart (zoom in)
    touchIds.forEach(id => {
      target.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 130 + id * 10,
          clientY: 150,
          pointerId: id,
          pointerType: 'touch',
        })
      );
    });

    // Lift one finger (should not end the pinch)
    target.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        clientX: 130,
        clientY: 150,
        pointerId: touchA,
        pointerType: 'touch',
      })
    );

    touchIds = touchIds.filter(id => id !== touchA);

    touchIds.forEach(id => {
      target.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          clientX: 160 + id * 10,
          clientY: 150,
          pointerId: id,
          pointerType: 'touch',
        })
      );
    });

    // Release the other fingers
    touchIds.forEach(id => {
      target.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          clientX: 160 + id * 10,
          clientY: 150,
          pointerId: id,
          pointerType: 'touch',
        })
      );
    });

    // Verify the pinch continues without ending when one finger is lifted
    expect(pinchStartHandler).toHaveBeenCalledTimes(1);
    expect(pinchHandler).toHaveBeenCalledTimes(5); // Four movement events
    expect(pinchEndHandler).toHaveBeenCalledTimes(1); // Only ends when last fingers are lifted

    // Verify totalScale is preserved across the finger removal
    const lastEvent = pinchHandler.mock.calls[1][0] as PinchEvent;
    expect(lastEvent.detail.totalScale).toBeGreaterThan(1); // Scale should increase throughout
  });

  it('should indicate spreading direction (1) when fingers move apart', async () => {
    // Setup listener
    const pinchHandler = vi.fn();
    target.addEventListener('pinch', pinchHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a spreading pinch (fingers moving apart)
    await user.pointer([
      // Two pointers down close together
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // Move pointers apart (zoom in)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Get the ongoing event
    const moveEvent = pinchHandler.mock.calls[0][0] as PinchEvent;

    // Verify direction is 1 (spreading) when fingers move apart
    expect(moveEvent.detail.direction).toBe(1);
    expect(moveEvent.detail.velocity).toBeGreaterThan(0);
  });

  it('should indicate pinching direction (-1) when fingers move together', async () => {
    // Setup listener
    const pinchHandler = vi.fn();
    target.addEventListener('pinch', pinchHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pinching gesture (fingers moving together)
    await user.pointer([
      // Start with two fingers far apart
      { keys: '[TouchA>]', target, coords: { x: 120, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 180, y: 150 } },
      // Move fingers closer (zooming out)
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Get the ongoing event
    const moveEvent = pinchHandler.mock.calls[0][0] as PinchEvent;

    // Verify direction is -1 (pinching) when fingers move together
    expect(moveEvent.detail.direction).toBe(-1);
    expect(moveEvent.detail.velocity).toBeLessThan(0);
  });

  it('should include direction in all gesture phases', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchHandler = vi.fn();
    const pinchEndHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchHandler);
    target.addEventListener('pinchEnd', pinchEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a spreading pinch
    await user.pointer([
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Verify direction property is present in all event phases
    const startEvent = pinchStartHandler.mock.calls[0][0] as PinchEvent;
    expect(startEvent.detail.direction).toBeDefined();

    const ongoingEvent = pinchHandler.mock.calls[0][0] as PinchEvent;
    expect(ongoingEvent.detail.direction).toBeDefined();

    const endEvent = pinchEndHandler.mock.calls[0][0] as PinchEvent;
    expect(endEvent.detail.direction).toBeDefined();
  });

  it('should calculate deltaScale correctly between events', async () => {
    // Setup listeners
    const pinchStartHandler = vi.fn();
    const pinchHandler = vi.fn();
    const pinchEndHandler = vi.fn();

    target.addEventListener('pinchStart', pinchStartHandler);
    target.addEventListener('pinch', pinchHandler);
    target.addEventListener('pinchEnd', pinchEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a pinch sequence with distinct movements
    await user.pointer([
      // Two pointers down
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // First movement - move pointers apart
      { pointerName: 'TouchA', target, coords: { x: 130, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 170, y: 150 } },
      // Second movement - move pointers even further
      { pointerName: 'TouchA', target, coords: { x: 120, y: 150 } },
      { pointerName: 'TouchB', target, coords: { x: 180, y: 150 } },
      // Release pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Verify events were fired
    expect(pinchStartHandler).toHaveBeenCalledTimes(1);
    expect(pinchHandler).toHaveBeenCalledTimes(4); // Two movement events
    expect(pinchEndHandler).toHaveBeenCalledTimes(1);

    // Verify deltaScale in start event should be 0 (no change initially)
    const startEvent = pinchStartHandler.mock.calls[0][0] as PinchEvent;
    expect(startEvent.detail.deltaScale).toBe(0);

    // Get the scale values from each ongoing event
    const firstMoveEvent = pinchHandler.mock.calls[0][0] as PinchEvent;
    const secondMoveEvent = pinchHandler.mock.calls[1][0] as PinchEvent;

    // Verify delta scale is calculated correctly for each event
    expect(firstMoveEvent.detail.deltaScale).toBeGreaterThan(0); // First movement increases scale
    expect(secondMoveEvent.detail.deltaScale).toBeGreaterThan(0); // Second movement increases scale further

    // End event should have the last deltaScale value
    const endEvent = pinchEndHandler.mock.calls[0][0] as PinchEvent;
    expect(endEvent.detail.deltaScale).toBeDefined();
  });

  it('should report correct deltaScale when pinching in and out', async () => {
    // Setup listeners
    const pinchHandler = vi.fn();
    target.addEventListener('pinch', pinchHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate pinch out then pinch in
    await user.pointer([
      // Two pointers down
      { keys: '[TouchA>]', target, coords: { x: 140, y: 150 } },
      { keys: '[TouchB>]', target, coords: { x: 160, y: 150 } },
      // Move pointers apart (zoom in) - deltaScale > 0
      { pointerName: 'TouchB', target, coords: { x: 180, y: 150 } },
      // Move pointers together (zoom out) - deltaScale < 0
      { pointerName: 'TouchB', target, coords: { x: 165, y: 150 } },
      // Release pointers
      { keys: '[/TouchA][/TouchB]', target, coords: { x: 150, y: 150 } },
    ]);

    // Get the events
    const firstMoveEvent = pinchHandler.mock.calls[0][0] as PinchEvent;
    const secondMoveEvent = pinchHandler.mock.calls[1][0] as PinchEvent;

    // First movement should have deltaScale > 1 (zooming in)
    expect(firstMoveEvent.detail.deltaScale).toBeGreaterThan(0);

    // Second movement should have deltaScale < 1 (zooming out)
    expect(secondMoveEvent.detail.deltaScale).toBeLessThan(0);
  });
});
