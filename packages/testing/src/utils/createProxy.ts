import { UserGesture, UserGestureOptions } from '../';

export const createProxy = <T extends UserGesture>(target: T): T => {
  let isSetupCalled = false;

  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop === 'setup') {
        return (options: UserGestureOptions) => {
          isSetupCalled = true;
          Reflect.get(obj, 'setup').bind(obj)(options);
          return receiver;
        };
      }

      const value = Reflect.get(obj, prop);

      if (typeof value !== 'function') {
        return value;
      }

      return async (...args: unknown[]) => {
        await value.bind(obj)(...args);
        if (!isSetupCalled) {
          // We clear the pointers if setup was not called
          // This is useful for tests where we want to ensure no pointers are left hanging
          const pointerManager = Reflect.get(obj, 'pointerManager');
          Reflect.get(pointerManager, 'clearPointers').bind(pointerManager)();
        }
      };
    },
  });

  return proxy;
};
