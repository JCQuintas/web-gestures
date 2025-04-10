/**
 * MoveGesture - Detects when a pointer enters, moves within, and leaves an element
 */

import { GestureEventData } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

export type MoveGestureOptions = PointerGestureOptions;

export type MoveGestureEventData = GestureEventData & {
  srcEvent: PointerEvent;
};

export type MoveEvent = CustomEvent<MoveGestureEventData>;

export class MoveGesture extends PointerGesture {
  // Map of elements to their specific move gesture state
  private moveEmitters = new Map<
    HTMLElement,
    {
      active: boolean;
      lastPosition: { x: number; y: number } | null;
    }
  >();

  constructor(options: MoveGestureOptions) {
    super(options);
  }

  /**
   * Clone this gesture with the same options
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
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    this.moveEmitters.set(element, {
      active: false,
      lastPosition: null,
    });

    // Add event listeners for entering and leaving elements
    // These are different from pointer events handled by PointerManager
    element.addEventListener('pointerenter', this.handleElementEnter.bind(this, element));
    element.addEventListener('pointerleave', this.handleElementLeave.bind(this, element));

    return emitter;
  }

  /**
   * Override removeEmitter to clean up move-specific state and element event listeners
   */
  protected removeEmitter(element: HTMLElement): void {
    element.removeEventListener('pointerenter', this.handleElementEnter.bind(this, element));
    element.removeEventListener('pointerleave', this.handleElementLeave.bind(this, element));
    this.moveEmitters.delete(element);
    super.removeEmitter(element);
  }

  /**
   * Handle pointer enter events for a specific element
   */
  private handleElementEnter(element: HTMLElement, event: PointerEvent): void {
    const moveState = this.moveEmitters.get(element);
    if (!moveState) return;

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
   */
  private handleElementLeave(element: HTMLElement, event: PointerEvent): void {
    const moveState = this.moveEmitters.get(element);
    if (!moveState || !moveState.active) return;

    // Get pointers from the PointerManager
    const pointers = this.pointerManager?.getPointers() || new Map();
    const pointersArray = Array.from(pointers.values());

    // Emit end event and reset state
    this.emitMoveEvent(element, 'end', pointersArray, event);
    this.reset(element);
  }

  /**
   * Handle pointer events for the move gesture (only handles move events now)
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    if (event.type !== 'pointermove') return;

    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific state
    const moveState = this.moveEmitters.get(targetElement);

    if (!moveState || !moveState.active) return;

    // Make sure we're still within pointer count constraints
    if (pointersArray.length < this.minPointers || pointersArray.length > this.maxPointers) {
      return;
    }

    // Update position and emit move event
    const currentPosition = { x: event.clientX, y: event.clientY };
    moveState.lastPosition = currentPosition;

    // Emit move event
    this.emitMoveEvent(targetElement, 'move', pointersArray, event);
  }

  /**
   * Emit move-specific events
   */
  private emitMoveEvent(
    element: HTMLElement,
    state: 'start' | 'move' | 'end',
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    const moveState = this.moveEmitters.get(element);
    if (!moveState) return;

    const currentPosition = moveState.lastPosition || calculateCentroid(pointers);

    // Create custom event data
    const customEventData: MoveGestureEventData = {
      centroid: currentPosition,
      target: event.target,
      srcEvent: event,
      state,
      pointers,
      timeStamp: event.timeStamp,
    };

    // Event names to trigger
    const eventName = createEventName(this.name, state);

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
   */
  private reset(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const moveState = this.moveEmitters.get(element);

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    if (moveState) {
      moveState.active = false;
      moveState.lastPosition = null;
    }
  }
}
