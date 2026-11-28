// Keeps the text field you're typing in visible above the keyboard.
//
// A scrolling screen calls useKeyboardLift(scrollRef, scrollY, topInset),
// wraps its content in <KeyboardLiftContext.Provider value={lift.context}>,
// adds lift.keyboardHeight to its bottom padding, and passes
// lift.onContentSizeChange to its ScrollView.
//
// Text fields call useKeyboardLiftField() and spread its handlers: onFocus
// tells the nearest screen it owns the focused field, and requestLift (call
// on every change / size change) re-checks after typing. Only the screen
// that owns the focused field scrolls, so screens that stay mounted (tabs)
// or sit under a modal (barter under the ADD feed deck) don't react.
//
// The check scrolls only when needed: a field covered by the keyboard is
// lifted to just above it; a field scrolled off the top is brought back
// below the status bar; a visible field doesn't move the page.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
  MutableRefObject,
} from 'react';
import { Dimensions, Keyboard, KeyboardEvent, Platform, TextInput } from 'react-native';

const GAP = 16;
// Space kept between the text you're typing and the top of the keyboard.
const KEYBOARD_GAP = 56;

interface KeyboardLiftContextValue {
  /** The focused field belongs to this screen. */
  claimFocus: () => void;
  /** Re-check after the focused field changed (typed in, or resized). */
  requestLift: () => void;
}

export const KeyboardLiftContext = createContext<KeyboardLiftContextValue | null>(null);

type Scrollable = { scrollTo: (o: { y: number; animated: boolean }) => void };

export function useKeyboardLift(scrollRef: RefObject<unknown>, scrollY: MutableRefObject<number>, topInset = 0) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardTop = useRef<number | null>(null);
  const ownsFocus = useRef(false);
  const liftTarget = useRef<number | null>(null);
  const visibleTop = useRef(topInset);
  visibleTop.current = topInset;

  const scrollTo = useCallback(
    (y: number) => {
      // (The ScrollView ref's type lacks scrollTo in this React Native version.)
      (scrollRef.current as Scrollable | null)?.scrollTo({ y, animated: true });
    },
    [scrollRef],
  );

  const lift = useCallback(() => {
    if (!ownsFocus.current || keyboardTop.current === null) return;
    const kbTop = keyboardTop.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (!input) return;
    input.measureInWindow((_x, y, _w, h) => {
      // Scrolled up off the top (all but a sliver hidden).
      const topLimit = visibleTop.current + GAP;
      if (y + h < topLimit + 40) {
        scrollTo(Math.max(0, scrollY.current - (topLimit - y)));
        return;
      }
      // Covered by the keyboard.
      const overlap = y + h + KEYBOARD_GAP - kbTop;
      if (overlap <= 0) return;
      const target = scrollY.current + overlap;
      // Re-applied once the keyboard padding has laid out (before that
      // the scroll can be capped short).
      liftTarget.current = target;
      scrollTo(target);
    });
  }, [scrollTo, scrollY]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      keyboardTop.current = e.endCoordinates.screenY;
      if (!ownsFocus.current) return;
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(lift, 50);
    });
    // Second check once the keyboard is fully up.
    const didShow = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      keyboardTop.current = e.endCoordinates.screenY;
      lift();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      ownsFocus.current = false;
      liftTarget.current = null;
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      didShow.remove();
      hide.remove();
    };
  }, [lift]);

  const onContentSizeChange = useCallback(() => {
    if (liftTarget.current !== null) {
      scrollTo(liftTarget.current);
      liftTarget.current = null;
    }
  }, [scrollTo]);

  const context = useMemo<KeyboardLiftContextValue>(
    () => ({
      claimFocus: () => {
        ownsFocus.current = true;
        // Keyboard already open (moving between fields): lift now.
        if (keyboardTop.current !== null) {
          const kbHeight = Math.max(0, Dimensions.get('window').height - keyboardTop.current);
          setKeyboardHeight(h => h || kbHeight);
          setTimeout(lift, 50);
        }
      },
      requestLift: lift,
    }),
    [lift],
  );

  return { keyboardHeight, onContentSizeChange, context };
}

/** For text fields: spread onFocus, and call requestLift on change / resize. */
export function useKeyboardLiftField() {
  const ctx = useContext(KeyboardLiftContext);
  return useMemo(
    () => ({
      onFocus: () => ctx?.claimFocus(),
      requestLift: () => ctx?.requestLift(),
    }),
    [ctx],
  );
}
