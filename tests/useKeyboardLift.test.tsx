// hooks/useKeyboardLift.tsx: keeping the field you're typing in visible
// above the keyboard, and only scrolling the screen that owns that field.
import React from 'react';
import { Dimensions, Keyboard, TextInput } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useKeyboardLift, useKeyboardLiftField, KeyboardLiftContext } from '@/hooks/useKeyboardLift';

const SCREEN_H = Dimensions.get('window').height;
const KB_H = 300;
const KB_TOP = SCREEN_H - KB_H;

// Keyboard events, by name, so a test can fire them.
let listeners: Record<string, ((e: any) => void)[]>;
const fire = (name: string, e?: any) =>
  act(async () => {
    (listeners[name] ?? []).forEach(l => l(e));
  });
const keyboardUp = async () => {
  const e = { endCoordinates: { screenY: KB_TOP, height: KB_H } };
  await fire('keyboardWillShow', e);
  await fire('keyboardDidShow', e);
};
// The focused field: where it sits on screen (y, height).
let field: { y: number; h: number } | null;

beforeEach(() => {
  jest.useFakeTimers();
  listeners = {};
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, fn: any) => {
    (listeners[name] ??= []).push(fn);
    return {
      remove: () => {
        listeners[name] = listeners[name].filter(f => f !== fn);
      },
    };
  }) as any);
  field = null;
  jest
    .spyOn(TextInput.State, 'currentlyFocusedInput')
    .mockImplementation(() => (field ? { measureInWindow: (cb: any) => cb(0, field!.y, 300, field!.h) } : null) as any);
});
afterEach(() => jest.useRealTimers());

async function screenWithLift(scrolledTo = 1000, topInset = 47) {
  const scrollTo = jest.fn();
  const scrollRef = { current: { scrollTo } };
  const scrollY = { current: scrolledTo };
  const { result } = await renderHook(() => useKeyboardLift(scrollRef as any, scrollY, topInset));
  return { scrollTo, result };
}
const focusField = async (result: any) => {
  await act(async () => {
    result.current.context.claimFocus();
  });
};
const settle = () =>
  act(async () => {
    jest.advanceTimersByTime(60);
  });

test('a field the keyboard would cover is lifted to just above it', async () => {
  const { scrollTo, result } = await screenWithLift();
  field = { y: KB_TOP - 20, h: 40 }; // bottom 20 points under the keyboard's top
  await focusField(result);
  await keyboardUp();
  await settle();
  expect(result.current.keyboardHeight).toBe(KB_H); // the screen pads its bottom this much
  // overlap = (y + h + 56) - keyboard top = 20 + 56
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 1000 + 76, animated: true });
});

test("a field that's already visible doesn't move the page", async () => {
  const { scrollTo, result } = await screenWithLift();
  field = { y: 200, h: 40 };
  await focusField(result);
  await keyboardUp();
  await settle();
  expect(scrollTo).not.toHaveBeenCalled();
});

test('a field scrolled off the top is brought back below the status bar', async () => {
  const { scrollTo, result } = await screenWithLift(1000, 47);
  field = { y: -100, h: 40 };
  await focusField(result);
  await keyboardUp();
  await settle();
  // top limit = inset 47 + 16; scroll back by (63 - -100)
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 1000 - 163, animated: true });
});

test('only the screen that owns the field reacts (tabs stay mounted)', async () => {
  const other = await screenWithLift();
  field = { y: KB_TOP, h: 40 };
  await keyboardUp();
  await settle();
  expect(other.result.current.keyboardHeight).toBe(0);
  expect(other.scrollTo).not.toHaveBeenCalled();
});

test('the lift is re-applied once, after the keyboard padding is laid out', async () => {
  const { scrollTo, result } = await screenWithLift();
  field = { y: KB_TOP, h: 40 };
  await focusField(result);
  await keyboardUp();
  await settle();
  scrollTo.mockClear();
  await act(async () => {
    result.current.onContentSizeChange();
  });
  expect(scrollTo).toHaveBeenCalledWith({ y: 1000 + 96, animated: true });
  scrollTo.mockClear();
  await act(async () => {
    result.current.onContentSizeChange();
  });
  expect(scrollTo).not.toHaveBeenCalled();
});

test('typing re-checks (a growing box gets lifted again)', async () => {
  const { scrollTo, result } = await screenWithLift();
  field = { y: 400, h: 40 };
  await focusField(result);
  await keyboardUp();
  await settle();
  expect(scrollTo).not.toHaveBeenCalled();
  field = { y: 400, h: KB_TOP - 400 + 10 }; // grew down under the keyboard
  await act(async () => {
    result.current.context.requestLift();
  });
  expect(scrollTo).toHaveBeenCalled();
});

test('moving to another field with the keyboard already up lifts right away', async () => {
  const { scrollTo, result } = await screenWithLift();
  await keyboardUp(); // keyboard up for some other screen's field
  field = { y: KB_TOP + 10, h: 40 };
  await focusField(result);
  await settle();
  expect(result.current.keyboardHeight).toBe(SCREEN_H - KB_TOP);
  expect(scrollTo).toHaveBeenCalled();
});

test('closing the keyboard removes the padding and lets go of the field', async () => {
  const { scrollTo, result } = await screenWithLift();
  field = { y: KB_TOP, h: 40 };
  await focusField(result);
  await keyboardUp();
  await fire('keyboardWillHide');
  expect(result.current.keyboardHeight).toBe(0);
  scrollTo.mockClear();
  await act(async () => {
    result.current.context.requestLift();
  });
  expect(scrollTo).not.toHaveBeenCalled();
});

test('a field outside any lifting screen is fine (does nothing)', async () => {
  const { result } = await renderHook(() => useKeyboardLiftField());
  expect(() => {
    result.current.onFocus();
    result.current.requestLift();
  }).not.toThrow();
});

test('a field inside one tells that screen it has the focus', async () => {
  const claimFocus = jest.fn(),
    requestLift = jest.fn();
  const wrapper = ({ children }: any) => (
    <KeyboardLiftContext.Provider value={{ claimFocus, requestLift }}>{children}</KeyboardLiftContext.Provider>
  );
  const { result } = await renderHook(() => useKeyboardLiftField(), { wrapper });
  result.current.onFocus();
  result.current.requestLift();
  expect([claimFocus.mock.calls.length, requestLift.mock.calls.length]).toEqual([1, 1]);
});
