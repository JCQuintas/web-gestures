import { Gesture } from './Gesture';
import { PointerManager } from './PointerManager';
import { MoveEvent } from './gestures/MoveGesture';
import { PanEvent } from './gestures/PanGesture';
import { PinchEvent } from './gestures/PinchGesture';
import { RotateEvent } from './gestures/RotateGesture';
import { TapEvent } from './gestures/TapGesture';
import { TurnWheelEvent } from './gestures/TurnWheelGesture';
import { StatefulEventMap } from './types';

/**
 * Configuration options for initializing the GestureManager
 */
export type GestureManagerOptions = {
  /**
   * The root DOM element to which the PointerManager will attach its event listeners.
   * All gesture detection will be limited to events within this element.
   */
  root: HTMLElement;

  /**
   * CSS touch-action property to apply to the root element.
   * Controls how the browser responds to touch interactions.
   *
   * Common values:
   * - "none": Disable browser handling of all panning/zooming gestures
   * - "pan-x": Allow horizontal panning, disable vertical gestures
   * - "pan-y": Allow vertical panning, disable horizontal gestures
   * - "manipulation": Allow panning and pinch zoom, disable double-tap
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
   */
  touchAction?: string;

  /**
   * Whether to use passive event listeners for improved scrolling performance.
   * When true, gestures cannot use preventDefault() on touch events.
   *
   * @default false
   */
  passive?: boolean;

  /**
   * Array of gesture templates to register with the manager.
   * These serve as prototypes that can be cloned for individual elements.
   */
  gestures?: Gesture[];
};

/**
 * Default event map including all built-in gestures with their stateful variants.
 *
 * Each gesture type (except turnWheel) has four event variants:
 * - [gesture]Start: Triggered when the gesture is first recognized
 * - [gesture]: Triggered continuously while the gesture is active
 * - [gesture]End: Triggered when the gesture completes normally
 * - [gesture]Cancel: Triggered if the gesture is interrupted or canceled
 */
type DefaultGestureEventMap = StatefulEventMap<{
  pan: PanEvent;
  pinch: PinchEvent;
  move: MoveEvent;
  rotate: RotateEvent;
}> & {
  tap: TapEvent;
  turnWheel: TurnWheelEvent;
};

/**
 * Utility type that merges a custom event map with the default event map.
 * This allows users to extend or override the default gestures with their own.
 *
 * The resulting type will contain:
 * 1. All events from the custom map T
 * 2. Default events that don't conflict with any events in T
 *
 * @template T - The custom event map to merge with the defaults
 */
type MergeEventMap<T> = T & {
  [K in keyof DefaultGestureEventMap as K extends keyof T
    ? never
    : DefaultGestureEventMap[K] extends T[keyof T]
      ? never
      : K]: DefaultGestureEventMap[K];
};

/**
 * Enhanced HTML element type with strongly-typed gesture event handlers.
 *
 * This type extends the standard HTMLElement with correctly typed addEventListener
 * and removeEventListener methods that understand both standard DOM events and
 * custom gesture events.
 *
 * @template T - The base HTML element type
 * @template EventMap - The custom event map to use (if any)
 * @template MergedEventMap - The result of merging EventMap with DefaultGestureEventMap
 *
 * @example
 * ```typescript
 * // Using with default gesture events
 * const div = gestureManager.registerElement('pan', document.querySelector('div'));
 * div.addEventListener('panStart', (e) => {
 *   // TypeScript knows e is a PanEvent with the correct properties
 *   console.log(`Pan started at x: ${e.deltaX}, y: ${e.deltaY}`);
 * });
 *
 * // Using with custom gesture events
 * interface MyEvents {
 *   customGesture: { x: number, y: number }
 * }
 * const manager = new GestureManager<MyEvents>({ root: document.body });
 * const el = manager.registerElement('customGesture', myElement);
 * el.addEventListener('customGesture', (e) => {
 *   // TypeScript knows e has x and y properties
 *   console.log(`Custom gesture at ${e.x}, ${e.y}`);
 * });
 * ```
 */
export type GestureElement<
  T extends HTMLElement = HTMLElement,
  EventMap = DefaultGestureEventMap,
  MergedEventMap = MergeEventMap<EventMap>,
> = Omit<T, 'addEventListener' | 'removeEventListener'> & {
  addEventListener<K extends keyof MergedEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: MergedEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MergedEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: MergedEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
};

/**
 * The primary class responsible for setting up and managing gestures across multiple elements.
 *
 * GestureManager maintains a collection of gesture templates that can be instantiated for
 * specific DOM elements. It handles lifecycle management, event dispatching, and cleanup.
 *
 * @template CustomEventMap - Optional custom event map that extends or overrides the default gestures
 *
 * @example
 * ```typescript
 * // Basic setup with default gestures
 * const manager = new GestureManager({
 *   root: document.body,
 *   touchAction: 'none',
 *   gestures: [
 *     new PanGesture({ name: 'pan' }),
 *   ],
 * });
 *
 * // Register pan gestures on an element
 * const element = manager.registerElement('pan', document.querySelector('.draggable'));
 *
 * // Add event listeners with proper typing
 * element.addEventListener('panStart', (e) => {
 *   console.log('Pan started');
 * });
 *
 * element.addEventListener('pan', (e) => {
 *   console.log(`Pan delta: ${e.deltaX}, ${e.deltaY}`);
 * });
 *
 * // Custom gesture types
 * interface MyGestureEvents {
 *   custom: { x: number, y: number }
 * }
 * const customManager = new GestureManager<MyGestureEvents>({
 *   root: document.body
 *   gestures: [
 *     new CustomGesture({ name: 'custom' }),
 *   ],
 * });
 * ```
 */
export class GestureManager<CustomEventMap = DefaultGestureEventMap> {
  /** The singleton PointerManager instance used for coordinating pointer events */
  private pointerManager: PointerManager;

  /** Repository of gesture templates that can be cloned for specific elements */
  private gestureTemplates: Map<string, Gesture> = new Map();

  /** Maps DOM elements to their active gesture instances */
  private elementGestureMap: Map<HTMLElement, Map<string, Gesture>> = new Map();

  /**
   * Create a new GestureManager instance to coordinate gesture recognition
   *
   * @param options - Configuration options for the gesture manager
   */
  constructor(options: GestureManagerOptions) {
    // Initialize the PointerManager
    this.pointerManager = PointerManager.getInstance({
      root: options.root,
      touchAction: options.touchAction,
      passive: options.passive,
    });

    // Add initial gestures as templates if provided
    if (options.gestures && options.gestures.length > 0) {
      options.gestures.forEach(gesture => {
        this.addGestureTemplate(gesture);
      });
    }
  }

  /**
   * Add a gesture template to the manager's template registry.
   * Templates serve as prototypes that can be cloned for individual elements.
   *
   * @param gesture - The gesture instance to use as a template
   */
  public addGestureTemplate(gesture: Gesture): void {
    if (this.gestureTemplates.has(gesture.name)) {
      console.warn(
        `Gesture template with name "${gesture.name}" already exists. It will be overwritten.`
      );
    }
    this.gestureTemplates.set(gesture.name, gesture);
  }

  /**
   * Remove a gesture template from the manager.
   * This does not affect already created gesture instances on elements.
   *
   * @param gestureName - The name of the gesture template to remove
   * @returns True if the template was found and removed, false otherwise
   */
  public removeGestureTemplate(gestureName: string): boolean {
    if (this.gestureTemplates.has(gestureName)) {
      this.gestureTemplates.delete(gestureName);
      return true;
    }
    return false;
  }

  /**
   * Register an element to recognize one or more gestures.
   *
   * This method clones the specified gesture template(s) and creates
   * gesture recognizer instance(s) specifically for the provided element.
   * The element is returned with enhanced TypeScript typing for gesture events.
   *
   * @param gestureNames - Name(s) of the gesture(s) to register (must match template names)
   * @param element - The DOM element to attach the gesture(s) to
   * @returns The same element with properly typed event listeners
   *
   * @example
   * ```typescript
   * // Register multiple gestures
   * const element = manager.registerElement(['pan', 'pinch'], myDiv);
   *
   * // Register a single gesture
   * const draggable = manager.registerElement('pan', dragHandle);
   * ```
   */
  public registerElement<T extends HTMLElement>(
    gestureNames: string | string[],
    element: T
  ): GestureElement<T, CustomEventMap> {
    // Handle array of gesture names
    if (Array.isArray(gestureNames)) {
      gestureNames.forEach(name => {
        this._registerSingleGesture(name, element);
      });
      return element as GestureElement<T, CustomEventMap>;
    }

    // Handle single gesture name
    this._registerSingleGesture(gestureNames, element);
    return element as GestureElement<T, CustomEventMap>;
  }

  /**
   * Internal method to register a single gesture on an element.
   *
   * @param gestureName - Name of the gesture to register
   * @param element - DOM element to attach the gesture to
   * @returns True if the registration was successful, false otherwise
   */
  private _registerSingleGesture(gestureName: string, element: HTMLElement): boolean {
    // Find the gesture template
    const gestureTemplate = this.gestureTemplates.get(gestureName);
    if (!gestureTemplate) {
      console.error(`Gesture template "${gestureName}" not found.`);
      return false;
    }

    // Create element's gesture map if it doesn't exist
    if (!this.elementGestureMap.has(element)) {
      this.elementGestureMap.set(element, new Map());
    }

    // Check if this element already has this gesture registered
    const elementGestures = this.elementGestureMap.get(element)!;
    if (elementGestures.has(gestureName)) {
      console.warn(`Element already has gesture "${gestureName}" registered. It will be replaced.`);
      // Unregister the existing gesture first
      this.unregisterElement(gestureName, element);
    }

    // Clone the gesture template and create an emitter for this element
    const gestureInstance = gestureTemplate.clone();
    gestureInstance.init();
    gestureInstance.setTargetElement(element);

    // Store the emitter in the element's gesture map
    elementGestures.set(gestureName, gestureInstance);

    return true;
  }

  /**
   * Unregister a specific gesture from an element.
   * This removes the gesture recognizer and stops event emission for that gesture.
   *
   * @param gestureName - Name of the gesture to unregister
   * @param element - The DOM element to remove the gesture from
   * @returns True if the gesture was found and removed, false otherwise
   */
  public unregisterElement(gestureName: string, element: HTMLElement): boolean {
    const elementGestures = this.elementGestureMap.get(element);
    if (!elementGestures || !elementGestures.has(gestureName)) {
      return false;
    }

    // Call the emitter's unregister function
    const gesture = elementGestures.get(gestureName)!;
    gesture.destroy();

    // Remove from the map
    elementGestures.delete(gestureName);

    // Remove the element from the map if it no longer has any gestures
    if (elementGestures.size === 0) {
      this.elementGestureMap.delete(element);
    }

    return true;
  }

  /**
   * Unregister all gestures from an element.
   * Completely removes the element from the gesture system.
   *
   * @param element - The DOM element to remove all gestures from
   */
  public unregisterAllGestures(element: HTMLElement): void {
    const elementGestures = this.elementGestureMap.get(element);
    if (elementGestures) {
      // Unregister all gestures for this element
      for (const [_, gesture] of elementGestures) {
        gesture.destroy();
      }

      // Clear the map
      this.elementGestureMap.delete(element);
    }
  }

  /**
   * Get a gesture template by name.
   * Useful for checking gesture configuration or creating custom gesture instances.
   *
   * @param gestureName - The name of the gesture template to retrieve
   * @returns The gesture template if found, undefined otherwise
   */
  public getGestureTemplate(gestureName: string): Gesture | undefined {
    return this.gestureTemplates.get(gestureName);
  }

  /**
   * Clean up all gestures and event listeners.
   * Call this method when the GestureManager is no longer needed to prevent memory leaks.
   */
  public destroy(): void {
    // Unregister all element gestures
    for (const [element] of this.elementGestureMap) {
      this.unregisterAllGestures(element);
    }

    // Clear all templates
    this.gestureTemplates.clear();
    this.elementGestureMap.clear();
  }

  /**
   * Get the underlying PointerManager instance.
   * This provides access to lower-level pointer event handling when needed.
   *
   * @returns The PointerManager singleton instance
   */
  public getPointerManager(): PointerManager {
    return this.pointerManager;
  }
}
