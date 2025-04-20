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

import { GesturePhase, GestureState } from '../Gesture';
import { PointerGesture, PointerGestureEventData, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { TargetElement } from '../types/TargetElement';
import { calculateCentroid, createEventName } from '../utils';

/**
 * Configuration options for the MoveGesture
 * Extends the base PointerGestureOptions
 */
export type MoveGestureOptions<GestureName extends string> = PointerGestureOptions<GestureName>;

/**
 * Event data specific to move gesture events
 * Includes the source pointer event and standard gesture data
 */
export type MoveGestureEventData<
  CustomData extends Record<string, unknown> = Record<string, unknown>,
> = PointerGestureEventData<CustomData> & {};

/**
 * Type definition for the CustomEvent created by MoveGesture
 */
export type MoveEvent<CustomData extends Record<string, unknown> = Record<string, unknown>> =
  CustomEvent<MoveGestureEventData<CustomData>>;

/**
 * State tracking for the MoveGesture
 */
export type MoveGestureState = GestureState & {
  /** The last recorded pointer position for this element */
  lastPosition: { x: number; y: number } | null;
};

/**
 * MoveGesture class for handling pointer movement over elements
 *
 * This gesture detects when pointers enter, move within, or leave target elements,
 * and dispatches corresponding custom events.
 */
export class MoveGesture<GestureName extends string> extends PointerGesture<GestureName> {
  protected state: MoveGestureState = {
    lastPosition: null,
  };

  protected readonly isSinglePhase!: false;
  protected readonly eventType!: MoveEvent;
  protected readonly optionsType!: MoveGestureOptions<GestureName>;
  protected readonly mutableOptionsType!: Omit<typeof this.optionsType, 'name'>;
  protected readonly mutableStateType!: never;

  constructor(options: MoveGestureOptions<GestureName>) {
    super(options);
  }

  public clone(overrides?: Record<string, unknown>): MoveGesture<GestureName> {
    return new MoveGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
      preventIf: [...this.preventIf],
      // Apply any overrides passed to the method
      ...overrides,
    });
  }

  public init(element: TargetElement) {
    super.init(element);

    // Add event listeners for entering and leaving elements
    // These are different from pointer events handled by PointerManager
    this.element.addEventListener('pointerenter', this.handleElementEnter.bind(this, element));
    this.element.addEventListener('pointerleave', this.handleElementLeave.bind(this, element));
  }

  public destroy(): void {
    this.element.removeEventListener(
      'pointerenter',
      this.handleElementEnter.bind(this, this.element)
    );
    this.element.removeEventListener(
      'pointerleave',
      this.handleElementLeave.bind(this, this.element)
    );
    this.resetState();
    super.destroy();
  }

  protected updateOptions(options: typeof this.mutableOptionsType): void {
    // Call parent method to handle common options
    super.updateOptions(options);
  }

  protected resetState(): void {
    this.isActive = false;
    this.state = {
      lastPosition: null,
    };
  }

  /**
   * Handle pointer enter events for a specific element
   * @param element The DOM element the pointer entered
   * @param event The original pointer event
   */
  private handleElementEnter(element: TargetElement, event: PointerEvent): void {
    // Get pointers from the PointerManager
    const pointers = this.pointerManager.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Only activate if we're within pointer count constraints
    if (pointersArray.length >= this.minPointers && pointersArray.length <= this.maxPointers) {
      this.isActive = true;
      const currentPosition = { x: event.clientX, y: event.clientY };
      this.state.lastPosition = currentPosition;

      // Emit start event
      this.emitMoveEvent(element, 'start', pointersArray, event);
    }
  }

  /**
   * Handle pointer leave events for a specific element
   * @param element The DOM element the pointer left
   * @param event The original pointer event
   */
  private handleElementLeave(element: TargetElement, event: PointerEvent): void {
    if (!this.isActive) return;

    // Get pointers from the PointerManager
    const pointers = this.pointerManager.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Emit end event and reset state
    this.emitMoveEvent(element, 'end', pointersArray, event);
    this.resetState();
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

    // Make sure we're still within pointer count constraints
    if (pointersArray.length < this.minPointers || pointersArray.length > this.maxPointers) {
      return;
    }

    // Update position
    const currentPosition = { x: event.clientX, y: event.clientY };
    this.state.lastPosition = currentPosition;

    if (!this.isActive) {
      this.emitMoveEvent(targetElement, 'start', pointersArray, event);
      return;
    }
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
    element: TargetElement,
    phase: GesturePhase,
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    if (this.shouldPreventGesture(element)) {
      return;
    }
    const currentPosition = this.state.lastPosition || calculateCentroid(pointers);

    // Get list of active gestures
    const activeGestures = this.gesturesRegistry.getActiveGestures(element);

    // Create custom event data
    const customEventData: MoveGestureEventData = {
      centroid: currentPosition,
      target: event.target,
      srcEvent: event,
      phase: phase,
      pointers,
      timeStamp: event.timeStamp,
      activeGestures,
      customData: this.customData,
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
}
