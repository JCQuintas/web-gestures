export type PointerState = {
  id: number;
  type: string;
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

  constructor() {}

  addPointer(pointer: PointerState | PointerState[]): void {
    if (Array.isArray(pointer)) {
      return pointer.forEach(p => this.addPointer(p));
    }
    if (this.pointers.has(pointer.id)) {
      throw new Error(`Pointer with id ${pointer.id} already exists`);
    }
    this.pointers.set(pointer.id, pointer);
  }

  removePointer(id: number | number[]): void {
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
}
