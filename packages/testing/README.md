# @web-gestures/testing

A utility package for simulating user gestures in browser testing environments. This package works alongside `@web-gestures/core` to make it easy to test gesture interactions in your web applications.

## Installation

```bash
# Using npm
npm install @web-gestures/testing --save-dev

# Using pnpm
pnpm add @web-gestures/testing -D

# Using yarn
yarn add @web-gestures/testing --dev
```

## Usage

This package provides a simple and intuitive API for simulating all gesture types supported by the `@web-gestures/core` package.

The main entry point is the `userGesture` object.

```typescript
import { userGesture } from '@web-gestures/testing';

const gesture = userGesture.setup({
  pointerType: 'touch',
  // advanceTimers:
});
```
