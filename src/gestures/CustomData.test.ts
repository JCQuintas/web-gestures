import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { PanEvent, PanGesture } from './PanGesture';

describe('CustomData functionality in gestures', () => {
  let container: HTMLElement;
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
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('PanGesture customData', () => {
    let gestureManager: GestureManager<'pan', PanGesture<'pan'>>;
    let gestureTarget: ReturnType<GestureManager<'pan', PanGesture<'pan'>>['registerElement']>;

    beforeEach(() => {
      gestureManager = new GestureManager({
        gestures: [new PanGesture({ name: 'pan' })],
      });
      gestureTarget = gestureManager.registerElement('pan', target);
    });

    afterEach(() => {
      gestureManager.destroy();
    });

    it('should have empty customData object initially', async () => {
      const panStartHandler = vi.fn();
      gestureTarget.addEventListener('panStart', panStartHandler);

      const user = userEvent.setup();
      await user.pointer([
        { keys: '[MouseLeft>]', target: gestureTarget, coords: { x: 50, y: 50 } },
        { target: gestureTarget, coords: { x: 60, y: 50 } }, // Move beyond threshold
      ]);

      expect(panStartHandler).toHaveBeenCalledTimes(1);
      const event = panStartHandler.mock.calls[0][0] as PanEvent;
      expect(event.detail.customData).toBeDefined();
      expect(Object.keys(event.detail.customData).length).toBe(0);
    });

    it('should allow modifying customData in handlers', async () => {
      const panStartHandler = vi.fn((e: PanEvent) => {
        e.detail.customData.startTime = 123;
        e.detail.customData.testValue = 'hello';
      });

      const panHandler = vi.fn((e: PanEvent) => {
        expect(e.detail.customData.startTime).toBe(123);
        expect(e.detail.customData.testValue).toBe('hello');

        // Modify the value
        e.detail.customData.testValue = 'modified';
      });

      const panEndHandler = vi.fn((e: PanEvent) => {
        expect(e.detail.customData.startTime).toBe(123);
        expect(e.detail.customData.testValue).toBe('modified');
      });

      gestureTarget.addEventListener('panStart', panStartHandler);
      gestureTarget.addEventListener('pan', panHandler);
      gestureTarget.addEventListener('panEnd', panEndHandler);

      const user = userEvent.setup();
      await user.pointer([
        { keys: '[MouseLeft>]', target: gestureTarget, coords: { x: 50, y: 50 } },
        { target: gestureTarget, coords: { x: 70, y: 50 } }, // Move beyond threshold
        { target: gestureTarget, coords: { x: 90, y: 50 } }, // Continue moving
        { keys: '[/MouseLeft]', target: gestureTarget, coords: { x: 90, y: 50 } }, // End
      ]);

      expect(panStartHandler).toHaveBeenCalledTimes(1);
      expect(panHandler).toHaveBeenCalled();
      expect(panEndHandler).toHaveBeenCalledTimes(1);
    });
  });
});
