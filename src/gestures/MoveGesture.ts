/**
 * MoveGesture - Detects when a pointer enters, moves within, and leaves an element
 *
 * This gesture tracks pointer movements over an element, firing events when:
 * - A pointer enters the element (start)
 * - A pointer moves within the element (ongoing)
 * - A pointer leaves the element (end)
 *
 * Unlike other gestures which often require specific actions to trigger,
 * the move gesture fires automatically when pointers interact with the target element.
 */

import { GestureEventData, GesturePhase } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

/**
 * Configuration options for the MoveGesture
 * Extends the base PointerGestureOptions
 */
export type MoveGestureOptions = PointerGestureOptions;

/**
 * Event data specific to move gesture events
 * Includes the source pointer event and standard gesture data
 */
export type MoveGestureEventData = GestureEventData & {
  /** The original DOM pointer event that triggered this gesture event */
  srcEvent: PointerEvent;
};

/**
 * Type definition for the CustomEvent created by MoveGesture
 */
export type MoveEvent = CustomEvent<MoveGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type MoveGestureState = {
  /** Whether the move gesture is currently active for this element */
  active: boolean;
  /** The last recorded pointer position for this element */
  lastPosition: { x: number; y: number } | null;
};

/**
 * MoveGesture class for handling pointer movement over elements
 *
 * This gesture detects when pointers enter, move within, or leave target elements,
 * and dispatches corresponding custom events.
 */
export class MoveGesture extends PointerGesture {
  /**
   * Map of elements to their specific move gesture state
   * Tracks active status and last known pointer position for each element
   */
  private state: MoveGestureState = {
    active: false,
    lastPosition: null,
  };

  /**
   * Creates a new MoveGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: MoveGestureOptions) {
    super(options);
  }

  /**
   * Clone this gesture with the same options
   * @returns A new MoveGesture instance with identical configuration
   */
  public clone(): MoveGesture {
    return new MoveGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
    });
  }

  /**
   * Override createEmitter to add move-specific state
   * @param element The DOM element to attach the gesture to
   * @returns The emitter object created by the parent class
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    this.state = {
      active: false,
      lastPosition: null,
    };

    // Add event listeners for entering and leaving elements
    // These are different from pointer events handled by PointerManager
    element.addEventListener('pointerenter', this.handleElementEnter.bind(this, element));
    element.addEventListener('pointerleave', this.handleElementLeave.bind(this, element));

    return emitter;
  }

  /**
   * Override removeEmitter to clean up move-specific state and element event listeners
   * @param element The DOM element to remove the gesture from
   */
  protected removeEmitter(element: HTMLElement): void {
    element.removeEventListener('pointerenter', this.handleElementEnter.bind(this, element));
    element.removeEventListener('pointerleave', this.handleElementLeave.bind(this, element));
    this.state = {
      active: false,
      lastPosition: null,
    };
    super.removeEmitter(element);
  }

  /**
   * Handle pointer enter events for a specific element
   * @param element The DOM element the pointer entered
   * @param event The original pointer event
   */
  private handleElementEnter(element: HTMLElement, event: PointerEvent): void {
    const moveState = this.state;

    // Get pointers from the PointerManager
    const pointers = this.pointerManager?.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Only activate if we're within pointer count constraints
    if (pointersArray.length >= this.minPointers && pointersArray.length <= this.maxPointers) {
      moveState.active = true;
      const currentPosition = { x: event.clientX, y: event.clientY };
      moveState.lastPosition = currentPosition;

      // Emit start event
      this.emitMoveEvent(element, 'start', pointersArray, event);
    }
  }

  /**
   * Handle pointer leave events for a specific element
   * @param element The DOM element the pointer left
   * @param event The original pointer event
   */
  private handleElementLeave(element: HTMLElement, event: PointerEvent): void {
    const moveState = this.state;
    if (!moveState.active) return;

    // Get pointers from the PointerManager
    const pointers = this.pointerManager?.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Emit end event and reset state
    this.emitMoveEvent(element, 'end', pointersArray, event);
    this.reset(element);
  }

  /**
   * Handle pointer events for the move gesture (only handles move events now)
   * @param pointers Map of active pointers
   * @param event The original pointer event
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    if (event.type !== 'pointermove') return;

    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific state
    const moveState = this.state;

    if (!moveState.active) return;

    // Make sure we're still within pointer count constraints
    if (pointersArray.length < this.minPointers || pointersArray.length > this.maxPointers) {
      return;
    }

    // Update position
    const currentPosition = { x: event.clientX, y: event.clientY };
    moveState.lastPosition = currentPosition;

    // Emit ongoing event
    this.emitMoveEvent(targetElement, 'ongoing', pointersArray, event);
  }

  /**
   * Emit move-specific events
   * @param element The DOM element the event is related to
   * @param phase The current phase of the gesture (start, ongoing, end)
   * @param pointers Array of active pointers
   * @param event The original pointer event
   */
  private emitMoveEvent(
    element: HTMLElement,
    phase: GesturePhase,
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    const moveState = this.state;

    const currentPosition = moveState.lastPosition || calculateCentroid(pointers);

    // Create custom event data
    const customEventData: MoveGestureEventData = {
      centroid: currentPosition,
      target: event.target,
      srcEvent: event,
      phase: phase,
      pointers,
      timeStamp: event.timeStamp,
    };

    // Event names to trigger
    const eventName = createEventName(this.name, phase);

    // Dispatch custom events on the element
    const domEvent = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: customEventData,
    });

    element.dispatchEvent(domEvent);
  }

  /**
   * Reset the gesture state for a specific element
   * @param element The DOM element to reset the gesture state for
   */
  private reset(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const moveState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    moveState.active = false;
    moveState.lastPosition = null;
  }
}
