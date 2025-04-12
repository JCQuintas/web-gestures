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
 * Uses the base gesture options with additional wheel-specific options
 */
export type TurnWheelGestureOptions = GestureOptions & {
  /**
   * Sensitivity of the wheel gesture
   * Values > 1 increase sensitivity, values < 1 decrease sensitivity
   * @default 1
   */
  sensitivity?: number;

  /**
   * Maximum value for totalDelta values
   * Limits how large the accumulated wheel deltas can be
   * Applied to totalDeltaX, totalDeltaY, and totalDeltaZ individually
   * @default Number.MAX_SAFE_INTEGER
   */
  max?: number;

  /**
   * Minimum value for totalDelta values
   * Sets a lower bound for accumulated wheel deltas
   * Applied to totalDeltaX, totalDeltaY, and totalDeltaZ individually
   * @default Number.MIN_SAFE_INTEGER
   */
  min?: number;

  /**
   * Initial value for totalDelta values
   * Sets the starting value for accumulated wheel deltas
   * Applied to totalDeltaX, totalDeltaY, and totalDeltaZ individually
   * @default 0
   */
  initialDelta?: number;
};

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
  /** Total accumulated horizontal delta since tracking began */
  totalDeltaX: number;
  /** Total accumulated vertical delta since tracking began */
  totalDeltaY: number;
  /** Total accumulated Z-axis delta since tracking began */
  totalDeltaZ: number;
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
  /** Total accumulated horizontal delta since tracking began */
  totalDeltaX: number;
  /** Total accumulated vertical delta since tracking began */
  totalDeltaY: number;
  /** Total accumulated Z-axis delta since tracking began */
  totalDeltaZ: number;
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
   * Scaling factor for delta values
   * Values > 1 increase sensitivity, values < 1 decrease sensitivity
   */
  private scale: number;

  /**
   * Maximum value for totalDelta values
   * Limits how large the accumulated wheel deltas can be
   */
  private max: number;

  /**
   * Minimum value for totalDelta values
   * Sets a lower bound for accumulated wheel deltas
   */
  private min: number;

  /**
   * Initial value for totalDelta values
   * Sets the starting value for delta trackers
   */
  private initialDelta: number;

  /**
   * Creates a new TurnWheelGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: TurnWheelGestureOptions) {
    super(options);
    this.scale = options.sensitivity ?? 1;
    this.max = options.max ?? Number.MAX_SAFE_INTEGER;
    this.min = options.min ?? Number.MIN_SAFE_INTEGER;
    this.initialDelta = options.initialDelta ?? 0;
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): TurnWheelGesture {
    return new TurnWheelGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      sensitivity: this.scale,
      max: this.max,
      min: this.min,
      initialDelta: this.initialDelta,
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
      totalDeltaX: this.initialDelta,
      totalDeltaY: this.initialDelta,
      totalDeltaZ: this.initialDelta,
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

    // Update the accumulated deltas
    const wheelState = this.wheelEmitters.get(element);
    if (wheelState) {
      // Update total deltas with scaled values
      wheelState.totalDeltaX += event.deltaX * this.scale;
      wheelState.totalDeltaY += event.deltaY * this.scale;
      wheelState.totalDeltaZ += event.deltaZ * this.scale;

      // Apply proper min/max clamping for each axis
      // Ensure values stay between min and max bounds
      (['totalDeltaX', 'totalDeltaY', 'totalDeltaZ'] as const).forEach(axis => {
        // First clamp at the minimum bound
        if (wheelState[axis] < this.min) {
          wheelState[axis] = this.min;
        }

        // Then clamp at the maximum bound
        if (wheelState[axis] > this.max) {
          wheelState[axis] = this.max;
        }
      });
    }

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

    // Get the wheel state for this element
    const wheelState = this.wheelEmitters.get(element);
    if (!wheelState) return;

    // Create custom event data
    const customEventData: TurnWheelGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event,
      state: 'ongoing', // Wheel events are always in "ongoing" state
      pointers,
      timeStamp: event.timeStamp,
      deltaX: event.deltaX * this.scale,
      deltaY: event.deltaY * this.scale,
      deltaZ: event.deltaZ * this.scale,
      deltaMode: event.deltaMode,
      totalDeltaX: wheelState.totalDeltaX,
      totalDeltaY: wheelState.totalDeltaY,
      totalDeltaZ: wheelState.totalDeltaZ,
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
