/**
 * TapGesture - Detects tap (quick touch without movement) gestures
 *
 * This gesture tracks simple tap interactions on elements, firing a single event when:
 * - A complete tap is detected (pointerup after brief touch without excessive movement)
 * - The tap is canceled (e.g., moved too far or held too long)
 */

import { GestureEventData } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName } from '../utils';

/**
 * Configuration options for TapGesture
 * Extends PointerGestureOptions with tap-specific settings
 */
export type TapGestureOptions = PointerGestureOptions & {
  /**
   * Maximum distance in pixels a pointer can move for the gesture to still be considered a tap
   * @default 10
   */
  maxDistance?: number;

  /**
   * Number of consecutive taps to detect (for double-tap, triple-tap)
   * @default 1
   */
  taps?: number;
};

/**
 * Event data specific to tap gesture events
 * Contains information about the tap location and counts
 */
export type TapGestureEventData = GestureEventData & {
  /** X coordinate of the tap */
  x: number;
  /** Y coordinate of the tap */
  y: number;
  /** Current count of taps in a sequence */
  tapCount: number;
  /** The original DOM pointer event that triggered this gesture event */
  srcEvent: PointerEvent;
};

/**
 * Type definition for the CustomEvent created by TapGesture
 */
export type TapEvent = CustomEvent<TapGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type TapGestureState = {
  /** Whether the tap gesture is currently active for this element */
  active: boolean;
  /** Map of pointer IDs to their initial state when the gesture began */
  startPointers: Map<number, PointerData>;
  /** The initial centroid position when the gesture began */
  startCentroid: { x: number; y: number } | null;
  /** Current count of consecutive taps */
  currentTapCount: number;
  /** Timestamp of the last tap */
  lastTapTime: number;
  /** The most recent centroid position during the gesture */
  lastPosition: { x: number; y: number } | null;
};

/**
 * TapGesture class for handling tap interactions
 *
 * This gesture detects when users tap on elements without significant movement,
 * and can recognize single taps, double taps, or other multi-tap sequences.
 */
export class TapGesture extends PointerGesture {
  /**
   * Maximum distance a pointer can move for a gesture to still be considered a tap
   */
  private maxDistance: number;

  /**
   * Number of consecutive taps to detect
   */
  private taps: number;

  /**
   * Map of elements to their specific tap gesture state
   */
  private state: TapGestureState = {
    active: false,
    startPointers: new Map(),
    startCentroid: null,
    currentTapCount: 0,
    lastTapTime: 0,
    lastPosition: null,
  };

  /**
   * Creates a new TapGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: TapGestureOptions) {
    super(options);
    this.maxDistance = options.maxDistance ?? 10;
    this.taps = options.taps ?? 1;
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): TapGesture {
    return new TapGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
      maxDistance: this.maxDistance,
      taps: this.taps,
    });
  }

  /**
   * Override createEmitter to add tap-specific state
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    this.state = {
      active: false,
      startPointers: new Map(),
      startCentroid: null,
      currentTapCount: 0,
      lastTapTime: 0,
      lastPosition: null,
    };

    return emitter;
  }

  /**
   * Override removeEmitter to clean up tap-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.state = {
      active: false,
      startPointers: new Map(),
      startCentroid: null,
      currentTapCount: 0,
      lastTapTime: 0,
      lastPosition: null,
    };
    super.removeEmitter(element);
  }

  /**
   * Handle pointer events for the tap gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific states
    const emitterState = this.getEmitterState(targetElement);
    const tapState = this.state;

    if (!emitterState) return;

    // Filter pointers to only include those targeting our element or its children
    const relevantPointers = pointersArray.filter(
      pointer => targetElement === pointer.target || targetElement.contains(pointer.target as Node)
    );

    // Check if we have enough pointers and not too many
    if (relevantPointers.length < this.minPointers || relevantPointers.length > this.maxPointers) {
      if (emitterState.active) {
        // Cancel the gesture if it was active
        this.cancelTap(targetElement, relevantPointers, event);
      }
      return;
    }

    switch (event.type) {
      case 'pointerdown':
        if (!emitterState.active) {
          // Store initial pointers
          relevantPointers.forEach(pointer => {
            emitterState.startPointers.set(pointer.pointerId, pointer);
          });

          // Calculate and store the starting centroid
          tapState.startCentroid = calculateCentroid(relevantPointers);
          tapState.lastPosition = { ...tapState.startCentroid };
          emitterState.active = true;
        }
        break;

      case 'pointermove':
        if (emitterState.active && tapState.startCentroid) {
          // Calculate current position
          const currentPosition = calculateCentroid(relevantPointers);
          tapState.lastPosition = currentPosition;

          // Calculate distance from start position
          const deltaX = currentPosition.x - tapState.startCentroid.x;
          const deltaY = currentPosition.y - tapState.startCentroid.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // If moved too far, cancel the tap gesture
          if (distance > this.maxDistance) {
            this.cancelTap(targetElement, relevantPointers, event);
          }
        }
        break;

      case 'pointerup':
        if (emitterState.active) {
          // For valid tap: increment tap count
          tapState.currentTapCount++;

          // Make sure we have a valid position before firing the tap event
          const position = tapState.lastPosition || tapState.startCentroid;
          if (!position) {
            this.cancelTap(targetElement, relevantPointers, event);
            return;
          }

          // Check if we've reached the desired number of taps
          if (tapState.currentTapCount >= this.taps) {
            // The complete tap sequence has been detected - fire the tap event
            this.fireTapEvent(targetElement, relevantPointers, event, position);

            // Reset state after successful tap
            this.resetTapState(targetElement);
          } else {
            // Store the time of this tap for multi-tap detection
            tapState.lastTapTime = event.timeStamp;

            // Reset active state but keep the tap count for multi-tap detection
            emitterState.active = false;
            emitterState.startPointers.clear();

            // For multi-tap detection: keep track of the last tap position
            // but clear the start centroid to prepare for next tap
            tapState.startCentroid = null;

            // Start a timeout to reset the tap count if the next tap doesn't come soon enough
            setTimeout(() => {
              if (
                tapState &&
                tapState.currentTapCount > 0 &&
                tapState.currentTapCount < this.taps
              ) {
                tapState.currentTapCount = 0;
              }
            }, 300); // 300ms is a typical double-tap detection window
          }
        }
        break;

      case 'pointercancel':
        // Cancel the gesture
        this.cancelTap(targetElement, relevantPointers, event);
        break;
    }
  }

  /**
   * Fire the main tap event when a valid tap is detected
   */
  private fireTapEvent(
    element: HTMLElement,
    pointers: PointerData[],
    event: PointerEvent,
    position: { x: number; y: number }
  ): void {
    const tapState = this.state;

    // Create custom event data for the tap event
    const customEventData: TapGestureEventData = {
      centroid: position,
      target: event.target,
      srcEvent: event,
      phase: 'end', // The tap is complete, so we use 'end' state for the event data
      pointers,
      timeStamp: event.timeStamp,
      x: position.x,
      y: position.y,
      tapCount: tapState.currentTapCount,
    };

    // Dispatch a single 'tap' event (not 'tapStart', 'tapEnd', etc.)
    const domEvent = new CustomEvent(this.name, {
      bubbles: true,
      cancelable: true,
      detail: customEventData,
    });

    element.dispatchEvent(domEvent);

    // Apply preventDefault/stopPropagation if configured
    if (this.preventDefault) {
      event.preventDefault();
    }

    if (this.stopPropagation) {
      event.stopPropagation();
    }
  }

  /**
   * Cancel the current tap gesture
   */
  private cancelTap(element: HTMLElement, pointers: PointerData[], event: PointerEvent): void {
    const tapState = this.state;

    if (tapState.startCentroid || tapState.lastPosition) {
      const position = tapState.lastPosition || tapState.startCentroid;

      // Create custom event data for the cancel event
      const customEventData: TapGestureEventData = {
        centroid: position!,
        target: event.target,
        srcEvent: event,
        phase: 'cancel',
        pointers,
        timeStamp: event.timeStamp,
        x: position!.x,
        y: position!.y,
        tapCount: tapState.currentTapCount,
      };

      // Dispatch a 'tapCancel' event
      const eventName = createEventName(this.name, 'cancel');
      const domEvent = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail: customEventData,
      });

      element.dispatchEvent(domEvent);
    }

    this.resetTapState(element);
  }

  /**
   * Reset the gesture state for a specific element
   */
  private resetTapState(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const tapState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    tapState.startCentroid = null;
    tapState.lastPosition = null;
    tapState.currentTapCount = 0;
    tapState.lastTapTime = 0;
  }
}
