/**
 * Simulator for pointer-based gestures (mouse, touch, pen).
 * Extends the base GestureSimulator with pointer-specific event handling.
 */
import { GestureSimulator, GestureSimulatorOptions } from './GestureSimulator';
import { Pointer } from './Pointer';
import { PointerIdManager } from './PointerIdManager';
import { Point } from './types';

export type PointerGestureSimulatorOptions = GestureSimulatorOptions & {
  /**
   * Whether to skip dispatching a pointerdown event.
   * Useful when chaining gestures.
   * @default false
   */
  skipPointerDown?: boolean;

  /**
   * Whether to skip dispatching a pointerup event.
   * Useful when chaining gestures.
   * @default false
   */
  skipPointerUp?: boolean;
} & (
    | {
        /**
         * The pointer type to use for the gesture.
         * @default 'mouse'
         */
        pointerType: 'touch' | 'pen';

        /**
         * Number of pointers to simulate.
         * @default 1
         */
        pointerAmount?: number;

        /**
         * The distance between pointers.
         * This is only used when pointerAmount is greater than 1.
         *
         * The distance is calculated from the center of the gesture to the pointer.
         *
         * @example
         * If the center is (100, 100) and pointerDistance is 5, the pointers will be at:
         * - Pointer 1: (95, 100)
         * - Pointer 2: (105, 100)
         * - Pointer 3: (100, 95)
         *
         *
         * @default 5
         */
        pointerDistance?: number;
      }
    | {
        /**
         * The pointer type to use for the gesture.
         * @default 'mouse'
         */
        pointerType?: 'mouse';
      }
  );

export class PointerGestureSimulator extends GestureSimulator {
  protected pointerType: 'mouse' | 'touch' | 'pen';
  protected pointerIdManager: PointerIdManager;
  protected pointerAmount: number;
  protected pointerDistance: number;

  constructor(options: PointerGestureSimulatorOptions) {
    super(options);
    this.pointerType = options.pointerType || 'mouse';
    this.pointerAmount =
      this.pointerType === 'mouse' ? 1 : (options as { pointerAmount?: number }).pointerAmount || 1;
    this.pointerDistance = (options as { pointerDistance?: number }).pointerDistance || 5;

    if (this.pointerType === 'mouse' && this.pointerAmount > 1) {
      throw new Error('Mouse pointer type does not support multiple pointers.');
    }

    this.pointerIdManager = PointerIdManager.getInstance();
  }

  /**
   * Distributes pointers around a center point.
   *
   * @param center - The center point to distribute pointers around.
   * @returns An array of points representing the distributed pointers.
   */
  protected distributeAroundCenter(center: Point): Point[] {
    if (this.pointerAmount < 1) {
      return [];
    }
    if (this.pointerAmount === 1) {
      return [center];
    }

    const angle = (2 * Math.PI) / this.pointerAmount;
    return Array.from({ length: this.pointerAmount }, (_, i) => {
      const x = center.x + Math.sin(i * angle) * this.pointerDistance;
      const y = center.y + Math.cos(i * angle) * this.pointerDistance;
      return { x, y };
    });
  }

  /**
   * Generates pointers for the gesture.
   *
   * @returns An array of Pointer objects.
   */
  protected generatePointers(): Pointer[] {
    return Array.from({ length: this.pointerAmount }, () => {
      const pointerId = this.pointerIdManager.generatePointerId();
      return new Pointer(this.element, this.pointerType, pointerId);
    });
  }
}
