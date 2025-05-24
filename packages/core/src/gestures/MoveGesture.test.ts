import { mouseGesture } from '@web-gestures/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
});
