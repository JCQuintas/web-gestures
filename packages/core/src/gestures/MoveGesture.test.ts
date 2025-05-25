import { mouseGesture } from '@web-gestures/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { MoveGesture } from './MoveGesture';

describe('Move Gesture', () => {
  let container: HTMLElement;
  let target: HTMLElement;
  let gestureManager: GestureManager<'move', MoveGesture<'move'>, MoveGesture<'move'>>;
  let events: string[];

  beforeEach(() => {
    events = [];

    // Set up DOM
    container = document.createElement('div');
    container.style.width = '200px';
    container.style.height = '200px';
    document.body.appendChild(container);

    // Set up gesture manager
    gestureManager = new GestureManager({
      gestures: [
        new MoveGesture({
          name: 'move',
          threshold: 0,
        }),
      ],
    });

    // Set up target element
    target = document.createElement('div');
    target.style.width = '50px';
    target.style.height = '50px';
    target.style.backgroundColor = 'red';
    target.style.position = 'absolute';
    target.style.top = '75px';
    target.style.left = '75px';
    container.appendChild(target);

    const gestureTarget = gestureManager.registerElement('move', target);

    // Add event listeners
    gestureTarget.addEventListener('moveStart', e => {
      const detail = e.detail;
      const srcEvent = detail.srcEvent;
      events.push(
        `moveStart: ${srcEvent.pointerId} | x: ${detail.centroid.x} | y: ${detail.centroid.y}`
      );
    });
    gestureTarget.addEventListener('move', e => {
      const detail = e.detail;
      const srcEvent = detail.srcEvent;
      events.push(
        `move: ${srcEvent.pointerId} | x: ${detail.centroid.x} | y: ${detail.centroid.y}`
      );
    });
    gestureTarget.addEventListener('moveEnd', e => {
      const detail = e.detail;
      const srcEvent = detail.srcEvent;
      events.push(
        `moveEnd: ${srcEvent.pointerId} | x: ${detail.centroid.x} | y: ${detail.centroid.y}`
      );
    });
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
    gestureManager.destroy();
    vi.restoreAllMocks();
  });

  it('should detect move gesture', async () => {
    await mouseGesture.move({
      target,
      steps: 2,
      distance: 100,
    });

    // Verify events
    expect(events).toStrictEqual([
      'moveStart: 1 | x: 150 | y: 100',
      'move: 1 | x: 150 | y: 100',
      'move: 1 | x: 200 | y: 100',
    ]);
  });

  it('should fire a moveEnd when leaving the target', async () => {
    const gesture = mouseGesture.setup();

    await gesture.move({
      target,
      steps: 2,
      distance: 100,
    });

    const target2 = document.createElement('div');
    target2.style.width = '200px';
    target2.style.height = '200px';
    target2.style.backgroundColor = 'blue';
    target2.id = 'target2';
    document.body.appendChild(target2);

    await gesture.move({
      target: target2,
      steps: 2,
      distance: 100,
    });

    // Verify events
    expect(events).toStrictEqual([
      'moveStart: 1 | x: 150 | y: 100',
      'move: 1 | x: 150 | y: 100',
      'move: 1 | x: 200 | y: 100',
      'moveEnd: 1 | x: 200 | y: 100',
    ]);
  });

  it('should handle pointer events with non-mouse/pen pointer types', () => {
    const gestureInstance = new MoveGesture({ name: 'move' });
    // Set up the gesture instance
    gestureInstance.init(
      target,
      gestureManager['pointerManager'],
      gestureManager['activeGesturesRegistry']
    );

    // Create a pointer move event with touch type
    const moveEvent = new PointerEvent('pointermove', {
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
    });

    // Dispatch the event
    target.dispatchEvent(moveEvent);

    // Verify no events were triggered since we're using touch input
    expect(events.length).toBe(0);
  });

  it('should test updating options', () => {
    const gestureInstance = new MoveGesture({
      name: 'move',
      preventDefault: false,
      stopPropagation: false,
    });

    // Set up the gesture instance
    gestureInstance.init(
      target,
      gestureManager['pointerManager'],
      gestureManager['activeGesturesRegistry']
    );

    // Create an options change event
    const changeOptionsEvent = new CustomEvent('moveChangeOptions', {
      detail: {
        preventDefault: true,
        stopPropagation: true,
        preventIf: ['pan'],
      },
    });

    // Dispatch the event
    target.dispatchEvent(changeOptionsEvent);

    expect(gestureInstance['preventDefault']).toBe(true);
    expect(gestureInstance['stopPropagation']).toBe(true);
    expect(gestureInstance['preventIf']).toEqual(['pan']);
  });

  it('should properly clone', () => {
    const originalGesture = new MoveGesture({
      name: 'move',
      preventDefault: true,
      stopPropagation: true,
      threshold: 10,
      minPointers: 1,
      maxPointers: 2,
      preventIf: ['pan', 'pinch'],
    });

    const clonedGesture = originalGesture.clone({ threshold: 20 });

    // Verify that properties were copied correctly
    expect(clonedGesture['name']).toBe('move');
    expect(clonedGesture['preventDefault']).toBe(true);
    expect(clonedGesture['stopPropagation']).toBe(true);
    expect(clonedGesture['threshold']).toBe(20); // This should be overridden
    expect(clonedGesture['minPointers']).toBe(1);
    expect(clonedGesture['maxPointers']).toBe(2);
    expect(clonedGesture['preventIf']).toEqual(['pan', 'pinch']);

    // Ensure they are different objects
    expect(clonedGesture).not.toBe(originalGesture);
  });
});
