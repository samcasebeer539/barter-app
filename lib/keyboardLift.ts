// A tiny signal for "the field you're typing in just changed size".
//
// Screens that keep the focused field above the keyboard (the profile)
// subscribe; a text field that grows as you type (the user card's bio) calls
// requestKeyboardLift() so the screen can re-check and scroll it clear.
// Without this, the check only ran when the keyboard opened, while the field
// was still short.

type Listener = () => void;

const listeners = new Set<Listener>();

export function onKeyboardLiftRequest(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function requestKeyboardLift(): void {
    listeners.forEach(listener => listener());
}
