/**
 * GestureManager - Main class for managing gestures
 *
 * This class creates and manages gestures for different elements
 */

import { Gesture, GestureEmitter } from './Gesture';
import { PointerManager } from './PointerManager';
import { MoveEvent } from './gestures/MoveGesture';
import { PanEvent } from './gestures/PanGesture';
import { PinchEvent } from './gestures/PinchGesture';
import { TurnWheelEvent } from './gestures/TurnWheelGesture';
import { StatefulEventMap } from './types';

/**
 * Options for initializing the GestureManager
 */
export type GestureManagerOptions = {
  /**
   * The root element to which the PointerManager will be attached
   */
  root: HTMLElement;
  /**
   * The touch action to be set on the root element
   */
  touchAction?: string;
  /**
   * Whether to use passive event listeners
   */
  passive?: boolean;
  /**
   * Array of gesture templates to be added to the manager
   */
  gestures?: Gesture[];
};

// Define default event map with automatically generated start/move/end/cancel variants
type DefaultGestureEventMap = StatefulEventMap<{
  pan: PanEvent;
  pinch: PinchEvent;
  move: MoveEvent;
}> & {
  turnWheel: TurnWheelEvent;
};

// Utility type to merge T into DefaultGestureEventMap by removing any overlapping keys from DefaultGestureEventMap
// It also removes any Event from DefaultGestureEventMap that is present in T
type MergeEventMap<T> = T & {
  [K in keyof DefaultGestureEventMap as K extends keyof T
    ? never
    : DefaultGestureEventMap[K] extends T[keyof T]
      ? never
      : K]: DefaultGestureEventMap[K];
};

// Enhanced element type with properly typed event listeners
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

export class GestureManager<CustomEventMap = DefaultGestureEventMap> {
  private pointerManager: PointerManager;
  private gestureTemplates: Map<string, Gesture> = new Map();
  private elementGestureMap: Map<HTMLElement, Map<string, GestureEmitter>> = new Map();

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
   * Add a gesture template to the manager
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
   * Remove a gesture template from the manager
   */
  public removeGestureTemplate(gestureName: string): boolean {
    if (this.gestureTemplates.has(gestureName)) {
      this.gestureTemplates.delete(gestureName);
      return true;
    }
    return false;
  }

  /**
   * Register an element to recognize a gesture or multiple gestures
   * This clones the gesture template(s) and creates specific instance(s) for this element
   * @returns The element with properly typed event listeners
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
   * Internal method to register a single gesture on an element
   * @returns True if the registration was successful
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
    const emitter = gestureInstance.createEmitter(element);

    // Store the emitter in the element's gesture map
    elementGestures.set(gestureName, emitter);

    return true;
  }

  /**
   * Unregister an element from a specific gesture
   */
  public unregisterElement(gestureName: string, element: HTMLElement): boolean {
    const elementGestures = this.elementGestureMap.get(element);
    if (!elementGestures || !elementGestures.has(gestureName)) {
      return false;
    }

    // Call the emitter's unregister function
    const emitter = elementGestures.get(gestureName)!;
    emitter.unregister();

    // Remove from the map
    elementGestures.delete(gestureName);

    // Remove the element from the map if it no longer has any gestures
    if (elementGestures.size === 0) {
      this.elementGestureMap.delete(element);
    }

    return true;
  }

  /**
   * Unregister an element from all gestures
   */
  public unregisterAllGestures(element: HTMLElement): void {
    const elementGestures = this.elementGestureMap.get(element);
    if (elementGestures) {
      // Unregister all emitters
      for (const [_, emitter] of elementGestures) {
        emitter.unregister();
      }

      // Clear the map
      this.elementGestureMap.delete(element);
    }
  }

  /**
   * Get a gesture template by name
   */
  public getGestureTemplate(gestureName: string): Gesture | undefined {
    return this.gestureTemplates.get(gestureName);
  }

  /**
   * Clean up all gestures and event listeners
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
   * Get the underlying PointerManager
   */
  public getPointerManager(): PointerManager {
    return this.pointerManager;
  }
}
