/**
 * Utility functions for gesture calculations
 */

import { GestureState } from './Gesture';
import { PointerData } from './PointerManager';

/**
 * Calculate the centroid (average position) of multiple pointers
 */
export function calculateCentroid(pointers: PointerData[]): { x: number; y: number } {
  if (pointers.length === 0) {
    return { x: 0, y: 0 };
  }

  const sum = pointers.reduce(
    (acc, pointer) => {
      acc.x += pointer.clientX;
      acc.y += pointer.clientY;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / pointers.length,
    y: sum.y / pointers.length,
  };
}

/**
 * Calculate the distance between two points
 */
export function getDistance(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number }
): number {
  const deltaX = pointB.x - pointA.x;
  const deltaY = pointB.y - pointA.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

/**
 * Calculate the angle between two points in degrees
 */
export function getAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  return (angle + 360) % 360;
}

/**
 * Get the direction of movement based on the current and previous positions
 */
export function getDirection(
  previous: { x: number; y: number },
  current: { x: number; y: number }
): 'up' | 'down' | 'left' | 'right' | null {
  const deltaX = current.x - previous.x;
  const deltaY = current.y - previous.y;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';
  } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return deltaY > 0 ? 'down' : 'up';
  }

  return null;
}

/**
 * Check if a direction matches one of the allowed directions
 */
export function isDirectionAllowed(
  direction: 'up' | 'down' | 'left' | 'right' | null,
  allowedDirections: Array<'up' | 'down' | 'left' | 'right'>
): boolean {
  if (direction === null) return false;
  if (allowedDirections.length === 0) return true;
  return allowedDirections.includes(direction);
}

/**
 * Calculate the velocity of movement between two points
 */
export function getVelocity(
  startPointer: PointerData,
  endPointer: PointerData
): { velocityX: number; velocityY: number; velocity: number } {
  const timeElapsed = (endPointer.timeStamp - startPointer.timeStamp) / 1000; // in seconds
  if (timeElapsed === 0) return { velocityX: 0, velocityY: 0, velocity: 0 };

  const velocityX = (endPointer.clientX - startPointer.clientX) / timeElapsed;
  const velocityY = (endPointer.clientY - startPointer.clientY) / timeElapsed;
  const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

  return { velocityX, velocityY, velocity };
}

/**
 * Creates the event name for a specific gesture and state
 */
export function createEventName(gesture: string, state: GestureState): string {
  return `${gesture}${state === 'ongoing' ? '' : state.charAt(0).toUpperCase() + state.slice(1)}`;
}
