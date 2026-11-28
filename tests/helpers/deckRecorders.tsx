// Stand-ins for the pieces of a deck that are all gestures and animation,
// so a deck's own wiring can be tested:
//   Deck          the swipeable card stack. Tests "swipe" with swipeTo().
//   TradeActions  the action wheel. Tests read what the deck passes it with
//                 wheel(), and press its buttons with press() / confirm().
//   TradeTurns    the turn log / question box. Tests type with typeQuestion().
//
// Use in a test file:
//   jest.mock('@/components/Deck', () => require('./helpers/deckRecorders').MockDeck);
//   jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
//   jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
import { act } from '@testing-library/react-native';

type Props = Record<string, any>;

// The latest props each piece was rendered with. With several decks on
// screen (the barter page), the last one rendered wins.
export const latest: {
  deck?: Props;
  wheel?: Props;
  turns?: Props[];
  /** Decks with isUser (your own) vs not (the other player's / offerers'). */
  decks: { mine?: Props; theirs?: Props };
} = { decks: {} };

export function resetRecorders() {
  latest.deck = undefined;
  latest.wheel = undefined;
  latest.turns = [];
  latest.decks = {};
}

const Deck = (props: Props) => {
  latest.deck = props;
  latest.decks[props.isUser ? 'mine' : 'theirs'] = props;
  return null;
};
const TradeActions = (props: Props) => {
  latest.wheel = props;
  return null;
};
const TradeTurns = (props: Props) => {
  (latest.turns ??= []).push(props);
  return null;
};

export const MockDeck = { __esModule: true, default: Deck };
export const MockTradeActions = { __esModule: true, default: TradeActions };
export const MockTradeTurns = { __esModule: true, default: TradeTurns };

function need<T>(value: T | undefined, what: string): T {
  if (!value) throw new Error(`${what} hasn't rendered`);
  return value;
}

/** What the deck currently passes the action wheel. */
export const wheel = () => need(latest.wheel, 'The action wheel');
/** What the deck currently passes the card stack (or one of two stacks). */
export const deck = (which?: 'mine' | 'theirs') =>
  need(which ? latest.decks[which] : latest.deck, `The card stack${which ? ` (${which})` : ''}`);

const flush = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });

/** The card on top becomes post #index (null: a user or location card).
 *  `group`: whose cards they are, for stacks holding several players. */
export async function swipeTo(index: number | null, opts: { deck?: 'mine' | 'theirs'; group?: number } = {}) {
  const d = deck(opts.deck);
  await act(async () => {
    if (opts.group !== undefined) d.onTopCardGroupChange?.(opts.group);
    d.onTopCardChange(index);
  });
}

/** Scroll the wheel so this action is on top. */
export async function scrollWheelTo(actionType: string) {
  await act(async () => {
    wheel().onActionChange?.(actionType);
  });
}

/** Tap the action's button on the wheel. */
export async function press(actionType: string) {
  await act(async () => {
    wheel().onActionSelected({ actionType, subAction: 'write' });
  });
}

/** Tap the confirm arrow for this action, and let the request finish. */
export async function confirm(actionType: string) {
  await act(async () => {
    wheel().onActionSelected({ actionType, subAction: 'select' });
  });
  await flush();
  await flush();
}

/** Every turn log rendered last time (latest render first). */
export const turnLogs = () => [...(latest.turns ?? [])].reverse();

/** Type into the open question box. */
export async function typeQuestion(text: string) {
  const box = need(
    [...(latest.turns ?? [])].reverse().find(t => t.onQueryTextChange),
    'The question box',
  );
  await act(async () => {
    box.onQueryTextChange(text);
  });
}

/** The turns shown in the most recent turn log that has any. */
export function shownTurns(): any[] {
  return [...(latest.turns ?? [])].reverse().find(t => t.turns?.length)?.turns ?? [];
}
