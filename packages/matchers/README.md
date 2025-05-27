# @web-gestures/matchers

Custom Vitest matchers for testing web gestures.

## Installation

```bash
npm install --save-dev @web-gestures/matchers
# or
yarn add --dev @web-gestures/matchers
# or
pnpm add -D @web-gestures/matchers
```

## Usage

Add the matchers to your Vitest setup file:

```ts
// In your vitest.setup.ts or similar
import '@web-gestures/matchers';
```

Now you can use the custom matchers in your tests.

## Available Matchers

### `toUpdateOptions(expectedOptions: object)`

Asserts that the provided gesture options can be updated by emitting a change event and that the options match the expected values.

```ts
// Check if gesture options can be updated
expect(MoveGesture).toUpdateOptions({ preventDefault: true });
```

### `toBeClonable(overrides?: object)`

Asserts that the provided gesture can be cloned and that the clone has the same properties as the original gesture, or overridden properties if specified.

```ts
// Check if the gesture can be cloned with the same properties
expect(MoveGesture).toBeClonable();

// Check if the gesture can be cloned with overridden properties
expect(MoveGesture).toBeClonable({ preventDefault: true });
```

### `toUpdateState(expectedState: object)`

Asserts that the provided gesture state can be updated by emitting a change event and that the state properties match the expected values.

```ts
// Check if gesture state can be updated
expect(MoveGesture).toUpdateState({ isDragging: true });
```

## Notes

- The matchers `toUpdateOptions`, `toBeClonable`, and `toUpdateState` do not support negation (using `.not` before the matcher). Using these with `.not` will throw an error.
