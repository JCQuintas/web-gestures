import { Gesture, GestureOptions } from './Gesture';
import { PointerData } from './PointerManager';

/**
 * Configuration options for pointer-based gestures, extending the base GestureOptions.
 *
 * These options provide fine-grained control over how pointer events are interpreted
 * and when the gesture should be recognized.
 */
export interface PointerGestureOptions<Name extends string> extends GestureOptions<Name> {
  /**
   * Minimum number of pointers required to activate the gesture.
   * The gesture will not start until at least this many pointers are active.
   *
   * @default 1
   */
  minPointers?: number;

  /**
   * Maximum number of pointers allowed for this gesture to remain active.
   * If more than this many pointers are detected, the gesture may be canceled.
   *
   * @default Infinity (no maximum)
   */
  maxPointers?: number;

  /**
   * Distance threshold in pixels for gesture activation.
   *
   * The gesture will only be recognized once the pointers have moved this many
   * pixels from their starting positions. Higher values prevent accidental
   * gesture recognition when the user makes small unintentional movements.
   *
   * @default 0 (no threshold)
   */
  threshold?: number;
}

/**
 * Base class for all pointer-based gestures.
 *
 * This class extends the base Gesture class with specialized functionality for
 * handling pointer events via the PointerManager. It provides common logic for
 * determining when a gesture should activate, tracking pointer movements, and
 * managing pointer thresholds.
 *
 * All pointer-based gesture implementations should extend this class rather than
 * the base Gesture class.
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
 *   clone(overrides) {
 *     return new CustomGesture({
 *       name: this.name,
 *       // ... other options
 *       ...overrides,
 *     });
 *   }
 *
 *   handlePointerEvent(pointers, event) {
 *     // Handle pointer events here
 *   }
 * }
 * ```
 */
export abstract class PointerGesture<Name extends string> extends Gesture<Name> {
  /** Function to unregister from the PointerManager when destroying this gesture */
  protected unregisterHandler: (() => void) | null = null;

  /**
   * Minimum number of simultaneous pointers required to activate the gesture.
   * The gesture will not start until at least this many pointers are active.
   */
  protected minPointers: number;

  /**
   * Maximum number of simultaneous pointers allowed for this gesture.
   * If more than this many pointers are detected, the gesture may be canceled.
   */
  protected maxPointers: number;

  /**
   * Movement threshold in pixels that must be exceeded before the gesture activates.
   * Higher values reduce false positive gesture detection for small movements.
   */
  protected threshold: number;

  constructor(options: PointerGestureOptions<Name>) {
    super(options);
    this.minPointers = options.minPointers ?? 1;
    this.maxPointers = options.maxPointers ?? Infinity;
    this.threshold = options.threshold ?? 0;
  }

  public init(): void {
    super.init();

    this.unregisterHandler = this.pointerManager!.registerGestureHandler((pointers, event) =>
      this.handlePointerEvent(pointers, event)
    );
  }

  /**
   * Handler for pointer events from the PointerManager.
   * Concrete gesture implementations must override this method to provide
   * gesture-specific logic for recognizing and tracking the gesture.
   *
   * @param pointers - Map of active pointers by pointer ID
   * @param event - The original pointer event from the browser
   */
  protected abstract handlePointerEvent(
    pointers: Map<number, PointerData>,
    event: PointerEvent
  ): void;

  public destroy(): void {
    if (this.unregisterHandler) {
      this.unregisterHandler();
      this.unregisterHandler = null;
    }
  }
}
