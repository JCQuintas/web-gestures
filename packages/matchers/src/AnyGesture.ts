import { Gesture } from '@web-gestures/core';

export type AnyGesture = new <T extends { name: string }>(
  options: T,
  ...args: any[]
) => Gesture<string>;
