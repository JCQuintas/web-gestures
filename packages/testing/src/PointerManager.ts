import { Pointer, PointerAmount, Pointers, PointerType } from './Pointers';

export type PointerState = {
  id: number;
  x: number;
  y: number;
  isDown?: boolean;
  target: Element;
};

export type PointerTargetChange = {
  pointer: PointerState;
  oldTarget: Element;
};

export class PointerManager {
  protected pointers: Map<number, PointerState> = new Map([
    [
      1,
      {
        id: 1,
        x: 0,
        y: 0,
        isDown: false,
        target: document.body,
      },
    ],
  ]);
  protected count = 0;
  public readonly mode: PointerType;

  constructor(mode: PointerType) {
    this.mode = mode;
  }

  protected addPointers(pointer: PointerState | PointerState[]): void {
    if (this.mode === 'mouse') {
      // Mouse mode only allows one pointer
      return;
    }
    if (Array.isArray(pointer)) {
      return pointer.forEach(p => this.addPointers(p));
    }
    if (this.pointers.has(pointer.id)) {
      return;
    }
    this.pointers.set(pointer.id, pointer);
  }

  protected removePointers(id: number | number[]): void {
    if (this.mode === 'mouse') {
      // Mouse pointer cannot be removed
      return;
    }
    if (Array.isArray(id)) {
      return id.forEach(pointerId => this.pointers.delete(pointerId));
    }
    this.pointers.delete(id);
  }

  protected getPointers(id: number): PointerState | undefined;
  protected getPointers(id: number[]): (PointerState | undefined)[];
  protected getPointers(
    id: number | number[]
  ): PointerState | (PointerState | undefined)[] | undefined {
    if (Array.isArray(id)) {
      return id.map(pointerId => this.pointers.get(pointerId));
    }
    return this.pointers.get(id);
  }

  protected updatePointers(pointer: PointerState): PointerTargetChange | undefined;
  protected updatePointers(pointer: PointerState[]): (PointerTargetChange | undefined)[];
  protected updatePointers(
    pointer: PointerState | PointerState[]
  ): PointerTargetChange | (PointerTargetChange | undefined)[] | undefined {
    if (Array.isArray(pointer)) {
      return pointer.map(p => this.updatePointers(p));
    }

    const existingPointer = this.pointers.get(pointer.id);
    if (!existingPointer) {
      throw new Error(`Pointer with id ${pointer.id} does not exist`);
    }
    const newPointer = { ...existingPointer, ...pointer };
    this.pointers.set(pointer.id, newPointer);

    if (newPointer.target === existingPointer.target) {
      return;
    }

    const oldTarget = existingPointer.target;
    return { oldTarget, pointer: newPointer };
  }

  nextId(): number {
    this.count += 1;
    return 500 + this.count;
  }

  parseMousePointer(pointer: Pointer | undefined, target: Element): Required<Pointer> {
    if (this.mode !== 'mouse') {
      throw new Error('Mouse pointer can only be used in mouse mode');
    }

    const finalTarget = pointer?.target ?? target;
    const targetRect = finalTarget.getBoundingClientRect();
    const x = pointer?.x ?? targetRect.left + targetRect.width / 2;
    const y = pointer?.y ?? targetRect.top + targetRect.height / 2;

    const finalPointer = {
      id: 1,
      x,
      y,
      target: finalTarget,
    };

    this.updatePointers(finalPointer);

    return finalPointer;
  }

  parsePointers(
    pointers: Pointers | undefined,
    target: Element,
    defaultConfig: Required<Omit<PointerAmount, 'ids'>>
  ): Required<Pointer>[] {
    const normalizedPointers = Array.isArray(pointers)
      ? pointers
      : { ...defaultConfig, ...pointers };

    if (this.mode === 'mouse') {
      // If the mode is mouse, we only need one pointer
      if (
        (Array.isArray(normalizedPointers) && normalizedPointers.length > 1) ||
        (!Array.isArray(normalizedPointers) && normalizedPointers.amount !== 1)
      ) {
        throw new Error('Mouse mode only supports one pointer');
      }
    }

    // Normalize pointers to be an array
    let pointersArray: Required<Pointer>[] = [];

    if (!Array.isArray(normalizedPointers)) {
      const { amount, distance: pointerDistance, ids } = normalizedPointers;

      // Get the target element's bounding rect
      const targetRect = target.getBoundingClientRect();
      const centerX = targetRect.left + targetRect.width / 2;
      const centerY = targetRect.top + targetRect.height / 2;

      // Create pointers in a circle around the center of the target
      pointersArray = Array.from({ length: amount }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / amount;
        const x = centerX + (Math.cos(angle) * pointerDistance) / 2;
        const y = centerY + (Math.sin(angle) * pointerDistance) / 2;

        return {
          id: ids?.[index] ?? this.nextId(),
          x,
          y,
          target,
        };
      });
    } else {
      const allTargets = new Set<Element>(
        normalizedPointers.map(pointer => pointer.target ?? target)
      );
      const targetRectMap = new Map<Element, { centerX: number; centerY: number }>(
        Array.from(allTargets).map(target => {
          const rect = target.getBoundingClientRect();

          return [
            target,
            { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 },
          ];
        })
      );

      pointersArray = normalizedPointers.map(pointer => ({
        id: pointer.id ?? this.nextId(),
        target: pointer.target ?? target,
        x: pointer.x ?? targetRectMap.get(pointer.target ?? target)!.centerX,
        y: pointer.y ?? targetRectMap.get(pointer.target ?? target)!.centerY,
      }));
    }

    this.addPointers(pointersArray);

    return pointersArray;
  }

  pointerDown(pointer: Required<Pointer>): void {
    if (this.pointers.get(pointer.id)?.isDown === true) {
      return;
    }

    const event = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: pointer.x,
      clientY: pointer.y,
      pointerId: pointer.id,
      pointerType: this.mode,
    });

    this.updatePointers({
      ...pointer,
      isDown: true,
    });

    pointer.target.dispatchEvent(event);
  }

  pointerMove(pointer: Required<Pointer>): void {
    const event = new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      clientX: pointer.x,
      clientY: pointer.y,
      pointerId: pointer.id,
      pointerType: this.mode,
    });

    this.updatePointers(pointer);

    pointer.target.dispatchEvent(event);
  }

  pointerUp(pointer: Required<Pointer>): void {
    const event = new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      clientX: pointer.x,
      clientY: pointer.y,
      pointerId: pointer.id,
      pointerType: this.mode,
    });

    if (this.mode === 'mouse') {
      this.updatePointers({
        ...pointer,
        isDown: false,
      });
    } else {
      this.removePointers(pointer.id);
    }

    pointer.target.dispatchEvent(event);
  }
}
