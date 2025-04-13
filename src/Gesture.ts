/**
 * Base Gesture module that provides common functionality for all gesture implementations
 */

import { PointerData, PointerManager } from './PointerManager';

/**
 * The possible phases of a gesture during its lifecycle.
 *
 * - 'start': The gesture has been recognized and is beginning
 * - 'ongoing': The gesture is in progress (e.g., a finger is moving)
 * - 'end': The gesture has completed successfully
 * - 'cancel': The gesture was interrupted or terminated abnormally
 */
export type GesturePhase = 'start' | 'ongoing' | 'end' | 'cancel';

/**
 * Core data structure passed to gesture event handlers.
 * Contains all relevant information about a gesture event.
 */
export type GestureEventData = {
  /** The centroid of all active pointers involved in the gesture */
  centroid: { x: number; y: number };
  /** The target element of the original event */
  target: EventTarget | null;
  /** The original event that triggered this gesture */
  srcEvent: Event;
  /** The current phase of the gesture */
  phase: GesturePhase;
  /** Array of all active pointers involved in the gesture */
  pointers: PointerData[];
  /** The time at which the gesture event occurred */
  timeStamp: number;
};

/**
 * Configuration options for creating a gesture instance.
 */
export type GestureOptions = {
  /** Unique name identifying this gesture type */
  name: string;
  /** Whether to prevent default browser action for gesture events */
  preventDefault?: boolean;
  /** Whether to stop propagation of gesture events */
  stopPropagation?: boolean;
};

/**
 * Callback type for gesture event handlers.
 */
export type GestureEventCallback = (
  /** The event data containing information about the gesture */
  eventData: GestureEventData
) => void;

/**
 * An object representing a connected gesture event emitter.
 */
export type GestureEmitter = {
  /** The DOM element this gesture is attached to */
  element: HTMLElement;
  /** Function to unregister this gesture from the element */
  unregister: () => void;
};

/**
 * Base abstract class for all gestures. This class provides the fundamental structure
 * and functionality for handling gestures, including registering and unregistering
 * gesture handlers, creating emitters, and managing gesture state.
 *
 * Gesture is designed as an extensible base for implementing specific gesture recognizers.
 * Concrete gesture implementations should extend this class or one of its subclasses.
 *
 * To implement:
 * - Non-pointer gestures (like wheel events): extend this Gesture class directly
 * - Pointer-based gestures: extend the PointerGesture class instead
 *
 * @example
 * ```ts
 * import { Gesture } from './Gesture';
 *
 * class CustomGesture extends Gesture {
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
 * }
 * ```
 */
export abstract class Gesture {
  /** Unique name identifying this gesture type */
  public name: string;

  /** Whether to prevent default browser action for gesture events */
  protected preventDefault: boolean;

  /** Whether to stop propagation of gesture events */
  protected stopPropagation: boolean;

  /** Reference to the singleton PointerManager instance */
  protected pointerManager: PointerManager | null = null;

  /**
   * Map of elements to their active gesture state
   * Tracks which elements have this gesture attached and their current state
   */
  protected emitters = new Map<
    HTMLElement,
    {
      active: boolean;
      startPointers: Map<number, PointerData>;
    }
  >();

  /**
   * Create a new gesture instance with the specified options
   *
   * @param options - Configuration options for this gesture
   */
  constructor(options: GestureOptions) {
    this.name = options.name;
    this.preventDefault = options.preventDefault ?? false;
    this.stopPropagation = options.stopPropagation ?? false;
  }

  /**
   * Initialize the gesture by acquiring the pointer manager singleton
   * Must be called before the gesture can be used
   */
  public init(): void {
    if (!this.pointerManager) {
      this.pointerManager = PointerManager.getInstance();
    }
  }

  /**
   * Create a deep clone of this gesture for a new element
   *
   * @returns A new instance of this gesture with the same configuration
   */
  public abstract clone(): Gesture;

  /**
   * Create a new emitter for this gesture on the given DOM element
   *
   * @param element - The DOM element to attach this gesture to
   * @returns A gesture emitter object containing the element and an unregister method
   */
  public createEmitter(element: HTMLElement): GestureEmitter {
    // Initialize the emitter state
    this.emitters.set(element, {
      active: false,
      startPointers: new Map(),
    });

    // Return the emitter object
    return {
      element,
      unregister: () => this.removeEmitter(element),
    };
  }

  /**
   * Remove an emitter and clean up its resources
   *
   * @param element - The DOM element whose emitter should be removed
   */
  protected removeEmitter(element: HTMLElement): void {
    this.emitters.delete(element);
  }

  /**
   * Check if the event's target is or is contained within any of our registered elements
   *
   * @param event - The browser event to check
   * @returns The matching element or null if no match is found
   */
  protected getTargetElement(event: Event): HTMLElement | null {
    for (const [element] of this.emitters) {
      if (element === event.target || element.contains(event.target as Node)) {
        return element;
      }
    }
    return null;
  }

  /**
   * Get the emitter state for a specific element
   *
   * @param element - The DOM element whose state to retrieve
   * @returns The emitter state or undefined if not found
   */
  protected getEmitterState(element: HTMLElement) {
    return this.emitters.get(element);
  }

  /**
   * Clean up the gesture, unregistering any listeners and clearing state
   * Call this method when the gesture is no longer needed to prevent memory leaks
   */
  public destroy(): void {
    this.emitters.clear();
  }
}
