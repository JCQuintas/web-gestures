import {
  GestureManager,
  MoveGesture,
  PanGesture,
  PinchGesture,
  RotateGesture,
  TapEvent,
  TapGesture,
  TurnWheelEvent,
  TurnWheelGesture,
} from '../../src';

// Initialize gesture manager with templates
const gestureManager = new GestureManager<{
  roll: TurnWheelEvent;
  tap: TapEvent;
  doubleTap: TapEvent;
}>({
  root: document.body,
  touchAction: 'none',
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
    }),
    new TapGesture({
      name: 'tap',
      taps: 1,
    }),
    new TapGesture({
      name: 'doubleTap',
      taps: 2,
    }),
  ],
});

// DOM Elements
const gestureTarget = document.getElementById('gesture-target') as HTMLDivElement;
const logContainer = document.getElementById('log-container') as HTMLDivElement;
const clearLogButton = document.getElementById('clear-log') as HTMLButtonElement;
const resetPositionButton = document.getElementById('reset-position') as HTMLButtonElement;

// Register multiple gestures at once for the element
// This will return the element with properly typed event listeners
const target = gestureManager.registerElement(
  ['pan', 'move', 'pinch', 'rotate', 'roll', 'tap', 'doubleTap'],
  gestureTarget
);

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

  // Move the element based on delta
  targetX = detail.totalDeltaX;
  targetY = detail.totalDeltaY;

  addLogEntry(`Pan moved to: x=${Math.round(targetX)}, y=${Math.round(targetY)}`);
  updatePosition();
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

// Add pinch gesture event listeners
let initialPinchScale = 1;

target.addEventListener('pinchStart', event => {
  const detail = event.detail;
  initialPinchScale = scale;

  // Change background color to indicate active pinch
  target.style.backgroundColor = '#ff5722';

  addLogEntry(
    `Pinch started at: x=${Math.round(detail.centroid.x)}, y=${Math.round(
      detail.centroid.y
    )}, distance=${Math.round(detail.distance)}`
  );
});

target.addEventListener('pinch', event => {
  const detail = event.detail;

  // Update scale based on pinch scale
  scale = initialPinchScale * detail.scale;
  scale = Math.min(Math.max(0.5, scale), 5);

  addLogEntry(
    `Pinch at: x=${Math.round(detail.centroid.x)}, y=${Math.round(
      detail.centroid.y
    )}, scale=${detail.scale.toFixed(2)}`
  );

  updatePosition();
});

target.addEventListener('pinchEnd', event => {
  const detail = event.detail;

  // Reset background color
  target.style.backgroundColor = '#4287f5';

  addLogEntry(
    `Pinch ended at: x=${Math.round(detail.centroid.x)}, y=${Math.round(
      detail.centroid.y
    )}, final scale=${scale.toFixed(2)}`
  );
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
  if (moveCount % 10 === 0) {
    addLogEntry(`Move at: x=${Math.round(detail.centroid.x)}, y=${Math.round(detail.centroid.y)}`);
  }
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

  // Zoom the element based on wheel delta
  scale += detail.deltaY * -0.01;
  scale = Math.min(Math.max(0.5, scale), 3);

  addLogEntry(`Wheel zoom at: scale=${scale.toFixed(2)}`);
  updatePosition();
});

// Add rotate gesture event listeners
let rotation = 0;

target.addEventListener('rotateStart', _ => {
  addLogEntry(`Rotation started at: ${Math.round(rotation)}°`);
});

target.addEventListener('rotate', event => {
  const detail = event.detail;

  // Update rotation based on the rotation data
  rotation = rotation + detail.delta;

  addLogEntry(`Rotating: ${Math.round(rotation)}° (delta: ${Math.round(detail.delta)}°)`);

  updatePosition();
});

target.addEventListener('rotateEnd', _ => {
  addLogEntry(`Rotation ended at: ${Math.round(rotation)}°`);
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

// State variables for element positioning
let targetX = 0;
let targetY = 0;
let scale = 1;

// Update element position
function updatePosition() {
  target.style.transform = `translate(${targetX}px, ${targetY}px) scale(${scale}) rotate(${rotation}deg)`;
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
  targetX = 0;
  targetY = 0;
  scale = 1;
  rotation = 0;
  updatePosition();
  addLogEntry('Position reset');
});

// Initial log message
addLogEntry('Gesture demo initialized');
