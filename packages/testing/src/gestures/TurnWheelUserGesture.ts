import { MousePointer } from '../Pointers';

export type TurnWheelUserGestureOptions = {
  /**
   * The target element to turn wheel on.
   */
  target: Element;
  /**
   * The pointer configuration to be used.
   */
  pointer?: MousePointer;
  /**
   * The delay between turns in milliseconds.
   *
   * @default 50
   */
  delay?: number;
};

export type TurnWheelUserGestureRoot = {
  /**
   * Turns the mouse wheel on the target element.
   *
   * @returns A promise that resolves when the turnWheel gesture is completed.
   */
  turnWheel: (options: TurnWheelUserGestureOptions) => Promise<void>;
};
