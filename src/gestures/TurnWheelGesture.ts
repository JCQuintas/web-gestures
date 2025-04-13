/**
 * TurnWheelGesture - Detects wheel events on an element
 *
 * This gesture tracks mouse wheel or touchpad scroll events on elements, firing events when:
 * - The user scrolls/wheels on the element (ongoing)
 *
 * Unlike other gestures which may have start/ongoing/end states,
 * wheel gestures are always considered "ongoing" since they are discrete events.
 */

import { Gesture, GestureEventData, GestureOptions, GestureState } from '../Gesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

/**
 * Configuration options for the TurnWheelGesture
 * Uses the base gesture options with additional wheel-specific options
 */
export type TurnWheelGestureOptions<Name extends string> = GestureOptions<Name> & {
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

  /**
   * Invert the direction of delta changes
   * When true, reverses the sign of deltaX, deltaY, and deltaZ values
   * @default false
   */
  invert?: boolean;
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
 * State tracking for the TurnWheelGesture
 */
export type TurnWheelGestureState = GestureState & {
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
export class TurnWheelGesture<Name extends string> extends Gesture<Name> {
  protected state: TurnWheelGestureState = {
    active: false,
    startPointers: new Map(),
    totalDeltaX: 0,
    totalDeltaY: 0,
    totalDeltaZ: 0,
  };

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
   * Whether to invert the direction of delta changes
   * When true, reverses the sign of deltaX, deltaY, and deltaZ values
   */
  private invert: boolean;

  constructor(options: TurnWheelGestureOptions<Name>) {
    super(options);
    this.scale = options.sensitivity ?? 1;
    this.max = options.max ?? Number.MAX_SAFE_INTEGER;
    this.min = options.min ?? Number.MIN_SAFE_INTEGER;
    this.initialDelta = options.initialDelta ?? 0;
    this.invert = options.invert ?? false;

    this.state.totalDeltaX = this.initialDelta;
    this.state.totalDeltaY = this.initialDelta;
    this.state.totalDeltaZ = this.initialDelta;
  }

  public clone(overrides?: Record<string, unknown>): TurnWheelGesture<Name> {
    return new TurnWheelGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      sensitivity: this.scale,
      max: this.max,
      min: this.min,
      initialDelta: this.initialDelta,
      invert: this.invert,
      // Apply any overrides passed to the method
      ...overrides,
    });
  }

  public setTargetElement(element: HTMLElement) {
    super.setTargetElement(element);

    // Add event listener directly to the element
    element.addEventListener('wheel', this.handleWheelEvent.bind(this, element));
  }

  public destroy(): void {
    // Remove the element-specific event listener
    this.element?.removeEventListener('wheel', this.handleWheelEvent.bind(this, this.element));
    this.resetState();
  }

  protected resetState(): void {
    this.state = {
      active: false,
      startPointers: new Map(),
      totalDeltaX: 0,
      totalDeltaY: 0,
      totalDeltaZ: 0,
    };
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
    const wheelState = this.state;

    // Update total deltas with scaled values
    wheelState.totalDeltaX += event.deltaX * this.scale * (this.invert ? 1 : -1);
    wheelState.totalDeltaY += event.deltaY * this.scale * (this.invert ? 1 : -1);
    wheelState.totalDeltaZ += event.deltaZ * this.scale * (this.invert ? 1 : -1);

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
    const wheelState = this.state;

    // Create custom event data
    const customEventData: TurnWheelGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event,
      phase: 'ongoing', // Wheel events are always in "ongoing" state
      pointers,
      timeStamp: event.timeStamp,
      deltaX: event.deltaX * this.scale * (this.invert ? 1 : -1),
      deltaY: event.deltaY * this.scale * (this.invert ? 1 : -1),
      deltaZ: event.deltaZ * this.scale * (this.invert ? 1 : -1),
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
