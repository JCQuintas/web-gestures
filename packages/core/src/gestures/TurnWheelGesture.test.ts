// filepath: /Users/jcquintas/dev/gesture-events-2/packages/core/src/gestures/TurnWheelGesture.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { TurnWheelEvent, TurnWheelGesture } from './TurnWheelGesture';

describe('TurnWheelGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'turnWheel', TurnWheelGesture<'turnWheel'>>;
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
      gestures: [new TurnWheelGesture({ name: 'turnWheel' })],
    });

    gestureManager.registerElement('turnWheel', target);
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire wheel ongoing events on wheel events', () => {
    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create a wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaX: 0,
      deltaY: 100,
      deltaZ: 0,
      deltaMode: 0,
      clientX: 150,
      clientY: 150,
      bubbles: true,
    });

    // Dispatch the wheel event on target
    target.dispatchEvent(wheelEvent);

    // Verify wheel event was fired
    expect(wheelHandler).toHaveBeenCalledTimes(1);

    const event = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event.detail.phase).toBe('ongoing');
    expect(event.detail.deltaY).toBe(-100); // Default is inverted=false
    expect(event.detail.totalDeltaY).toBe(-100);
    expect(event.detail.centroid).toBeDefined();
    expect(event.detail.srcEvent).toBe(wheelEvent);
  });

  it('should respect preventDefault and stopPropagation options', () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('turnWheel', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(WheelEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(WheelEvent.prototype, 'stopPropagation');

    // Create and dispatch a wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should respect sensitivity option', () => {
    // Reconfigure with custom sensitivity
    gestureManager.setGestureOptions('turnWheel', target, {
      sensitivity: 2.5,
    });

    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch a wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent);

    // Verify wheel event was fired with scaled delta values
    const event = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event.detail.deltaY).toBe(-250); // 100 * 2.5 * -1
    expect(event.detail.totalDeltaY).toBe(-250); // 100 * 2.5 * -1
  });

  it('should respect invert option', () => {
    // Reconfigure with inverted direction
    gestureManager.setGestureOptions('turnWheel', target, {
      invert: true,
    });

    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch a wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent);

    // Verify wheel event was fired with inverted delta values
    const event = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event.detail.deltaY).toBe(100); // Non-inverted would be -100
    expect(event.detail.totalDeltaY).toBe(100);
  });

  it('should accumulate total delta values across multiple events', () => {
    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch first wheel event
    const wheelEvent1 = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent1);

    // Create and dispatch second wheel event
    const wheelEvent2 = new WheelEvent('wheel', {
      deltaY: 50,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent2);

    // Verify total deltas accumulate correctly
    expect(wheelHandler).toHaveBeenCalledTimes(2);

    const event2 = wheelHandler.mock.calls[1][0] as TurnWheelEvent;
    expect(event2.detail.deltaY).toBe(-50); // Just the current delta
    expect(event2.detail.totalDeltaY).toBe(-150); // Accumulated deltas (-100 + -50)
  });

  it('should respect min and max options for delta values', () => {
    // Reconfigure with min and max limits
    gestureManager.setGestureOptions('turnWheel', target, {
      min: -100,
      max: 100,
    });

    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch wheel event that would exceed max
    const wheelEvent1 = new WheelEvent('wheel', {
      deltaY: -150, // Should be clamped
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent1);

    // Verify the totalDeltaY is clamped to max
    const event1 = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event1.detail.totalDeltaY).toBe(100); // Clamped to max (150 inverted → 100)

    // Create and dispatch wheel event that would exceed min
    const wheelEvent2 = new WheelEvent('wheel', {
      deltaY: 300, // Should be clamped
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent2);

    // Verify the totalDeltaY is clamped to min
    const event2 = wheelHandler.mock.calls[1][0] as TurnWheelEvent;
    expect(event2.detail.totalDeltaY).toBe(-100); // Clamped to min (-300 → -100)
  });

  it('should set initial delta values correctly', () => {
    // Recreate gesture manager with initial delta
    gestureManager.destroy();

    gestureManager = new GestureManager({
      gestures: [
        new TurnWheelGesture({
          name: 'turnWheel',
          initialDelta: 50,
        }),
      ],
    });

    gestureManager.registerElement('turnWheel', target);

    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent);

    // Verify total delta started from initialDelta
    const event = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event.detail.totalDeltaY).toBe(-50); // 50 (initial) + (-100)
  });

  it('should support cloning the gesture with new options', () => {
    // Create original gesture
    const originalGesture = new TurnWheelGesture({
      name: 'turnWheel',
      preventDefault: false,
      sensitivity: 1,
      max: 1000,
    });

    // Clone with overrides
    const clonedGesture = originalGesture.clone({
      preventDefault: true,
      sensitivity: 2,
    });

    // Verify original properties are maintained
    expect(clonedGesture.name).toBe('turnWheel');
    expect(clonedGesture['max']).toBe(1000);

    // Verify overridden properties
    expect(clonedGesture['preventDefault']).toBe(true);
    expect(clonedGesture['sensitivity']).toBe(2);
  });

  it('should allow updating options after initialization', () => {
    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create first wheel event before updating options
    const wheelEvent1 = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent1);

    // Verify standard behavior
    const event1 = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event1.detail.deltaY).toBe(-100);

    // Update options
    gestureManager.setGestureOptions('turnWheel', target, {
      sensitivity: 2,
      invert: true,
    });

    // Create second wheel event after updating options
    const wheelEvent2 = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent2);

    // Verify updated behavior
    const event2 = wheelHandler.mock.calls[1][0] as TurnWheelEvent;
    expect(event2.detail.deltaY).toBe(200); // 100 * 2 * 1 (inverted)
  });

  it('should include active gestures in event detail', () => {
    // Setup listener
    const wheelHandler = vi.fn();
    target.addEventListener('turnWheel', wheelHandler);

    // Create and dispatch wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    target.dispatchEvent(wheelEvent);

    // Verify event includes active gestures
    const event = wheelHandler.mock.calls[0][0] as TurnWheelEvent;
    expect(event.detail.activeGestures).toBeDefined();
  });
});
