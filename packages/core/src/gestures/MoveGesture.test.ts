import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GestureManager } from '../GestureManager';
import { MoveEvent, MoveGesture } from './MoveGesture';

describe('MoveGesture', () => {
  let container: HTMLElement;
  let gestureManager: GestureManager<'move', MoveGesture<'move'>>;
  let target: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.style.width = '300px';
    container.style.height = '300px';
    document.body.appendChild(container);

    target = document.createElement('div');
    target.style.width = '100px';
    target.style.height = '100px';
    target.style.backgroundColor = 'blue';
    target.style.position = 'absolute';
    target.style.top = '50%';
    target.style.left = '50%';
    target.style.transform = 'translate(-50%, -50%)';
    container.appendChild(target);

    gestureManager = new GestureManager({
      gestures: [new MoveGesture({ name: 'move' })],
    });

    gestureManager.registerElement('move', target);
  });

  afterEach(() => {
    gestureManager.destroy();
    document.body.removeChild(container);
  });

  it('should fire move start, ongoing and end events on pointer enter, move, and leave', async () => {
    // Setup listeners
    const moveStartHandler = vi.fn();
    const moveOngoingHandler = vi.fn();
    const moveEndHandler = vi.fn();

    target.addEventListener('moveStart', moveStartHandler);
    target.addEventListener('move', moveOngoingHandler);
    target.addEventListener('moveEnd', moveEndHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate entering the element
    await user.pointer([
      { target: container, coords: { x: 50, y: 50 } }, // Start outside
      { target, coords: { x: 150, y: 150 } }, // Enter target
    ]);

    // Verify move start was fired
    expect(moveStartHandler).toHaveBeenCalledTimes(1);

    // Simulate moving within the element
    await user.pointer([
      { target, coords: { x: 160, y: 160 } }, // Move within target
    ]);

    // Verify ongoing move was fired
    expect(moveOngoingHandler).toHaveBeenCalledTimes(2);

    // Simulate leaving the element
    await user.pointer([
      { target: container, coords: { x: 50, y: 50 } }, // Move outside target
    ]);

    // Verify move end was fired
    expect(moveEndHandler).toHaveBeenCalledTimes(1);

    // Verify event data
    const startEvent = moveStartHandler.mock.calls[0][0] as MoveEvent;
    expect(startEvent.detail.phase).toBe('start');
    expect(startEvent.detail.centroid).toBeDefined();
    expect(startEvent.detail.pointers).toBeDefined();
  });

  it('should respect preventDefault and stopPropagation options', async () => {
    // Reconfigure with preventDefault and stopPropagation
    gestureManager.setGestureOptions('move', target, {
      preventDefault: true,
      stopPropagation: true,
    });

    // Setup spies for preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(PointerEvent.prototype, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(PointerEvent.prototype, 'stopPropagation');

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate a move sequence
    await user.pointer([
      { target: container, coords: { x: 50, y: 50 } },
      { target, coords: { x: 150, y: 150 } }, // Enter target
      { target, coords: { x: 170, y: 150 } }, // Move within target
      { target: container, coords: { x: 50, y: 50 } }, // Leave target
    ]);

    // Verify that preventDefault and stopPropagation were called
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should include active gestures in event detail', async () => {
    // Setup listener
    const moveStartHandler = vi.fn();
    target.addEventListener('moveStart', moveStartHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate entering the element
    await user.pointer([
      { target: container, coords: { x: 50, y: 50 } },
      { target, coords: { x: 150, y: 150 } }, // Enter target
    ]);

    // Verify event includes active gestures
    const event = moveStartHandler.mock.calls[0][0] as MoveEvent;
    expect(event.detail.activeGestures).toBeDefined();
    expect(event.detail.activeGestures.move).toBe(true);
  });

  it('should handle the preventIf option', async () => {
    // Create a test element that should prevent the gesture
    const preventElement = document.createElement('div');
    preventElement.id = 'prevent-element';
    preventElement.style.width = '50px';
    preventElement.style.height = '50px';
    preventElement.style.backgroundColor = 'red';
    preventElement.style.position = 'absolute';
    preventElement.style.top = '25%';
    preventElement.style.left = '25%';
    container.appendChild(preventElement);

    // Reconfigure with preventIf
    gestureManager.setGestureOptions('move', target, {
      preventIf: ['#prevent-element'],
    });

    // Setup listeners
    const moveStartHandler = vi.fn();
    target.addEventListener('moveStart', moveStartHandler);

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate entering the prevent element (which overlaps with target)
    await user.pointer([
      { target: container, coords: { x: 50, y: 50 } },
      { target: preventElement, coords: { x: 75, y: 75 } }, // Enter prevent element
    ]);

    // Verify no move events were fired due to prevention
    expect(moveStartHandler).not.toHaveBeenCalled();
  });

  it('should support cloning the gesture with new options', () => {
    // Create original gesture
    const originalGesture = new MoveGesture({
      name: 'move',
      preventDefault: false,
      threshold: 10,
    });

    // Clone with overrides
    const clonedGesture = originalGesture.clone({
      preventDefault: true,
      threshold: 20,
    });

    // Verify original properties are maintained
    expect(clonedGesture.name).toBe('move');

    // Verify overridden properties
    expect(clonedGesture['preventDefault']).toBe(true);
    expect(clonedGesture['threshold']).toBe(20);
  });

  it('should allow updating options after initialization', async () => {
    // Setup listener
    const moveStartHandler = vi.fn();
    target.addEventListener('moveStart', moveStartHandler);

    // Update options to require more pointers
    gestureManager.setGestureOptions('move', target, {
      minPointers: 2,
    });

    // Create user-event instance
    const user = userEvent.setup();

    // Simulate entering with one pointer (should not trigger with updated options)
    await user.pointer([
      { target, coords: { x: 150, y: 150 } }, // Enter with one pointer
    ]);

    // Verify no move events were fired
    expect(moveStartHandler).not.toHaveBeenCalled();
  });

  it('should add and remove event listeners correctly', () => {
    // Setup spies for addEventListener and removeEventListener
    const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

    // Create a new gesture and manager for this test
    const gesture = new MoveGesture({ name: 'move' });
    const manager = new GestureManager({
      gestures: [gesture],
    });

    // Register and then unregister to test both init and destroy
    manager.registerElement('move', target);

    // Verify event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerenter', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function));

    // Destroy the manager
    manager.destroy();

    // Verify event listeners were removed
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
