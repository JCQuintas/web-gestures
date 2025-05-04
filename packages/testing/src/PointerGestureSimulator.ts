import { GestureSimulator, GestureSimulatorOptions } from './GestureSimulator';
import { Pointer } from './Pointer';
import { PointerIdManager } from './PointerIdManager';
import { MergeUnions } from './types/MergeUnions';
import { Point } from './types/Point';

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

/**
 * Simulator for pointer-based gestures (mouse, touch, pen).
 * Extends the base GestureSimulator with pointer-specific event handling.
 */
export class PointerGestureSimulator extends GestureSimulator {
  protected pointerType: 'mouse' | 'touch' | 'pen';
  protected pointerIdManager: PointerIdManager;
  protected pointerAmount: number;
  protected pointerDistance: number;

  constructor(options: MergeUnions<PointerGestureSimulatorOptions>) {
    super(options);
    this.pointerType = options.pointerType || 'mouse';
    this.pointerAmount = this.pointerType === 'mouse' ? 1 : options.pointerAmount || 1;
    this.pointerDistance = options.pointerDistance || 5;

    if (this.pointerType === 'mouse' && this.pointerAmount > 1) {
      throw new Error('Mouse pointer type does not support multiple pointers.');
    }

    this.pointerIdManager = PointerIdManager.getInstance();
  }

  /**
   * Distributes pointers around a center point.
   *
   * @param center - The center point to distribute pointers around.
   * @param distance - The distance from the center to the pointers.
   * @param turnAngle - The angle to skew the pointers by.
   * @returns An array of points representing the distributed pointers.
   */
  protected distributeAroundCenter(center: Point, distance?: number, turnAngle?: number): Point[] {
    if (this.pointerAmount < 1) {
      return [];
    }
    if (this.pointerAmount === 1) {
      return [center];
    }

    const angle = (2 * Math.PI) / this.pointerAmount;
    return Array.from({ length: this.pointerAmount }, (_, i) => {
      const x =
        center.x + Math.sin(i * angle + (turnAngle ?? 0)) * (distance ?? this.pointerDistance);
      const y =
        center.y + Math.cos(i * angle + (turnAngle ?? 0)) * (distance ?? this.pointerDistance);
      return { x, y };
    });
  }

  /**
   * Generates pointers for the gesture.
   *
   * @returns An array of Pointer objects.
   */
  protected generatePointers(): Pointer[] {
    if (this.pointerType === 'mouse') {
      return [new Pointer(this.element)];
    }

    return Array.from({ length: this.pointerAmount }, () => {
      const pointerId = this.pointerIdManager.newPointerId();
      return new Pointer(this.element, this.pointerType, pointerId);
    });
  }
}
