import {
  GestureManager,
  MoveGesture,
  PanGesture,
  PinchGesture,
  PressGesture,
  RotateGesture,
  TapGesture,
  TurnWheelGesture,
} from '../packages/core/src';

// Initialize gesture manager with templates
const gestureManager = new GestureManager({
  root: document.body,
  touchAction: 'pan-y',
  gestures: [
    new PanGesture({
      name: 'pan',
      threshold: 10,
      maxPointers: 1,
      minPointers: 1,
      direction: ['up', 'down', 'left', 'right'],
    }),
    new MoveGesture({
      name: 'move',
      minPointers: 1,
      maxPointers: 1,
      preventIf: ['pan'], // Prevent move gesture when pan is active
    }),
    new PinchGesture({
      name: 'pinch',
      threshold: 0,
      minPointers: 2,
      maxPointers: 10,
    }),
    new RotateGesture({
      name: 'rotate',
      threshold: 0,
      minPointers: 2,
      maxPointers: 10,
    }),
    new TurnWheelGesture({
      name: 'roll',
      preventDefault: true, // Prevent default scroll behavior
      sensitivity: 0.01,
      min: 0.5,
      max: 3,
      initialDelta: 1,
    }),
    new TapGesture({
      name: 'tap',
      taps: 1,
      preventIf: ['press'],
    }),
    new TapGesture({
      name: 'doubleTap',
      taps: 2,
    }),
    new PressGesture({
      name: 'press',
      duration: 500, // ms to wait before recognizing press
      maxDistance: 10, // max distance pointer can move
    }),
  ],
});

// DOM Elements
const gestureTarget = document.getElementById('gesture-target') as HTMLDivElement;
const gestureTarget2 = document.getElementById('gesture-target2') as HTMLDivElement;
const gestureTarget3 = document.getElementById('gesture-target3') as HTMLDivElement;
const logContainer = document.getElementById('log-container') as HTMLDivElement;
const clearLogButton = document.getElementById('clear-log') as HTMLButtonElement;
const resetPositionButton = document.getElementById('reset-position') as HTMLButtonElement;
const rollMaxButton = document.getElementById('change-roll-max') as HTMLButtonElement;
const changeRotationButton = document.getElementById('change-rotation') as HTMLButtonElement;

// Register multiple gestures at once for the element
// This will return the element with properly typed event listeners
const target = gestureManager.registerElement(
  ['pan', 'move', 'pinch', 'rotate', 'roll', 'tap', 'doubleTap', 'press'],
  gestureTarget
);

const target2 = gestureManager.registerElement(['pan', 'pinch', 'rotate', 'roll'], gestureTarget2, {
  roll: { max: 10, min: 0.1 },
  pinch: { threshold: 0 },
});

const target3 = gestureManager.registerElement(['pan', 'pinch'], gestureTarget3);

target3.addEventListener('pan', event => {
  const detail = event.detail;
  // Get the x and y from the transform property
  const transform = window.getComputedStyle(target3).transform;
  const matrix = new DOMMatrix(transform);
  const currentX = matrix.m41;
  const currentY = matrix.m42;
  const targetX = currentX + detail.deltaX;
  const targetY = currentY + detail.deltaY;
  const currentScale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);

  target3.style.transform = `translate(${targetX}px, ${targetY}px) scale(${currentScale})`;
});

target3.addEventListener('pinch', event => {
  const detail = event.detail;

  updatePosition(target3, { scale: detail.totalScale });
});

// Set up event listeners
target.addEventListener('panStart', event => {
  const detail = event.detail;
  // Reset delta tracking at the start of each new pan
  addLogEntry(
    `Pan started at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );
});

target.addEventListener('pan', event => {
  const detail = event.detail;

  addLogEntry(
    `Pan moved to: x=${Math.round(detail.totalDeltaX)}, y=${Math.round(detail.totalDeltaY)}`
  );
  updatePosition(target, { targetX: detail.totalDeltaX, targetY: detail.totalDeltaY });
});

target2.addEventListener('pan', event => {
  const detail = event.detail;
  updatePosition(target2, { targetX: detail.totalDeltaX, targetY: detail.totalDeltaY });
});

target.addEventListener('panEnd', event => {
  const detail = event.detail;
  addLogEntry(
    `Pan ended at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );
});

// Add handler for panCancel to reset delta tracking when gestures are interrupted (e.g. by contextmenu)
target.addEventListener('panCancel', event => {
  const detail = event.detail;
  addLogEntry(
    `Pan cancelled at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );
});

target.addEventListener('pinchStart', event => {
  const detail = event.detail;

  // Change background color to indicate active pinch
  target.style.backgroundColor = '#ff5722';

  addLogEntry(
    `Pinch started at: distance=${Math.round(detail.distance)} scale=${detail.totalScale.toFixed(2)}`
  );
});

target.addEventListener('pinch', event => {
  const detail = event.detail;

  addLogEntry(
    `Pinch at: scale=${detail.totalScale.toFixed(2)}, direction=${detail.direction === 1 ? 'spreading' : detail.direction === -1 ? 'pinching' : 'no change'}`
  );

  updatePosition(target, { scale: detail.totalScale });
});

target2.addEventListener('pinch', event => {
  const detail = event.detail;
  updatePosition(target2, { scale: detail.totalScale });
});

target.addEventListener('pinchEnd', event => {
  const detail = event.detail;

  // Reset background color
  target.style.backgroundColor = '#4287f5';

  addLogEntry(`Pinch ended at: final scale=${detail.totalScale.toFixed(2)}`);
});

// Add move gesture event listeners
let moveCount = 0;

target.addEventListener('moveStart', event => {
  const detail = event.detail;
  moveCount = 0;

  // Add a highlight effect when the pointer enters
  target.style.backgroundColor = '#ffaa00';

  addLogEntry(
    `Move started at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );
});

target.addEventListener('move', event => {
  const detail = event.detail;
  moveCount++;

  // Only log every 10th move to avoid flooding the log
  addLogEntry(`Move at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`);
});

target.addEventListener('moveEnd', event => {
  const detail = event.detail;

  // Reset the highlight effect when the pointer leaves
  target.style.backgroundColor = '#4287f5';

  addLogEntry(
    `Move ended at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}, tracked ${moveCount} movements`
  );
});

// Add wheel gesture event listeners
target.addEventListener('roll', event => {
  const detail = event.detail;
  const scale = detail.totalDeltaY;
  // Zoom the element based on wheel delta
  addLogEntry(`Wheel zoom at: scale=${scale.toFixed(2)}`);
  updatePosition(target, { scale });
});
target2.addEventListener('roll', event => {
  const detail = event.detail;
  const scale = detail.totalDeltaY;
  updatePosition(target2, { scale });
});

// Add rotate gesture event listeners
target.addEventListener('rotateStart', event => {
  const detail = event.detail;
  addLogEntry(`Rotation started at: ${Math.round(detail.totalRotation)}°`);
});

target.addEventListener('rotate', event => {
  const detail = event.detail;

  addLogEntry(
    `Rotating: ${Math.round(detail.totalRotation)}° (delta: ${Math.round(detail.delta)}°)`
  );

  updatePosition(target, { rotation: detail.totalRotation });
});

target2.addEventListener('rotate', event => {
  const detail = event.detail;
  updatePosition(target2, { rotation: detail.totalRotation });
});

target.addEventListener('rotateEnd', event => {
  const detail = event.detail;
  addLogEntry(`Rotation ended at: ${Math.round(detail.totalRotation)}°`);
});

target.addEventListener('tap', event => {
  const detail = event.detail;
  addLogEntry(
    `Tap detected at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );

  // Change background color on tap
  target.style.backgroundColor = '#00ff00';
  setTimeout(() => {
    target.style.backgroundColor = '#4287f5';
  }, 200);
});

target.addEventListener('doubleTap', event => {
  const detail = event.detail;
  addLogEntry(
    `DoubleTap detected at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`
  );
});

// Add press gesture event listeners
target.addEventListener('pressStart', event => {
  const detail = event.detail;

  // Change background color to indicate active press
  target.style.backgroundColor = '#9c27b0';

  addLogEntry(
    `Press started at: x=${Math.round(detail.x)}, y=${Math.round(detail.y)}, duration=${detail.duration}ms`
  );
});

target.addEventListener('press', event => {
  const detail = event.detail;

  // Only log every 100ms to avoid flooding the log
  if (detail.duration % 100 < 20) {
    addLogEntry(
      `Press ongoing at: x=${Math.round(detail.x)}, y=${Math.round(detail.y)}, duration=${detail.duration}ms`
    );
  }
});

target.addEventListener('pressEnd', event => {
  const detail = event.detail;

  // Reset background color
  target.style.backgroundColor = '#4287f5';

  addLogEntry(
    `Press ended at: x=${Math.round(detail.x)}, y=${Math.round(detail.y)}, duration=${detail.duration}ms`
  );
});

target.addEventListener('pressCancel', event => {
  const detail = event.detail;

  // Reset background color
  target.style.backgroundColor = '#4287f5';

  addLogEntry(
    `Press cancelled at: x=${Math.round(detail.x)}, y=${Math.round(detail.y)}, duration=${detail.duration}ms`
  );
});

// Update element position
function updatePosition(
  element: HTMLElement,
  input: {
    targetX?: number;
    targetY?: number;
    scale?: number;
    rotation?: number;
  }
): void {
  // Get the x and y from the transform property
  const transform = window.getComputedStyle(element).transform;
  const matrix = new DOMMatrix(transform);
  const currentX = matrix.m41;
  const currentY = matrix.m42;
  const currentScale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
  const currentRotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
  const targetX = input.targetX ?? currentX;
  const targetY = input.targetY ?? currentY;
  const scale = input.scale ?? currentScale;
  const rotation = input.rotation ?? currentRotation;

  element.style.transform = `translate(${targetX}px, ${targetY}px) scale(${scale}) rotate(${rotation}deg)`;
}

// Log helper function
function addLogEntry(message: string): void {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Button handlers
clearLogButton.addEventListener('click', () => {
  logContainer.innerHTML = '';
  addLogEntry('Log cleared');
});

resetPositionButton.addEventListener('click', () => {
  updatePosition(target, { targetX: 0, targetY: 0, scale: 1, rotation: 0 });
  gestureManager.setGestureState('pan', target, {
    totalDeltaX: 0,
    totalDeltaY: 0,
  });
  addLogEntry('Position reset');
});

rollMaxButton.addEventListener('click', () => {
  gestureManager.setGestureOptions('roll', target, {
    max: 5,
  });
});

changeRotationButton.addEventListener('click', () => {
  gestureManager.setGestureState('rotate', target, {
    totalRotation: 0,
  });
});

// Initial log message
addLogEntry('Gesture demo initialized');

const red = document.getElementById('red') as HTMLDivElement;
const green = document.getElementById('green') as HTMLDivElement;
const blue = document.getElementById('blue') as HTMLDivElement;

[red, green, blue].forEach(el => {
  [
    'pointerdown',
    'pointerup',
    'pointercancel',
    'pointerout',
    'pointerover',
    'pointerenter',
    'pointerleave',
  ].forEach(eventType => {
    // @ts-expect-error, dynamic
    el.addEventListener(eventType, (event: PointerEvent) => {
      const logMessage = `${eventType} on ${el.id}`;
      console.log(logMessage, event);
      addLogEntry(logMessage);
    });
  });
});
