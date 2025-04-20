```ts
import { GestureManager, PanGesture } from '@web-gesture/core';

const gestureManager = new GestureManager({
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
  ],
});

const element = document.getElementById('my-element');
gestureManager.registerElement('pan', element);

element.addEventListener('panStart', event => {
  const detail = event.detail;
  console.log('Pan started at:', detail.centroid);
});

element.addEventListener('pan', event => {
  const detail = event.detail;
  console.log('Pan move at:', detail.centroid);
});

element.addEventListener('panEnd', event => {
  const detail = event.detail;
  console.log('Pan ended at:', detail.centroid);
});
```
