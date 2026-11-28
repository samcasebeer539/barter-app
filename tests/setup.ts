// Runs before every test file.
// The server address the app would use (lib/api.ts reads it at import).
process.env.EXPO_PUBLIC_API_URL = 'https://api.test';

// Reanimated / Worklets need their native side, even in their own mocks.
// The app uses only these pieces; animations finish instantly in tests.
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) => fn(...args),
}));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const ease = (t: number) => t;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (to: unknown, _config?: unknown, done?: (finished: boolean) => void) => {
      done?.(true);
      return to;
    },
    Easing: { ease, linear: ease, inOut: () => ease, in: () => ease, out: () => ease },
  };
});

// React Native's Animated.spring steps on timers, so its frames land after a
// test's act() has finished ("An update to Animated(View) ... not wrapped in
// act"). In tests a spring jumps straight to where it's going. (Loops use
// timing, not spring, so nothing here can repeat forever.)
{
  const { Animated } = require('react-native');
  Animated.spring = (value: any, config: { toValue: any }) => ({
    start: (done?: (r: { finished: boolean }) => void) => {
      value.setValue(config.toValue);
      done?.({ finished: true });
    },
    stop: () => {},
    reset: () => {},
  });
}
