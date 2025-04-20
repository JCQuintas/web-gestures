import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { PressEvent, PressGesture } from './PressGesture';

describe('PressGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'press', PressGesture<'press'>>;
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

    // Use a shorter duration for tests to make them run faster
    gestureManager = new GestureManager({
      gestures: [new PressGesture({ name: 'press', duration: 100 })],
    });

    gestureManager.registerElement('press', target);
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire press start, ongoing and end events on long press', async () => {
    // Setup listeners for all press events
    const pressStartHandler = vi.fn();
    const pressOngoingHandler = vi.fn();
    const pressEndHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('press', pressOngoingHandler);
    target.addEventListener('pressEnd', pressEndHandler);

    // Create user-event instance
    const user = userEvent.setup({ delay: 100 });

    // Start press at specific position
    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { target, coords: { x: 52, y: 52 } },
      { keys: '[/MouseLeft]', target, coords: { x: 52, y: 52 } },
    ]);

    // Verify press events were fired
    expect(pressStartHandler).toHaveBeenCalledTimes(1);
    expect(pressOngoingHandler).toHaveBeenCalledTimes(1);
    expect(pressEndHandler).toHaveBeenCalledTimes(1);

    // Verify event data for pressStart
    const startEvent = pressStartHandler.mock.calls[0][0] as PressEvent;
    expect(startEvent.detail.phase).toBe('start');
    expect(startEvent.detail.x).toBeCloseTo(50);
    expect(startEvent.detail.y).toBeCloseTo(50);

    // Verify event data for pressEnd
    const endEvent = pressEndHandler.mock.calls[0][0] as PressEvent;
    expect(endEvent.detail.phase).toBe('end');
    expect(endEvent.detail.x).toBeCloseTo(52);
    expect(endEvent.detail.y).toBeCloseTo(52);
    expect(endEvent.detail.duration).toBeGreaterThanOrEqual(100);
  });

  it('should not trigger press if released before duration threshold', async () => {
    // Setup listeners for all press events
    const pressStartHandler = vi.fn();
    const pressEndHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('pressEnd', pressEndHandler);

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Start press
    await user.pointer([{ keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } }]);

    // Wait for less than the press threshold
    vi.advanceTimersByTime(50);

    // End the press before threshold
    await user.pointer([{ keys: '[/MouseLeft]', target, coords: { x: 50, y: 50 } }]);

    // Verify no press events were fired
    expect(pressStartHandler).not.toHaveBeenCalled();
    expect(pressEndHandler).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should cancel press if pointer moves beyond maxDistance', async () => {
    // Setup listeners for all press events
    const pressStartHandler = vi.fn();
    const pressCancelHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('pressCancel', pressCancelHandler);

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Start press
    await user.pointer([{ keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } }]);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Verify pressStart was fired
    expect(pressStartHandler).toHaveBeenCalledTimes(1);

    // Move beyond maxDistance
    await user.pointer([{ target, coords: { x: 70, y: 70 } }]);

    // Verify pressCancel was fired
    expect(pressCancelHandler).toHaveBeenCalledTimes(1);

    // End the press
    await user.pointer([{ keys: '[/MouseLeft]', target, coords: { x: 70, y: 70 } }]);

    vi.useRealTimers();
  });

  it('should allow changing options dynamically', async () => {
    // Change maxDistance to allow more movement
    gestureManager.setGestureOptions('press', target, {
      maxDistance: 30,
    });

    // Setup listeners for press events
    const pressStartHandler = vi.fn();
    const pressCancelHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('pressCancel', pressCancelHandler);

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Start press
    await user.pointer([{ keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } }]);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Move within the new larger maxDistance
    await user.pointer([{ target, coords: { x: 70, y: 70 } }]);

    // Verify pressStart was fired but not pressCancel
    expect(pressStartHandler).toHaveBeenCalledTimes(1);
    expect(pressCancelHandler).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should handle multi-pointer press', async () => {
    // Reconfigure gesture with multi-pointer support
    gestureManager.setGestureOptions('press', target, {
      minPointers: 2,
      maxPointers: 2,
    });

    // Setup listener
    const pressStartHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Simulate a two-finger press
    await user.pointer([
      // First pointer down
      { keys: '[TouchA>]', target, coords: { x: 45, y: 45 } },
      // Second pointer down
      { keys: '[TouchB>]', target, coords: { x: 55, y: 55 } },
    ]);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Verify the press event was fired
    expect(pressStartHandler).toHaveBeenCalledTimes(1);

    // Verify the centroid position is between the two pointers
    const event = pressStartHandler.mock.calls[0][0] as PressEvent;
    expect(event.detail.x).toBeCloseTo(50);
    expect(event.detail.y).toBeCloseTo(50);

    vi.useRealTimers();
  });

  it('should respect preventDefault and stopPropagation options', async () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('press', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(PointerEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(PointerEvent.prototype, 'stopPropagation');

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Start press
    await user.pointer([{ keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } }]);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should cancel press on pointercancel event', async () => {
    // Setup listeners
    const pressStartHandler = vi.fn();
    const pressCancelHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('pressCancel', pressCancelHandler);

    // Mock the timer functions
    vi.useFakeTimers();

    // Manually dispatch events since userEvent doesn't support pointercancel
    const pointerdownEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: 50,
      clientY: 50,
    });
    target.dispatchEvent(pointerdownEvent);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Verify pressStart was fired
    expect(pressStartHandler).toHaveBeenCalledTimes(1);

    // Then dispatch pointercancel
    const pointercancelEvent = new PointerEvent('pointercancel', {
      bubbles: true,
      clientX: 50,
      clientY: 50,
    });
    target.dispatchEvent(pointercancelEvent);

    // Verify cancel was called
    expect(pressCancelHandler).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should include accurate duration in press events', async () => {
    // Setup listeners
    const pressStartHandler = vi.fn();
    const pressOngoingHandler = vi.fn();
    const pressEndHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);
    target.addEventListener('press', pressOngoingHandler);
    target.addEventListener('pressEnd', pressEndHandler);

    // Create user-event instance
    const user = userEvent.setup({ delay: 100 });

    await user.pointer([
      { keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } },
      { keys: '[/MouseLeft]', target, coords: { x: 52, y: 52 } },
    ]);

    // Verify all events were fired
    expect(pressStartHandler).toHaveBeenCalledTimes(1);
    expect(pressOngoingHandler).toHaveBeenCalledTimes(1);
    expect(pressEndHandler).toHaveBeenCalledTimes(1);

    // Verify duration values increase over time
    const startEvent = pressStartHandler.mock.calls[0][0] as PressEvent;
    const ongoingEvent = pressOngoingHandler.mock.calls[0][0] as PressEvent;
    const endEvent = pressEndHandler.mock.calls[0][0] as PressEvent;

    expect(ongoingEvent.detail.duration).toBe(startEvent.detail.duration);
    expect(endEvent.detail.duration).toBeGreaterThan(ongoingEvent.detail.duration);
  });

  it('should include active gestures in event detail', async () => {
    // Setup listener
    const pressStartHandler = vi.fn();
    target.addEventListener('pressStart', pressStartHandler);

    // Create user-event instance
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Mock the timer functions
    vi.useFakeTimers();

    // Start press
    await user.pointer([{ keys: '[MouseLeft>]', target, coords: { x: 50, y: 50 } }]);

    // Wait for press duration threshold
    vi.advanceTimersByTime(120);

    // Verify event includes active gestures
    const event = pressStartHandler.mock.calls[0][0] as PressEvent;
    expect(event.detail.activeGestures).toBeDefined();
    expect(event.detail.activeGestures.press).toBe(true);

    vi.useRealTimers();
  });
});
