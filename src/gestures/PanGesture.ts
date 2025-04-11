/**
 * PanGesture - Detects panning (dragging) movements
 */

import { GestureEventData, GestureState } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName, getDirection, isDirectionAllowed } from '../utils';

export type PanGestureOptions = PointerGestureOptions & {
  direction?: Array<'up' | 'down' | 'left' | 'right'>;
};

export type PanGestureEventData = GestureEventData & {
  deltaX: number;
  deltaY: number;
  direction: 'up' | 'down' | 'left' | 'right' | null;
  velocityX: number;
  velocityY: number;
  velocity: number;
  srcEvent: PointerEvent;
};

export type PanEvent = CustomEvent<PanGestureEventData>;

export type EmitterState = {
  active: boolean;
  startPointers: Map<number, PointerData>;
  startCentroid: { x: number; y: number } | null;
  lastCentroid: { x: number; y: number } | null;
  movementThresholdReached: boolean;
};

export class PanGesture extends PointerGesture {
  // Additional options for pan gesture
  private direction: Array<'up' | 'down' | 'left' | 'right'>;

  // Map of elements to their specific pan gesture state
  private panEmitters = new Map<HTMLElement, EmitterState>();

  constructor(options: PanGestureOptions) {
    super(options);
    this.direction = options.direction || ['up', 'down', 'left', 'right'];
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): PanGesture {
    return new PanGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
      direction: [...this.direction],
    });
  }

  /**
   * Override createEmitter to add pan-specific state
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    this.panEmitters.set(element, {
      active: false,
      startPointers: new Map(),
      startCentroid: null,
      lastCentroid: null,
      movementThresholdReached: false,
    });

    return emitter;
  }

  /**
   * Override removeEmitter to clean up pan-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.panEmitters.delete(element);
    super.removeEmitter(element);
  }

  /**
   * Handle pointer events for the pan gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific states
    const emitterState = this.getEmitterState(targetElement);
    const panState = this.panEmitters.get(targetElement);

    if (!emitterState || !panState) return;

    // Filter pointers to only include those targeting our element or its children
    const relevantPointers = pointersArray.filter(
      pointer => targetElement === pointer.target || targetElement.contains(pointer.target as Node)
    );

    // Check if we have enough pointers and not too many
    if (relevantPointers.length < this.minPointers || relevantPointers.length > this.maxPointers) {
      if (emitterState.active) {
        // Cancel or end the gesture if it was active
        this.cancel(targetElement, relevantPointers, event);
      }
      return;
    }

    switch (event.type) {
      case 'pointerdown':
        if (!emitterState.active && !panState.startCentroid) {
          // Store initial pointers
          relevantPointers.forEach(pointer => {
            emitterState.startPointers.set(pointer.pointerId, pointer);
          });

          // Calculate and store the starting centroid
          panState.startCentroid = calculateCentroid(relevantPointers);
          panState.lastCentroid = { ...panState.startCentroid };
        }
        break;

      case 'pointermove':
        if (panState.startCentroid && relevantPointers.length >= this.minPointers) {
          // Calculate current centroid
          const currentCentroid = calculateCentroid(relevantPointers);

          // Calculate delta from start
          const deltaX = currentCentroid.x - panState.startCentroid.x;
          const deltaY = currentCentroid.y - panState.startCentroid.y;

          // Calculate movement distance
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // Determine movement direction
          const moveDirection = getDirection(panState.startCentroid, currentCentroid);

          // Check if movement passes the threshold and is in an allowed direction
          if (
            !panState.movementThresholdReached &&
            distance >= this.threshold &&
            isDirectionAllowed(moveDirection, this.direction)
          ) {
            panState.movementThresholdReached = true;
            emitterState.active = true;

            // Emit start event
            this.emitPanEvent(targetElement, 'start', relevantPointers, event, currentCentroid);
          }
          // If we've already crossed the threshold, continue tracking
          else if (panState.movementThresholdReached && emitterState.active) {
            // Emit ongoing event
            this.emitPanEvent(targetElement, 'ongoing', relevantPointers, event, currentCentroid);
          }

          // Update last centroid
          panState.lastCentroid = currentCentroid;
        }
        break;

      case 'pointerup':
      case 'pointercancel':
        // If the gesture was active (threshold was reached), emit end event
        if (emitterState.active && panState.movementThresholdReached) {
          // If all relevant pointers are gone, end the gesture
          if (
            relevantPointers.filter(p => p.type !== 'pointerup' && p.type !== 'pointercancel')
              .length === 0
          ) {
            // End the gesture
            const currentCentroid = panState.lastCentroid || panState.startCentroid!;
            this.emitPanEvent(targetElement, 'end', relevantPointers, event, currentCentroid);

            // Reset state
            this.reset(targetElement);
          }
        } else {
          // If threshold wasn't reached (simple click), just reset without emitting events
          this.reset(targetElement);
        }
        break;
    }
  }

  /**
   * Emit pan-specific events with additional data
   */
  private emitPanEvent(
    element: HTMLElement,
    state: GestureState,
    pointers: PointerData[],
    event: PointerEvent,
    currentCentroid: { x: number; y: number }
  ): void {
    const panState = this.panEmitters.get(element);
    const emitterState = this.getEmitterState(element);

    if (!panState?.startCentroid || !emitterState) return;

    // Calculate deltas from start position
    const deltaX = currentCentroid.x - panState.startCentroid.x;
    const deltaY = currentCentroid.y - panState.startCentroid.y;

    // Get direction of movement
    const direction = getDirection(panState.startCentroid, currentCentroid);

    // Calculate velocity - time difference in seconds
    const firstPointer = emitterState.startPointers.values().next().value;
    const timeElapsed = firstPointer ? (event.timeStamp - firstPointer.timeStamp) / 1000 : 0;
    const velocityX = timeElapsed > 0 ? deltaX / timeElapsed : 0;
    const velocityY = timeElapsed > 0 ? deltaY / timeElapsed : 0;
    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    // Create custom event data
    const customEventData: PanGestureEventData = {
      centroid: currentCentroid,
      target: event.target,
      srcEvent: event,
      state,
      pointers,
      timeStamp: event.timeStamp,
      deltaX,
      deltaY,
      direction,
      velocityX,
      velocityY,
      velocity,
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
   * Cancel the current gesture
   */
  private cancel(element: HTMLElement, pointers: PointerData[], event: PointerEvent): void {
    const emitterState = this.getEmitterState(element);
    const panState = this.panEmitters.get(element);

    if (emitterState?.active && panState?.startCentroid && panState.lastCentroid) {
      this.emitPanEvent(element, 'cancel', pointers, event, panState.lastCentroid);
    }
    this.reset(element);
  }

  /**
   * Reset the gesture state for a specific element
   */
  private reset(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const panState = this.panEmitters.get(element);

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    if (panState) {
      panState.startCentroid = null;
      panState.lastCentroid = null;
      panState.movementThresholdReached = false;
    }
  }
}
