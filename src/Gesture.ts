/**
 * Base Gesture class that provides common functionality for all gestures
 */

import { PointerData, PointerManager } from './PointerManager';

export type GestureState = 'start' | 'move' | 'end' | 'cancel';

export type GestureEventData = {
  centroid: { x: number; y: number };
  target: EventTarget | null;
  srcEvent: Event;
  state: GestureState;
  pointers: PointerData[];
  timeStamp: number;
};

export type GestureOptions = {
  name: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

export type GestureEventCallback = (eventData: GestureEventData) => void;

export type GestureEmitter = {
  element: HTMLElement;
  unregister: () => void;
};

/**
 * Base class for all gestures. This class provides the basic structure and functionality
 * for handling gestures, including registering and unregistering gesture handlers,
 * creating emitters, and managing gesture state.
 *
 * To implement non-pointer gestures like wheel events, extend this class directly.
 * For pointer-based gestures, extend the PointerGesture class instead.
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
  public name: string;
  protected preventDefault: boolean;
  protected stopPropagation: boolean;
  protected pointerManager: PointerManager | null = null;

  // Map of elements to their active gesture state
  protected emitters = new Map<
    HTMLElement,
    {
      active: boolean;
      startPointers: Map<number, PointerData>;
    }
  >();

  constructor(options: GestureOptions) {
    this.name = options.name;
    this.preventDefault = options.preventDefault ?? false;
    this.stopPropagation = options.stopPropagation ?? false;
  }

  /**
   * Initialize the gesture
   */
  public init(): void {
    if (!this.pointerManager) {
      this.pointerManager = PointerManager.getInstance();
    }
  }

  /**
   * Create a deep clone of this gesture for a new element
   */
  public abstract clone(): Gesture;

  /**
   * Create a new emitter for this gesture on the given element
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
   */
  protected removeEmitter(element: HTMLElement): void {
    this.emitters.delete(element);
  }

  /**
   * Check if the event's target is or is contained within any of our registered elements
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
   */
  protected getEmitterState(element: HTMLElement) {
    return this.emitters.get(element);
  }

  /**
   * Clean up the gesture, unregistering any listeners
   */
  public destroy(): void {
    this.emitters.clear();
  }
}
