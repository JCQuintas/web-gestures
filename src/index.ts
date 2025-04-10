/**
 * Gesture Events Library
 *
 * A centralized pointer event-based gesture recognition library
 */

// Export core classes
export { Gesture } from './Gesture';
export { GestureManager } from './GestureManager';
export { PointerManager } from './PointerManager';

// Export gesture implementations
export { MoveGesture } from './gestures/MoveGesture';
export { PanGesture } from './gestures/PanGesture';
export { PinchGesture } from './gestures/PinchGesture';
export { RotateGesture } from './gestures/RotateGesture';
export { TurnWheelGesture } from './gestures/TurnWheelGesture';

// Export types
export type {
  GestureEventCallback,
  GestureEventData,
  GestureOptions,
  GestureState,
} from './Gesture';

export type { PointerData, PointerManagerOptions } from './PointerManager';

export type { GestureManagerOptions } from './GestureManager';

export type { MoveEvent, MoveGestureEventData, MoveGestureOptions } from './gestures/MoveGesture';
export type { PanEvent, PanGestureEventData, PanGestureOptions } from './gestures/PanGesture';
export type {
  PinchEvent,
  PinchGestureEventData,
  PinchGestureOptions,
} from './gestures/PinchGesture';
export type {
  RotateEvent,
  RotateGestureEventData,
  RotateGestureOptions,
} from './gestures/RotateGesture';
export type {
  TurnWheelEvent,
  TurnWheelGestureEventData,
  TurnWheelGestureOptions,
} from './gestures/TurnWheelGesture';

// Export utility types
export type * from './utils';
