/**
 * PinchGesture - Detects pinch (zoom) movements with two or more pointers
 *
 * This gesture tracks when multiple pointers move toward or away from each other, firing events when:
 * - Two or more pointers begin moving (start)
 * - The pointers continue changing distance (ongoing)
 * - One or more pointers are released or lifted (end)
 *
 * This gesture is commonly used to implement zoom functionality in touch interfaces.
 */

import { GestureEventData, GestureState } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName, getDistance } from '../utils';

/**
 * Configuration options for the PinchGesture
 * Uses the same options as the base PointerGesture
 */
export type PinchGestureOptions = PointerGestureOptions;

/**
 * Event data specific to pinch gesture events
 * Contains information about scale, distance, and velocity
 */
export type PinchGestureEventData = GestureEventData & {
  /** Relative scale factor comparing current distance to initial distance (1.0 = no change) */
  scale: number;
  /** Total accumulated scale factor across all pinch operations */
  totalScale: number;
  /** Current distance between pointers in pixels */
  distance: number;
  /** Speed of the pinch movement in pixels per second */
  velocity: number;
  /** The original DOM pointer event that triggered this gesture event */
  srcEvent: PointerEvent;
};

/**
 * Type definition for the CustomEvent created by PinchGesture
 */
export type PinchEvent = CustomEvent<PinchGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type PinchGestureState = {
  /** Whether the pinch gesture is currently active for this element */
  active: boolean;
  /** The initial distance between pointers when the gesture began */
  startDistance: number;
  /** The most recent distance between pointers during the gesture */
  lastDistance: number;
  /** The most recent scale value (ratio of current to initial distance) */
  lastScale: number;
  /** Timestamp of the last pinch event, used for velocity calculation */
  lastTime: number;
  /** Current velocity of the pinch movement in pixels per second */
  velocity: number;
  /** Total accumulated scale factor across all pinch operations */
  totalScale: number;
};

/**
 * PinchGesture class for handling pinch/zoom interactions
 *
 * This gesture detects when users move multiple pointers toward or away from each other,
 * and dispatches scale-related events with distance and velocity information.
 */
export class PinchGesture extends PointerGesture {
  /**
   * Map of elements to their specific pinch gesture state
   * Tracks distances, scale, and velocity for each element
   */
  private state: PinchGestureState = {
    active: false,
    startDistance: 0,
    lastDistance: 0,
    lastScale: 1,
    lastTime: 0,
    velocity: 0,
    totalScale: 1,
  };

  /**
   * Creates a new PinchGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: PinchGestureOptions) {
    super(options);
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): PinchGesture {
    return new PinchGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
    });
  }

  /**
   * Override createEmitter to add pinch-specific state
   */
  public createEmitter(
    element: HTMLElement
  ): ReturnType<typeof PointerGesture.prototype.createEmitter> {
    const emitter = super.createEmitter(element);

    this.state = {
      active: false,
      startDistance: 0,
      lastDistance: 0,
      lastScale: 1,
      lastTime: 0,
      velocity: 0,
      totalScale: 1,
    };

    return emitter;
  }

  /**
   * Override removeEmitter to clean up pinch-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.state = {
      active: false,
      startDistance: 0,
      lastDistance: 0,
      lastScale: 1,
      lastTime: 0,
      velocity: 0,
      totalScale: 1,
    };
    super.removeEmitter(element);
  }

  /**
   * Handle pointer events for the pinch gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific states
    const emitterState = this.getEmitterState(targetElement);
    const pinchState = this.state;

    if (!emitterState) return;

    // Filter pointers to only include those targeting our element or its children
    const relevantPointers = pointersArray.filter(
      pointer => targetElement === pointer.target || targetElement.contains(pointer.target as Node)
    );

    // Check if we have enough pointers for a pinch (at least 2)
    if (relevantPointers.length < this.minPointers) {
      if (emitterState.active || pinchState.active) {
        // End the gesture if it was active
        this.emitPinchEvent(targetElement, 'end', relevantPointers, event);
        this.reset(targetElement);
      }
      return;
    }

    switch (event.type) {
      case 'pointerdown':
        if (relevantPointers.length >= 2 && !emitterState.active) {
          // Store initial pointers
          relevantPointers.forEach(pointer => {
            emitterState.startPointers.set(pointer.pointerId, pointer);
          });

          // Calculate and store the starting distance between pointers
          const initialDistance = this.calculateAverageDistance(relevantPointers);
          pinchState.startDistance = initialDistance;
          pinchState.lastDistance = initialDistance;
          pinchState.lastTime = event.timeStamp;

          // Mark gesture as active
          emitterState.active = true;
          pinchState.active = true;

          // Emit start event
          this.emitPinchEvent(targetElement, 'start', relevantPointers, event);
        }
        break;

      case 'pointermove':
        if (emitterState.active && pinchState.startDistance && relevantPointers.length >= 2) {
          // Calculate current distance between pointers
          const currentDistance = this.calculateAverageDistance(relevantPointers);

          // Calculate scale relative to starting distance
          const scale = pinchState.startDistance ? currentDistance / pinchState.startDistance : 1;

          // If this is the first move event after activation, don't modify totalScale
          if (pinchState.lastScale !== 1) {
            // Calculate the relative scale change since last event
            const scaleChange = scale / pinchState.lastScale;
            // Apply this change to the total accumulated scale
            pinchState.totalScale *= scaleChange;
          }

          // Calculate velocity (change in scale over time)
          const deltaTime = (event.timeStamp - pinchState.lastTime) / 1000; // convert to seconds
          if (deltaTime > 0 && pinchState.lastDistance) {
            const deltaDistance = currentDistance - pinchState.lastDistance;
            pinchState.velocity = deltaDistance / deltaTime;
          }

          // Update state
          pinchState.lastDistance = currentDistance;
          pinchState.lastScale = scale;
          pinchState.lastTime = event.timeStamp;

          // Emit ongoing event
          this.emitPinchEvent(targetElement, 'ongoing', relevantPointers, event);
        }
        break;

      case 'pointerup':
      case 'pointercancel':
        if (emitterState.active) {
          const remainingPointers = relevantPointers.filter(
            p => p.type !== 'pointerup' && p.type !== 'pointercancel'
          );

          // If we have less than the minimum required pointers, end the gesture
          if (remainingPointers.length < this.minPointers) {
            this.emitPinchEvent(
              targetElement,
              event.type === 'pointercancel' ? 'cancel' : 'end',
              relevantPointers,
              event
            );

            // Reset state
            this.reset(targetElement);
          } else if (remainingPointers.length >= 2) {
            // If we still have enough pointers, update the start distance
            // to prevent jumping when a finger is lifted
            const newDistance = this.calculateAverageDistance(remainingPointers);
            pinchState.startDistance = newDistance / pinchState.lastScale;
          }
        }
        break;
    }
  }

  /**
   * Calculate the average distance between all pairs of pointers
   */
  private calculateAverageDistance(pointers: PointerData[]): number {
    if (pointers.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    let pairCount = 0;

    // Calculate distance between each pair of pointers
    for (let i = 0; i < pointers.length; i++) {
      for (let j = i + 1; j < pointers.length; j++) {
        totalDistance += getDistance(
          { x: pointers[i].clientX, y: pointers[i].clientY },
          { x: pointers[j].clientX, y: pointers[j].clientY }
        );
        pairCount++;
      }
    }

    // Return average distance
    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Emit pinch-specific events with additional data
   */
  private emitPinchEvent(
    element: HTMLElement,
    state: GestureState,
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    const pinchState = this.state;

    // Calculate current centroid
    const centroid = calculateCentroid(pointers);

    // Create custom event data
    const distance = pinchState.lastDistance || 0;
    const scale = pinchState.lastScale || 1;

    const customEventData: PinchGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event,
      state,
      pointers,
      timeStamp: event.timeStamp,
      scale,
      totalScale: pinchState.totalScale,
      distance,
      velocity: pinchState.velocity,
    };

    // Handle default event behavior
    if (this.preventDefault) {
      event.preventDefault();
    }

    if (this.stopPropagation) {
      event.stopPropagation();
    }

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
    const pinchState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    pinchState.active = false;
    pinchState.startDistance = 0;
    pinchState.lastDistance = 0;
    pinchState.lastScale = 1;
    pinchState.velocity = 0;
    // Don't reset totalScale as it should persist between gestures
  }
}
