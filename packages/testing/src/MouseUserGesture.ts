import { MoveUserGestureRoot } from './gestures/MoveUserGesture.types';
import { PressUserGestureRoot } from './gestures/PressUserGesture.types';
import { TapUserGestureRoot } from './gestures/TapUserGesture.types';
import { TurnWheelUserGestureRoot } from './gestures/TurnWheelUserGesture.types';
import { UserGestureOptions } from './UserGestureOptions';

/**
 * Used for providing a custom mouse gesture.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MouseUserGestureRootExtension {}

/**
 * Defines the mouse gestures.
 * It includes a setup method to initialize global options.
 */
export type MouseUserGestureRoot = {
  setup: (options: UserGestureOptions) => MouseUserGestureRoot;
} & TapUserGestureRoot<'mouse'> &
  PressUserGestureRoot<'mouse'> &
  MoveUserGestureRoot &
  TurnWheelUserGestureRoot &
  MouseUserGestureRootExtension;
