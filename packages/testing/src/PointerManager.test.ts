import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PointerManager } from './PointerManager';

describe('PointerManager', () => {
  let mousePointerManager: PointerManager;
  let touchPointerManager: PointerManager;
  let target: HTMLElement;
  let pointerDown: ReturnType<typeof vi.fn>;
  let pointerMove: ReturnType<typeof vi.fn>;
  let pointerUp: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a target element for testing
    target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    document.body.appendChild(target);

    // Set up event listeners
    pointerDown = vi.fn();
    pointerMove = vi.fn();
    pointerUp = vi.fn();

    target.addEventListener('pointerdown', pointerDown);
    target.addEventListener('pointermove', pointerMove);
    target.addEventListener('pointerup', pointerUp);

    // Create PointerManager instances
    mousePointerManager = new PointerManager('mouse');
    touchPointerManager = new PointerManager('touch');
  });

  afterEach(() => {
    // Clean up the target element
    if (target.parentNode) {
      target.parentNode.removeChild(target);
    }

    // Remove event listeners
    target.removeEventListener('pointerdown', pointerDown);
    target.removeEventListener('pointermove', pointerMove);
    target.removeEventListener('pointerup', pointerUp);
  });

  describe('parseMousePointer', () => {
    it('should create a mouse pointer at the center of the target by default', () => {
      const pointer = mousePointerManager.parseMousePointer(undefined, target);

      expect(pointer.id).toBe(1);
      expect(pointer.x).toBe(50); // Center of 100px width
      expect(pointer.y).toBe(50); // Center of 100px height
      expect(pointer.target).toBe(target);
    });

    it('should create a mouse pointer with custom coordinates', () => {
      const pointer = mousePointerManager.parseMousePointer({ x: 25, y: 75 }, target);

      expect(pointer.id).toBe(1);
      expect(pointer.x).toBe(25);
      expect(pointer.y).toBe(75);
      expect(pointer.target).toBe(target);
    });

    it('should throw an error when used with touch mode', () => {
      expect(() => {
        touchPointerManager.parseMousePointer(undefined, target);
      }).toThrow('Mouse pointer can only be used in mouse mode');
    });
  });

  describe('parsePointers', () => {
    it('should create pointers based on default config for touch mode', () => {
      const pointers = touchPointerManager.parsePointers(undefined, target, {
        amount: 2,
        distance: 50,
      });

      expect(pointers.length).toBe(2);
      expect(pointers[0].id).toBeGreaterThan(500);
      expect(pointers[1].id).toBeGreaterThan(500);
      expect(pointers[0].target).toBe(target);
      expect(pointers[1].target).toBe(target);

      // Pointers should be at opposite positions in a circle
      const distance = Math.sqrt(
        Math.pow(pointers[0].x - pointers[1].x, 2) + Math.pow(pointers[0].y - pointers[1].y, 2)
      );
      expect(distance).toBeCloseTo(50);
    });

    it('should create pointers with custom configurations', () => {
      const pointers = touchPointerManager.parsePointers(
        {
          amount: 3,
          distance: 100,
        },
        target,
        {
          amount: 2,
          distance: 50,
        }
      );

      expect(pointers.length).toBe(3);

      // Verify they form a triangle around the center
      const uniquePositions = new Set(pointers.map(p => `${Math.round(p.x)},${Math.round(p.y)}`));
      expect(uniquePositions.size).toBe(3);
    });

    it('should throw an error when trying to create multiple pointers in mouse mode', () => {
      expect(() => {
        mousePointerManager.parsePointers(
          {
            amount: 2,
            distance: 50,
          },
          target,
          {
            amount: 1,
            distance: 50,
          }
        );
      }).toThrow('Mouse mode only supports one pointer');
    });

    it('should handle custom pointer ids when provided', () => {
      const customIds = [701, 702, 703];
      const pointers = touchPointerManager.parsePointers(
        {
          amount: 3,
          distance: 100,
          ids: customIds,
        },
        target,
        {
          amount: 2,
          distance: 50,
        }
      );

      expect(pointers.length).toBe(3);
      expect(pointers[0].id).toBe(701);
      expect(pointers[1].id).toBe(702);
      expect(pointers[2].id).toBe(703);
    });

    it('should correctly parse array of pointers', () => {
      const customPointers = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ];

      const pointers = touchPointerManager.parsePointers(customPointers, target, {
        amount: 1,
        distance: 50,
      });

      expect(pointers.length).toBe(2);
      expect(pointers[0].x).toBe(10);
      expect(pointers[0].y).toBe(20);
      expect(pointers[1].x).toBe(30);
      expect(pointers[1].y).toBe(40);
    });

    it('should handle different targets for different pointers', () => {
      const secondTarget = document.createElement('div');
      document.body.appendChild(secondTarget);

      try {
        const customPointers = [{ target }, { target: secondTarget }];

        const pointers = touchPointerManager.parsePointers(customPointers, target, {
          amount: 1,
          distance: 50,
        });

        expect(pointers.length).toBe(2);
        expect(pointers[0].target).toBe(target);
        expect(pointers[1].target).toBe(secondTarget);
      } finally {
        if (secondTarget.parentNode) {
          secondTarget.parentNode.removeChild(secondTarget);
        }
      }
    });
  });

  describe('pointerDown, pointerMove, and pointerUp', () => {
    it('should dispatch pointer events with correct data', () => {
      const pointer = mousePointerManager.parseMousePointer({ x: 25, y: 75 }, target);

      // Test pointerDown
      mousePointerManager.pointerDown(pointer);
      expect(pointerDown).toHaveBeenCalledTimes(1);
      const downEvent = pointerDown.mock.calls[0][0];
      expect(downEvent.clientX).toBe(25);
      expect(downEvent.clientY).toBe(75);
      expect(downEvent.pointerId).toBe(1);
      expect(downEvent.pointerType).toBe('mouse');

      // Test pointerMove
      mousePointerManager.pointerMove({
        ...pointer,
        x: 50,
        y: 50,
      });
      expect(pointerMove).toHaveBeenCalledTimes(1);
      const moveEvent = pointerMove.mock.calls[0][0];
      expect(moveEvent.clientX).toBe(50);
      expect(moveEvent.clientY).toBe(50);

      // Test pointerUp
      mousePointerManager.pointerUp({
        ...pointer,
        x: 50,
        y: 50,
      });
      expect(pointerUp).toHaveBeenCalledTimes(1);
      const upEvent = pointerUp.mock.calls[0][0];
      expect(upEvent.clientX).toBe(50);
      expect(upEvent.clientY).toBe(50);
    });

    it('should handle multiple touch pointers correctly', () => {
      const pointers = touchPointerManager.parsePointers(
        {
          amount: 2,
          distance: 50,
        },
        target,
        {
          amount: 1,
          distance: 0,
        }
      );

      // Test pointerDown for both
      pointers.forEach(p => touchPointerManager.pointerDown(p));
      expect(pointerDown).toHaveBeenCalledTimes(2);

      // Test pointerMove for both
      const movedPointers = pointers.map(p => ({
        ...p,
        x: p.x + 10,
        y: p.y + 10,
      }));
      movedPointers.forEach(p => touchPointerManager.pointerMove(p));
      expect(pointerMove).toHaveBeenCalledTimes(2);

      // Test pointerUp for both
      movedPointers.forEach(p => touchPointerManager.pointerUp(p));
      expect(pointerUp).toHaveBeenCalledTimes(2);
    });

    it('should not trigger multiple pointerDown events for the same pointer', () => {
      const pointer = mousePointerManager.parseMousePointer(undefined, target);

      // First pointerDown
      mousePointerManager.pointerDown(pointer);
      expect(pointerDown).toHaveBeenCalledTimes(1);

      // Second pointerDown (should be ignored)
      mousePointerManager.pointerDown(pointer);
      expect(pointerDown).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('nextId', () => {
    it('should generate sequential IDs starting from 501', () => {
      const id1 = touchPointerManager.nextId();
      const id2 = touchPointerManager.nextId();
      const id3 = touchPointerManager.nextId();

      expect(id1).toBe(501);
      expect(id2).toBe(502);
      expect(id3).toBe(503);
    });
  });

  describe('Integration between methods', () => {
    it('should allow a full gesture workflow', () => {
      // Create a pointer
      const pointer = mousePointerManager.parseMousePointer({ x: 20, y: 20 }, target);

      // Down
      mousePointerManager.pointerDown(pointer);

      // Move in several steps
      mousePointerManager.pointerMove({ ...pointer, x: 30, y: 20 });
      mousePointerManager.pointerMove({ ...pointer, x: 40, y: 20 });
      mousePointerManager.pointerMove({ ...pointer, x: 50, y: 20 });

      // Up
      mousePointerManager.pointerUp({ ...pointer, x: 50, y: 20 });

      // Verify all events were called
      expect(pointerDown).toHaveBeenCalledTimes(1);
      expect(pointerMove).toHaveBeenCalledTimes(3);
      expect(pointerUp).toHaveBeenCalledTimes(1);

      // Verify the final position
      const upEvent = pointerUp.mock.calls[0][0];
      expect(upEvent.clientX).toBe(50);
      expect(upEvent.clientY).toBe(20);
    });

    it('should handle touch pointer lifecycle correctly', () => {
      // Create touch pointers
      const pointers = touchPointerManager.parsePointers(
        {
          amount: 2,
          distance: 50,
        },
        target,
        {
          amount: 1,
          distance: 0,
        }
      );

      // Down with both pointers
      pointers.forEach(p => touchPointerManager.pointerDown(p));

      // Up with the first pointer only
      touchPointerManager.pointerUp(pointers[0]);

      // At this point, only one pointer should be up
      expect(pointerUp).toHaveBeenCalledTimes(1);

      // Move the remaining pointer
      touchPointerManager.pointerMove({
        ...pointers[1],
        x: pointers[1].x + 10,
        y: pointers[1].y + 10,
      });

      // Should still work
      expect(pointerMove).toHaveBeenCalledTimes(1);

      // Up with the second pointer
      touchPointerManager.pointerUp(pointers[1]);
      expect(pointerUp).toHaveBeenCalledTimes(2);
    });
  });
});
