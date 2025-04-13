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

import { GestureEventData, GesturePhase, GestureState } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, calculateRotationAngle, createEventName } from '../utils';

/**
 * Configuration options for the RotateGesture
 * Uses the same options as the base PointerGesture
 */
export type RotateGestureOptions<Name extends string> = PointerGestureOptions<Name>;

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
 * State tracking for the RotateGesture
 */
export type RotateGestureState = GestureState & {
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
export class RotateGesture<Name extends string> extends PointerGesture<Name> {
  protected state: RotateGestureState = {
    active: false,
    startPointers: new Map(),
    startAngle: 0,
    lastAngle: 0,
    lastRotation: 0,
    lastTime: 0,
    velocity: 0,
    lastDelta: 0,
  };

  constructor(options: RotateGestureOptions<Name>) {
    super(options);
  }

  public clone(overrides?: Record<string, unknown>): RotateGesture<Name> {
    return new RotateGesture({
      name: this.name,
      preventDefault: this.preventDefault,
      stopPropagation: this.stopPropagation,
      threshold: this.threshold,
      minPointers: this.minPointers,
      maxPointers: this.maxPointers,
      // Apply any overrides passed to the method
      ...overrides,
    });
  }

  public destroy(): void {
    this.resetState();
    super.destroy();
  }

  protected resetState() {
    this.state = {
      active: false,
      startPointers: new Map(),
      startAngle: 0,
      lastAngle: 0,
      lastRotation: 0,
      lastTime: 0,
      velocity: 0,
      lastDelta: 0,
    };
  }

  /**
   * Handle pointer events for the rotate gesture
   */
  protected handlePointerEvent(pointers: Map<number, PointerData>, event: PointerEvent): void {
    const pointersArray = Array.from(pointers.values());

    // Find which element (if any) is being targeted
    const targetElement = this.getTargetElement(event);
    if (!targetElement) return;

    // Filter pointers to only include those targeting our element or its children
    const relevantPointers = pointersArray.filter(
      pointer => targetElement === pointer.target || targetElement.contains(pointer.target as Node)
    );

    // Check if we have enough pointers for a rotation (at least 2)
    if (relevantPointers.length < this.minPointers || relevantPointers.length > this.maxPointers) {
      if (this.state.active || this.state.active) {
        // End the gesture if it was active
        this.emitRotateEvent(targetElement, 'end', relevantPointers, event);
        this.resetState();
      }
      return;
    }

    switch (event.type) {
      case 'pointerdown':
        if (relevantPointers.length >= 2 && !this.state.active) {
          // Store initial pointers
          relevantPointers.forEach(pointer => {
            this.state.startPointers.set(pointer.pointerId, pointer);
          });

          // Calculate and store the starting angle
          const initialAngle = calculateRotationAngle(relevantPointers);
          this.state.startAngle = initialAngle;
          this.state.lastAngle = initialAngle;
          this.state.lastTime = event.timeStamp;

          // Mark gesture as active
          this.state.active = true;
          this.state.active = true;

          // Emit start event
          this.emitRotateEvent(targetElement, 'start', relevantPointers, event);
        }
        break;

      case 'pointermove':
        if (this.state.active && this.state.active && relevantPointers.length >= 2) {
          // Calculate current rotation angle
          const currentAngle = calculateRotationAngle(relevantPointers);

          // Calculate rotation delta (change in angle)
          let delta = currentAngle - this.state.lastAngle;

          // Adjust for angle wrapping (e.g., from 359° to 0°)
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;

          // Store the delta for use in emitRotateEvent
          this.state.lastDelta = delta;

          // Update rotation value (cumulative)
          this.state.lastRotation += delta;

          // Calculate angular velocity (degrees per second)
          const deltaTime = (event.timeStamp - this.state.lastTime) / 1000; // convert to seconds
          if (deltaTime > 0) {
            this.state.velocity = delta / deltaTime;
          }

          // Update state
          this.state.lastAngle = currentAngle;
          this.state.lastTime = event.timeStamp;

          // Emit ongoing event if there's an actual rotation
          // We don't want to emit events for tiny movements that might be just noise
          if (Math.abs(delta) > 0.1) {
            this.emitRotateEvent(targetElement, 'ongoing', relevantPointers, event);
          }
        }
        break;

      case 'pointerup':
      case 'pointercancel':
        if (this.state.active) {
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
            this.resetState();
          } else if (remainingPointers.length >= 2) {
            // If we still have enough pointers, update the start angle
            // to prevent jumping when a finger is lifted
            const newAngle = calculateRotationAngle(remainingPointers);
            this.state.startAngle = newAngle - this.state.lastRotation;
            this.state.lastAngle = newAngle;
          }
        }
        break;
    }
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
    // Calculate current centroid
    const centroid = calculateCentroid(pointers);

    // Create custom event data
    const rotation = this.state.lastRotation;

    // Use the stored lastDelta for move events
    let delta = 0;
    if (phase === 'start') {
      delta = 0;
    } else if (phase === 'end') {
      delta = rotation; // Total rotation for end event
    } else {
      // For move events, use the last calculated delta
      delta = this.state.lastDelta;
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
      totalRotation: this.state.lastRotation,
      velocity: this.state.velocity,
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
}
