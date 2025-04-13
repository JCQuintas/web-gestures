import { MoveEvent, MoveGesture } from 'src/gestures/MoveGesture';
import { PanEvent, PanGesture } from 'src/gestures/PanGesture';
import { PinchEvent, PinchGesture } from 'src/gestures/PinchGesture';
import { RotateEvent, RotateGesture } from 'src/gestures/RotateGesture';
import { TapEvent, TapGesture } from 'src/gestures/TapGesture';
import { TurnWheelEvent, TurnWheelGesture } from 'src/gestures/TurnWheelGesture';
import { StatefulKeyToEventMap } from 'src/types';
import { Gesture } from './Gesture';
import { PointerManager } from './PointerManager';

/**
 * Configuration options for initializing the GestureManager
 */
export type GestureManagerOptions<Name extends string, Gestures extends Gesture<Name>> = {
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
  gestures?: Gestures[];
};

/**
 * Maps a gesture class to its event data type
 * Uses pattern matching on imported gesture types
 */
type GestureEventType<GN extends string, T extends Gesture<GN>> =
  T extends PanGesture<GN>
    ? StatefulKeyToEventMap<GN, PanEvent>
    : T extends PinchGesture<GN>
      ? StatefulKeyToEventMap<GN, PinchEvent>
      : T extends RotateGesture<GN>
        ? StatefulKeyToEventMap<GN, RotateEvent>
        : T extends TapGesture<GN>
          ? Record<GN, TapEvent>
          : T extends MoveGesture<GN>
            ? StatefulKeyToEventMap<GN, MoveEvent>
            : T extends TurnWheelGesture<GN>
              ? Record<GN, TurnWheelEvent>
              : never;

/**
 * Enhanced HTML element type with strongly-typed gesture event handlers.
 *
 * This type extends the standard HTMLElement with correctly typed addEventListener
 * and removeEventListener methods that understand both standard DOM events and
 * custom gesture events.
 *
 * @template T - The base HTML element type
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
  EventMap = Record<string, unknown>,
> = Omit<T, 'addEventListener' | 'removeEventListener'> & {
  addEventListener<K extends keyof EventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: EventMap[K]) => any,
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
  removeEventListener<K extends keyof EventMap>(
    type: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: HTMLElement, ev: EventMap[K]) => any,
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
export class GestureManager<
  GestureName extends string,
  Gestures extends Gesture<GestureName>,
  GestureUnion extends Gesture<GestureName> = Gestures[][number],
> {
  /** Repository of gesture templates that can be cloned for specific elements */
  private gestureTemplates: Map<string, Gesture<string>> = new Map();

  /** Maps DOM elements to their active gesture instances */
  private elementGestureMap: Map<HTMLElement, Map<string, Gesture<string>>> = new Map();

  /**
   * Create a new GestureManager instance to coordinate gesture recognition
   *
   * @param options - Configuration options for the gesture manager
   */
  constructor(options: GestureManagerOptions<GestureName, Gestures>) {
    // Initialize the PointerManager
    PointerManager.getInstance({
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
  private addGestureTemplate(gesture: Gesture<GestureName>): void {
    if (this.gestureTemplates.has(gesture.name)) {
      console.warn(
        `Gesture template with name "${gesture.name}" already exists. It will be overwritten.`
      );
    }
    this.gestureTemplates.set(gesture.name, gesture);
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
   * @param options - Optional map of gesture-specific options to override when registering
   * @returns The same element with properly typed event listeners
   *
   * @example
   * ```typescript
   * // Register multiple gestures
   * const element = manager.registerElement(['pan', 'pinch'], myDiv);
   *
   * // Register a single gesture
   * const draggable = manager.registerElement('pan', dragHandle);
   *
   * // Register with customized options for each gesture
   * const customElement = manager.registerElement(
   *   ['pan', 'pinch', 'rotate'],
   *   myElement,
   *   {
   *     pan: { threshold: 20, direction: ['left', 'right'] },
   *     pinch: { threshold: 0.1 }
   *   }
   * );
   * ```
   */
  public registerElement<T extends HTMLElement>(
    gestureNames: GestureName | GestureName[],
    element: T,
    options?: Record<string, Record<string, unknown>>
  ): GestureElement<T, GestureEventType<GestureName, Gestures>> {
    // Handle array of gesture names
    if (Array.isArray(gestureNames)) {
      gestureNames.forEach(name => {
        const gestureOptions = options?.[name];
        this._registerSingleGesture(name, element, gestureOptions);
      });
      return element as GestureElement<T, GestureEventType<GestureName, Gestures>>;
    }

    // Handle single gesture name
    const gestureOptions = options?.[gestureNames];
    this._registerSingleGesture(gestureNames, element, gestureOptions);
    return element as GestureElement<T, GestureEventType<GestureName, Gestures>>;
  }

  public yolo(): GestureUnion {
    return {} as GestureUnion;
  }
  public yolo2(): GestureEventType<GestureName, Gestures> {
    return {} as GestureEventType<GestureName, Gestures>;
  }

  /**
   * Internal method to register a single gesture on an element.
   *
   * @param gestureName - Name of the gesture to register
   * @param element - DOM element to attach the gesture to
   * @param options - Optional options to override the gesture template configuration
   * @returns True if the registration was successful, false otherwise
   */
  private _registerSingleGesture(
    gestureName: string,
    element: HTMLElement,
    options?: Record<string, unknown>
  ): boolean {
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

    // Clone the gesture template and create a new instance with optional overrides
    // This allows each element to have its own state, event listeners, and configuration
    const gestureInstance = gestureTemplate.clone(options);
    gestureInstance.init();
    gestureInstance.setTargetElement(element);

    // Store the gesture in the element's gesture map
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

    // Destroy the gesture instance
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
}
