/**
 * RotateGesture - Detects rotation movements between two or more pointers
 */

import { GestureEventData, GestureState } from '../Gesture';
import { PointerGesture, PointerGestureOptions } from '../PointerGesture';
import { PointerData } from '../PointerManager';
import { calculateCentroid, createEventName, getAngle } from '../utils';

export type RotateGestureOptions = PointerGestureOptions;

export type RotateGestureEventData = GestureEventData & {
  rotation: number; // Current rotation in degrees (0-359)
  delta: number; // Change in rotation since last event
  velocity: number; // Angular velocity in degrees per second
  srcEvent: PointerEvent;
};

export type RotateEvent = CustomEvent<RotateGestureEventData>;

export class RotateGesture extends PointerGesture {
  // Map of elements to their specific rotate gesture state
  private rotateEmitters = new Map<
    HTMLElement,
    {
      active: boolean;
      startAngle: number;
      lastAngle: number;
      lastRotation: number;
      lastTime: number;
      velocity: number;
    }
  >();

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

    this.rotateEmitters.set(element, {
      active: false,
      startAngle: 0,
      lastAngle: 0,
      lastRotation: 0,
      lastTime: 0,
      velocity: 0,
    });

    return emitter;
  }

  /**
   * Override removeEmitter to clean up rotate-specific state
   */
  protected removeEmitter(element: HTMLElement): void {
    this.rotateEmitters.delete(element);
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
    const rotateState = this.rotateEmitters.get(targetElement);

    if (!emitterState || !rotateState) return;

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

          // Emit move event if there's an actual rotation
          // We don't want to emit events for tiny movements that might be just noise
          if (Math.abs(delta) > 0.1) {
            this.emitRotateEvent(targetElement, 'move', relevantPointers, event);
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
    state: GestureState,
    pointers: PointerData[],
    event: PointerEvent
  ): void {
    const rotateState = this.rotateEmitters.get(element);
    if (!rotateState) return;

    // Calculate current centroid
    const centroid = calculateCentroid(pointers);

    // Create custom event data
    const rotation = rotateState.lastRotation;

    // For the delta, we want to use the last incremental change in angle
    // This represents how much rotation happened since the last event
    const delta =
      state === 'start'
        ? 0
        : state === 'end'
          ? rotation
          : // For move events, use the actual last delta calculated in handlePointerEvent
            rotateState.velocity * ((event.timeStamp - rotateState.lastTime) / 1000);

    const customEventData: RotateGestureEventData = {
      centroid,
      target: event.target,
      srcEvent: event,
      state,
      pointers,
      timeStamp: event.timeStamp,
      rotation,
      delta,
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
    const rotateState = this.rotateEmitters.get(element);

    if (emitterState) {
      emitterState.active = false;
      emitterState.startPointers.clear();
    }

    if (rotateState) {
      rotateState.active = false;
      rotateState.startAngle = 0;
      rotateState.lastAngle = 0;
      rotateState.lastRotation = 0;
      rotateState.velocity = 0;
    }
  }
}
