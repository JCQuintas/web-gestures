import { Pointer, Pointers, PointerType } from './Pointers';

export type PointerState = {
  id: number;
  type: PointerType;
  x: number;
  y: number;
  isDown: boolean;
  target: Element;
};

export type PointerTargetChange = {
  pointer: PointerState;
  oldTarget: Element;
};

export class PointerManager {
  private pointers: Map<number, PointerState> = new Map([
    [
      1,
      {
        id: 1,
        type: 'mouse',
        x: 0,
        y: 0,
        isDown: false,
        target: document.body,
      },
    ],
  ]);
  private count = 0;
  private mode: PointerType;

  constructor(mode: PointerType) {
    this.mode = mode;
  }

  addPointer(pointer: PointerState | PointerState[]): void {
    if (this.mode === 'mouse') {
      // Mouse mode only allows one pointer
      return;
    }
    if (Array.isArray(pointer)) {
      return pointer.forEach(p => this.addPointer(p));
    }
    if (this.pointers.has(pointer.id)) {
      throw new Error(`Pointer with id ${pointer.id} already exists`);
    }
    this.pointers.set(pointer.id, pointer);
  }

  removePointer(id: number | number[]): void {
    if (this.mode === 'mouse') {
      // Mouse pointer cannot be removed
      return;
    }
    if (Array.isArray(id)) {
      return id.forEach(pointerId => this.pointers.delete(pointerId));
    }
    this.pointers.delete(id);
  }

  getPointer(id: number): PointerState | undefined;
  getPointer(id: number[]): (PointerState | undefined)[];
  getPointer(id: number | number[]): PointerState | (PointerState | undefined)[] | undefined {
    if (Array.isArray(id)) {
      return id.map(pointerId => this.pointers.get(pointerId));
    }
    return this.pointers.get(id);
  }

  updatePointer(pointer: Omit<PointerState, 'type'>): PointerTargetChange | undefined;
  updatePointer(pointer: Omit<PointerState, 'type'>[]): (PointerTargetChange | undefined)[];
  updatePointer(
    pointer: Omit<PointerState, 'type'> | Omit<PointerState, 'type'>[]
  ): PointerTargetChange | (PointerTargetChange | undefined)[] | undefined {
    if (Array.isArray(pointer)) {
      return pointer.map(p => this.updatePointer(p));
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

  parsePointers(pointers: Pointers, target: Element): Required<Pointer>[] {
    if (this.mode === 'mouse') {
      // If the mode is mouse, we only need one pointer
      if (
        (Array.isArray(pointers) && pointers.length > 1) ||
        (!Array.isArray(pointers) && pointers.amount !== 1)
      ) {
        throw new Error('Mouse mode only supports one pointer');
      }
    }

    // Get the target element's bounding rect
    const targetRect = target.getBoundingClientRect();
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;

    // Normalize pointers to be an array
    let pointersArray = Array.isArray(pointers) ? pointers : [];

    if (!Array.isArray(pointers)) {
      const { amount, distance: pointerDistance, ids } = pointers;

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
    }

    // Ensure all pointers have all required properties
    return pointersArray.map(pointer => ({
      id: pointer.id ?? this.nextId(),
      target: pointer.target ?? target,
      x: pointer.x ?? centerX,
      y: pointer.y ?? centerY,
    }));
  }
}
