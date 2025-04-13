/**
 * RotateGesture - Detects rotation movements between two or more pointers
 *
 * This gesture tracks when multiple pointers rotate around a common center point, firing events when:
 * - Two or more pointers begin a rotation motion (start)
 * - The pointers continue rotating (ongoing)
 * - One or more pointers are released or lifted (end)
 *
 * This gesture is commonly used for rotation controls in drawing or image manipulation interfaces.
 */

import { GestureEventData, GesturePhase } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName, getAngle } from '../utils';

/**
 * Configuration options for the RotateGesture
 * Uses the same options as the base PointerGesture
 */
export type RotateGestureOptions = PointerGestureOptions;

/**
 * Event data specific to rotate gesture events
 * Contains information about rotation angle, delta, and velocity
 */
export type RotateGestureEventData = GestureEventData & {
  /** Current absolute rotation in degrees (0-359) */
  rotation: number;
  /** Change in rotation since the last event in degrees */
  delta: number;
  /** Total accumulated rotation in degrees across all gesture interactions */
  totalRotation: number;
  /** Angular velocity in degrees per second */
  velocity: number;
  /** The original DOM pointer event that triggered this gesture event */
  srcEvent: PointerEvent;
};

/**
 * Type definition for the CustomEvent created by RotateGesture
 */
export type RotateEvent = CustomEvent<RotateGestureEventData>;

/**
 * State tracking for a specific emitter element
 */
export type RotateGestureState = {
  /** Whether the rotation gesture is currently active for this element */
  active: boolean;
  /** The initial angle between pointers when the gesture began */
  startAngle: number;
  /** The most recent angle between pointers during the gesture */
  lastAngle: number;
  /** Accumulated rotation in degrees (can exceed 360° for multiple rotations) */
  lastRotation: number;
  /** Timestamp of the last rotate event, used for velocity calculation */
  lastTime: number;
  /** Current angular velocity in degrees per second */
  velocity: number;
  /** The most recent change in angle since the last event */
  lastDelta: number;
};

/**
 * RotateGesture class for handling rotation interactions
 *
 * This gesture detects when users rotate multiple pointers around a central point,
 * and dispatches rotation-related events with angle and angular velocity information.
 */
export class RotateGesture extends PointerGesture {
  /**
   * Map of elements to their specific rotate gesture state
   * Tracks angles, rotation, and velocity for each element
   */
  private state: RotateGestureState = {
    active: false,
    startAngle: 0,
    lastAngle: 0,
    lastRotation: 0,
    lastTime: 0,
    velocity: 0,
    lastDelta: 0,
  };

  /**
   * Creates a new RotateGesture instance
   * @param options Configuration options for the gesture
   */
  constructor(options: RotateGestureOptions) {
    super(options);
  }

  /**
   * Clone this gesture with the same options
   */
  public clone(): RotateGesture {
    return new RotateGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
    });
  }

  /**
   * Override createEmitter to add rotate-specific state
   */
  public createEmitter(element: HTMLElement) {
    const emitter = super.createEmitter(element);

    this.state = {
      active: false,
      startAngle: 0,
      lastAngle: 0,
      lastRotation: 0,
      lastTime: 0,
      velocity: 0,
      lastDelta: 0,
    };

    return emitter;
  }

  /**
   * Override removeEmitter to clean up rotate-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.state = {
      active: false,
      startAngle: 0,
      lastAngle: 0,
      lastRotation: 0,
      lastTime: 0,
      velocity: 0,
      lastDelta: 0,
    };
    super.removeEmitter(element);
  }

  /**
   * Handle pointer events for the rotate gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Get element-specific states
    const emitterState = this.getEmitterState(targetElement);
    const rotateState = this.state;

    if (!emitterState) return;

    // Filter pointers to only include those targeting our element or its children
    const relevantPointers = pointersArray.filter(
      pointer => targetElement === pointer.target || targetElement.contains(pointer.target as Node)
    );

    // Check if we have enough pointers for a rotation (at least 2)
    if (relevantPointers.length < this.minPointers || relevantPointers.length > this.maxPointers) {
      if (emitterState.active || rotateState.active) {
        // End the gesture if it was active
        this.emitRotateEvent(targetElement, 'end', relevantPointers, event);
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

          // Calculate and store the starting angle
          const initialAngle = this.calculateRotationAngle(relevantPointers);
          rotateState.startAngle = initialAngle;
          rotateState.lastAngle = initialAngle;
          rotateState.lastTime = event.timeStamp;

          // Mark gesture as active
          emitterState.active = true;
          rotateState.active = true;

          // Emit start event
          this.emitRotateEvent(targetElement, 'start', relevantPointers, event);
        }
        break;

      case 'pointermove':
        if (emitterState.active && rotateState.active && relevantPointers.length >= 2) {
          // Calculate current rotation angle
          const currentAngle = this.calculateRotationAngle(relevantPointers);

          // Calculate rotation delta (change in angle)
          let delta = currentAngle - rotateState.lastAngle;

          // Adjust for angle wrapping (e.g., from 359° to 0°)
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          // Store the delta for use in emitRotateEvent
          rotateState.lastDelta = delta;

          // Update rotation value (cumulative)
          rotateState.lastRotation += delta;

          // Calculate angular velocity (degrees per second)
          const deltaTime = (event.timeStamp - rotateState.lastTime) / 1000; // convert to seconds
          if (deltaTime > 0) {
            rotateState.velocity = delta / deltaTime;
          }

          // Update state
          rotateState.lastAngle = currentAngle;
          rotateState.lastTime = event.timeStamp;

          // Emit ongoing event if there's an actual rotation
          // We don't want to emit events for tiny movements that might be just noise
          if (Math.abs(delta) > 0.1) {
            this.emitRotateEvent(targetElement, 'ongoing', relevantPointers, event);
          }
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
            this.emitRotateEvent(
              targetElement,
              event.type === 'pointercancel' ? 'cancel' : 'end',
              relevantPointers,
              event
            );

            // Reset state
            this.reset(targetElement);
          } else if (remainingPointers.length >= 2) {
            // If we still have enough pointers, update the start angle
            // to prevent jumping when a finger is lifted
            const newAngle = this.calculateRotationAngle(remainingPointers);
            rotateState.startAngle = newAngle - rotateState.lastRotation;
            rotateState.lastAngle = newAngle;
          }
        }
        break;
    }
  }

  /**
   * Calculate the rotation angle between pointers
   * This uses the angle between the first two pointers relative to the centroid
   */
  private calculateRotationAngle(pointers: PointerData[]): number {
    if (pointers.length < 2) return 0;

    // For rotation, we need exactly 2 pointers
    // Use first two since they're most likely the primary pointers
    const p1 = { x: pointers[0].clientX, y: pointers[0].clientY };
    const p2 = { x: pointers[1].clientX, y: pointers[1].clientY };

    return getAngle(p1, p2);
  }

  /**
   * Emit rotate-specific events with additional data
   */
  private emitRotateEvent(
    element: HTMLElement,
    phase: GesturePhase,
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    const rotateState = this.state;

    // Calculate current centroid
    const centroid = calculateCentroid(pointers);

    // Create custom event data
    const rotation = rotateState.lastRotation;

    // Use the stored lastDelta for move events
    let delta = 0;
    if (phase === 'start') {
      delta = 0;
    } else if (phase === 'end') {
      delta = rotation; // Total rotation for end event
    } else {
      // For move events, use the last calculated delta
      delta = rotateState.lastDelta;
    }

    const customEventData: RotateGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event,
      phase: phase,
      pointers,
      timeStamp: event.timeStamp,
      rotation,
      delta,
      totalRotation: rotateState.lastRotation,
      velocity: rotateState.velocity,
    };

    // Handle default event behavior
    if (this.preventDefault) {
      event.preventDefault();
    }

    if (this.stopPropagation) {
      event.stopPropagation();
    }

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
   */
  private reset(element: HTMLElement): void {
    const emitterState = this.getEmitterState(element);
    const rotateState = this.state;

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    rotateState.active = false;
    rotateState.startAngle = 0;
    rotateState.lastAngle = 0;
    rotateState.velocity = 0;
    rotateState.lastDelta = 0;
    // lastRotation is always set to the accumulated rotation
    // so we don't reset it here
  }
}
