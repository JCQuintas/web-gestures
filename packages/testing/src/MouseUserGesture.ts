import { TapUserGestureRoot } from './gestures/TapUserGesture';
import { UserGestureOptions } from './UserGestureOptions';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MouseUserGestureRootExtension {}

/**
 * Defines the mouse gestures.
 * It includes a setup method to initialize global options.
 */
export type MouseUserGestureRoot = {
  setup: (options: UserGestureOptions) => MouseUserGestureRoot;
} & TapUserGestureRoot &
  MouseUserGestureRootExtension;
