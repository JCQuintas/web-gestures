/**
 * TurnWheelGesture - Detects wheel events on an element
 *
 * This gesture tracks mouse wheel or touchpad scroll events on elements, firing events when:
 * - The user scrolls/wheels on the element (ongoing)
 *
 * Unlike other gestures which may have start/ongoing/end states,
 * wheel gestures are always considered "ongoing" since they are discrete events.
 */

import { Gesture, GestureEventData, GestureOptions } from '../Gesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

/**
 * Configuration options for the TurnWheelGesture
 * Uses the base gesture options without pointer-specific options
 */
export type TurnWheelGestureOptions = GestureOptions;

/**
 * Event data specific to wheel gesture events
 * Contains information about scroll delta amounts and mode
 */
export type TurnWheelGestureEventData = GestureEventData & {
  /** Horizontal scroll amount */
  deltaX: number;
  /** Vertical scroll amount */
  deltaY: number;
  /** Z-axis scroll amount (depth) */
  deltaZ: number;
  /**
   * The unit of measurement for the delta values
   * 0: Pixels, 1: Lines, 2: Pages
   */
  deltaMode: number;
  /** The original DOM wheel event that triggered this gesture event */
  srcEvent: WheelEvent;
};

/**
 * Type definition for the CustomEvent created by TurnWheelGesture
 */
export type TurnWheelEvent = CustomEvent<TurnWheelGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type TurnWheelGestureState = {
  /** Bound event handler function for this element */
  wheelHandler: (e: WheelEvent) => void;
};

/**
 * TurnWheelGesture class for handling wheel/scroll interactions
 *
 * This gesture detects when users scroll or use the mouse wheel on elements,
 * and dispatches corresponding scroll events with delta information.
 * Unlike most gestures, it extends directly from Gesture rather than PointerGesture.
 */
export class TurnWheelGesture extends Gesture {
  /**
   * Map of elements to their specific wheel gesture state
   * Stores the wheel event handler for each element
   */
  private wheelEmitters = new Map<HTMLElement, TurnWheelGestureState>();

  /**
   * Creates a new TurnWheelGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: TurnWheelGestureOptions) {
    super(options);
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): TurnWheelGesture {
    return new TurnWheelGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
    });
  }

  /**
   * Override createEmitter to add wheel-specific state and element-specific event listeners
   * @param element The element to attach the wheel event listener to
   * @returns The emitter for the element
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    // Create bound handler for this element
    const wheelHandler = this.handleWheelEvent.bind(this, element);

    // Add event listener directly to the element
    element.addEventListener('wheel', wheelHandler);

    // Add wheel-specific state
    this.wheelEmitters.set(element, {
      wheelHandler,
    });

    return emitter;
  }

  /**
   * Override removeEmitter to clean up wheel-specific state and element event listeners
   * @param element The element to remove the wheel event listener from
   */
  protected removeEmitter(element: HTMLElement): void {
    const wheelState = this.wheelEmitters.get(element);

    if (wheelState) {
      // Remove the element-specific event listener
      element.removeEventListener('wheel', wheelState.wheelHandler);

      // Remove the wheel state
      this.wheelEmitters.delete(element);
    }

    super.removeEmitter(element);
  }

  /**
   * Handle wheel events for a specific element
   * @param element The element that received the wheel event
   * @param event The original wheel event
   */
  private handleWheelEvent(element: HTMLElement, event: WheelEvent): void {
    // Get pointers from the PointerManager to use for centroid calculation
    const pointers = this.pointerManager?.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Emit the wheel event
    this.emitWheelEvent(element, pointersArray, event);
  }

  /**
   * Emit wheel-specific events
   * @param element The element to dispatch the custom event on
   * @param pointers The current pointers on the element
   * @param event The original wheel event
   */
  private emitWheelEvent(element: HTMLElement, pointers: PointerData[], event: WheelEvent): void {
    // Calculate centroid - either from existing pointers or from the wheel event position
    const centroid =
      pointers.length > 0 ? calculateCentroid(pointers) : { x: event.clientX, y: event.clientY };

    // Create custom event data
    const customEventData: TurnWheelGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event, // Cast to expected type
      state: 'ongoing', // Wheel events are always in "ongoing" state
      pointers,
      timeStamp: event.timeStamp,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      deltaMode: event.deltaMode,
    };

    // Apply default event behavior if configured
    if (this.preventDefault) {
      event.preventDefault();
    }

    if (this.stopPropagation) {
      event.stopPropagation();
    }

    // Event names to trigger
    const eventName = createEventName(this.name, 'ongoing');

    // Dispatch custom events on the element
    const domEvent = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: customEventData,
    });

    element.dispatchEvent(domEvent);
  }
}
