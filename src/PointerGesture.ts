import { Gesture, GestureOptions } from './Gesture';
import { PointerData } from './PointerManager';

/**
 * Extension of GestureOptions with pointer-specific properties
 */
export interface PointerGestureOptions extends GestureOptions {
  /**
   * Minimum number of pointers required to activate the gesture
   *
   * @default 1
   */
  minPointers?: number;

  /**
   * Maximum number of pointers allowed for this gesture
   *
   * @default Infinity
   */
  maxPointers?: number;
  /**
   * Threshold for gesture activation. If the distance between the pointers
   * exceeds this value, the gesture will be considered active.
   * This is useful for preventing accidental gestures when the pointers
   * are too close together.
   * @default 0
   */
  threshold?: number;
}

/**
 * Base class for pointer-based gestures. This class extends the base Gesture class
 * with functionality specific to handling pointer events via the PointerManager.
 *
 * To implement a custom pointer gesture, check the implementation of
 * the built-in gestures like `PanGesture` or `PinchGesture`.
 *
 * @example
 * ```ts
 * import { PointerGesture } from './PointerGesture';
 *
 * class CustomGesture extends PointerGesture {
 *   constructor(options) {
 *     super(options);
 *   }
 *
 *   clone() {
 *     return new CustomGesture({
 *       name: this.name,
 *       // ... other options
 *     });
 *   }
 *
 *   handlePointerEvent(pointers, event) {
 *     // Handle pointer events here
 *   }
 * }
 * ```
 */
export abstract class PointerGesture extends Gesture {
  protected unregisterHandler: (() => void) | null = null;

  /**
   * Minimum number of pointers required to activate the gesture
   */
  protected minPointers: number;

  /**
   * Maximum number of pointers allowed for this gesture
   */
  protected maxPointers: number;

  /**
   * Threshold for gesture activation. If the distance between the pointers
   * exceeds this value, the gesture will be considered active.
   * This is useful for preventing accidental gestures when the pointers
   * are too close together.
   * @default 0
   */
  protected threshold: number;

  /**
   * Create a new PointerGesture instance
   */
  constructor(options: PointerGestureOptions) {
    super(options);
    this.minPointers = options.minPointers ?? 1;
    this.maxPointers = options.maxPointers ?? Infinity;
    this.threshold = options.threshold ?? 0;
  }

  /**
   * Initialize the gesture by registering with the PointerManager
   */
  public init(): void {
    super.init();

    this.unregisterHandler = this.pointerManager!.registerGestureHandler((pointers, event) =>
      this.handlePointerEvent(pointers, event)
    );
  }

  /**
   * Handle pointer events from the PointerManager
   */
  protected abstract handlePointerEvent(
    pointers: Map<number, PointerData>,
    event: PointerEvent
  ): void;

  /**
   * Clean up the gesture, unregistering from the PointerManager
   */
  public destroy(): void {
    if (this.unregisterHandler) {
      this.unregisterHandler();
      this.unregisterHandler = null;
    }
    super.destroy();
  }
}
