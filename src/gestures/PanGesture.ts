/**
 * PanGesture - Detects panning (dragging) movements
 *
 * This gesture tracks pointer dragging movements across elements, firing events when:
 * - The drag movement begins and passes the threshold distance (start)
 * - The drag movement continues (ongoing)
 * - The drag movement ends (end)
 *
 * The gesture can be configured to recognize movement only in specific directions.
 */

import { GestureEventData, GesturePhase } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { InternalEvent } from '../types';
import { calculateCentroid, createEventName, getDirection, isDirectionAllowed } from '../utils';

/**
 * Configuration options for PanGesture
 * Extends PointerGestureOptions with direction constraints
 */
export type PanGestureOptions = PointerGestureOptions & {
  /**
   * Optional array of allowed directions for the pan gesture
   * If not specified, all directions are allowed
   */
  direction?: Array<'up' | 'down' | 'left' | 'right'>;
};

/**
 * Event data specific to pan gesture events
 * Contains information about movement distance, direction, and velocity
 */
export type PanGestureEventData = GestureEventData & {
  /** Horizontal distance moved in pixels from the start of the current gesture */
  deltaX: number;
  /** Vertical distance moved in pixels from the start of the current gesture */
  deltaY: number;
  /** Total accumulated horizontal movement in pixels */
  totalDeltaX: number;
  /** Total accumulated vertical movement in pixels */
  totalDeltaY: number;
  /** The primary direction of movement (up, down, left, right, or null if no clear direction) */
  direction: 'up' | 'down' | 'left' | 'right' | null;
  /** Horizontal velocity in pixels per second */
  velocityX: number;
  /** Vertical velocity in pixels per second */
  velocityY: number;
  /** Total velocity magnitude in pixels per second */
  velocity: number;
  /** The original DOM pointer event that triggered this gesture event */
  srcEvent: PointerEvent;
};

/**
 * Type definition for the CustomEvent created by PanGesture
 */
export type PanEvent = CustomEvent<PanGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type PanGestureState = {
  /** Whether the pan gesture is currently active for this element */
  active: boolean;
  /** Map of pointer IDs to their initial state when the gesture began */
  startPointers: Map<number, PointerData>;
  /** The initial centroid position when the gesture began */
  startCentroid: { x: number; y: number } | null;
  /** The most recent centroid position during the gesture */
  lastCentroid: { x: number; y: number } | null;
  /** Whether the movement threshold has been reached to activate the gesture */
  movementThresholdReached: boolean;
  /** Total accumulated horizontal delta since gesture tracking began */
  totalDeltaX: number;
  /** Total accumulated vertical delta since gesture tracking began */
  totalDeltaY: number;
};

/**
 * PanGesture class for handling panning/dragging interactions
 *
 * This gesture detects when users drag across elements with one or more pointers,
 * and dispatches directional movement events with delta and velocity information.
 */
export class PanGesture extends PointerGesture {
  /**
   * Allowed directions for the pan gesture
   * Default allows all directions
   */
  private direction: Array<'up' | 'down' | 'left' | 'right'>;

  /**
   * Map of elements to their specific pan gesture state
   * Tracks pointers, centroids and threshold state for each element
   */
  private state: PanGestureState = {
    active: false,
    startPointers: new Map(),
    startCentroid: null,
    lastCentroid: null,
    movementThresholdReached: false,
    totalDeltaX: 0,
    totalDeltaY: 0,
  };

  /**
   * Creates a new PanGesture instance
   * @param options Configuration options for the gesture, including direction constraints
   */
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

    this.state = {
      active: false,
      startPointers: new Map(),
      startCentroid: null,
      lastCentroid: null,
      movementThresholdReached: false,
      totalDeltaX: 0,
      totalDeltaY: 0,
    };

    return emitter;
  }

  /**
   * Override removeEmitter to clean up pan-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.state = {
      active: false,
      startPointers: new Map(),
      startCentroid: null,
      lastCentroid: null,
      movementThresholdReached: false,
      totalDeltaX: 0,
      totalDeltaY: 0,
    };
    super.removeEmitter(element);
  }

  /**
   * Handle pointer events for the pan gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    // Check for our special forceReset flag to handle interrupted gestures (from contextmenu, blur)
    if ((event as InternalEvent).forceReset) {
      // Reset all active pan gestures when we get a force reset event
      this.emitters.forEach((_, element) => {
        // Cancel any active gesture with a proper cancel event
        const panState = this.state;
        const emitterState = this.getEmitterState(element);

        if (panState?.active || emitterState?.active) {
          const relevantPointers = Array.from(pointers.values());
          // Only emit if we have active state and necessary data
          if (emitterState?.active && panState?.startCentroid && panState.lastCentroid) {
            this.emitPanEvent(element, 'cancel', relevantPointers, event, panState.lastCentroid);
          }
          // Don't reset total delta values on force reset - just the active gesture state
          this.resetActiveState(element);
        }
      });
      return;
    }

    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific states
    const emitterState = this.getEmitterState(targetElement);
    const panState = this.state;

    if (!emitterState) return;

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
            // Calculate change in position since last move
            const lastDeltaX = panState.lastCentroid
              ? currentCentroid.x - panState.lastCentroid.x
              : 0;
            const lastDeltaY = panState.lastCentroid
              ? currentCentroid.y - panState.lastCentroid.y
              : 0;

            // Update total accumulated delta
            if (panState.movementThresholdReached) {
              panState.totalDeltaX += lastDeltaX;
              panState.totalDeltaY += lastDeltaY;
            }

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

            // Reset active state but keep total delta values
            this.resetActiveState(targetElement);
          }
        } else {
          // If threshold wasn't reached (simple click), just reset active state
          this.resetActiveState(targetElement);
        }
        break;
    }
  }

  /**
   * Emit pan-specific events with additional data
   */
  private emitPanEvent(
    element: HTMLElement,
    phase: GesturePhase,
    pointers: PointerData[],
    event: PointerEvent,
    currentCentroid: { x: number; y: number }
  ): void {
    const panState = this.state;
    const emitterState = this.getEmitterState(element);

    if (!panState.startCentroid || !emitterState) return;

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
      phase: phase,
      pointers,
      timeStamp: event.timeStamp,
      deltaX,
      deltaY,
      direction,
      velocityX,
      velocityY,
      velocity,
      totalDeltaX: panState.totalDeltaX,
      totalDeltaY: panState.totalDeltaY,
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
   * Cancel the current gesture
   */
  private cancel(element: HTMLElement, pointers: PointerData[], event: PointerEvent): void {
    const emitterState = this.getEmitterState(element);
    const panState = this.state;

    if (emitterState?.active && panState.startCentroid && panState.lastCentroid) {
      this.emitPanEvent(element, 'cancel', pointers, event, panState.lastCentroid);
    }
    this.reset(element);
  }

  /**
   * Reset the gesture state for a specific element
   */
  private reset(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const panState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    panState.startCentroid = null;
    panState.lastCentroid = null;
    panState.movementThresholdReached = false;
    panState.totalDeltaX = 0;
    panState.totalDeltaY = 0;
  }

  /**
   * Reset the active gesture state for a specific element, but keep total delta values
   */
  private resetActiveState(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const panState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    panState.startCentroid = null;
    panState.lastCentroid = null;
    panState.movementThresholdReached = false;
  }
}
