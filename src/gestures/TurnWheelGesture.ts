/**
 * TurnWheelGesture - Detects wheel events on an element
 */

import { Gesture, GestureEventData, GestureOptions } from '../Gesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

export type TurnWheelGestureOptions = GestureOptions;

export type TurnWheelGestureEventData = GestureEventData & {
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  deltaMode: number;
  srcEvent: WheelEvent;
};

export type TurnWheelEvent = CustomEvent<TurnWheelGestureEventData>;

export class TurnWheelGesture extends Gesture {
  // Map of elements to their specific wheel gesture state
  private wheelEmitters = new Map<
    HTMLElement,
    {
      // Add wheel-specific state
      wheelHandler: (e: WheelEvent) => void;
    }
  >();

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
