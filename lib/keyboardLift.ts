// A tiny signal for "the field you're typing in changed" (grew, or you typed).
//
// Screens that keep the focused field above the keyboard (the profile)
// subscribe; text fields (the user card's bio, a post's description) call
// requestKeyboardLift() as they grow or as you type, so the screen re-checks
// and scrolls the field back into view if it's covered by the keyboard or
// scrolled off the top. Without this, the check only ran when the keyboard
// opened.

type Listener = () => void;

const listeners = new Set<Listener>();

export function onKeyboardLiftRequest(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function requestKeyboardLift(): void {
    listeners.forEach(listener => listener());
}
