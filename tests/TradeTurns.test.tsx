// components/TradeTurns.tsx: the turn log (one line per move) and the
// question box above it.
import React from 'react';
import { Keyboard } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TradeTurns, { TradeTurn } from '@/components/TradeTurns';
import { TEXT_LIMITS } from '@/config/textLimits';

const lines = () =>
  screen
    .queryAllByText(/./)
    .map(n => {
      const kids = n.props.children;
      return Array.isArray(kids)
        ? kids
            .flat(3)
            .map((k: any) => (typeof k === 'string' ? k : ''))
            .join('')
        : kids;
    })
    .filter(t => typeof t === 'string' && t.length > 0);

// ── the log ──────────────────────────────────────────────────────────────────

test("each move reads as a sentence: yours as 'You', theirs with their name", async () => {
  const turns: TradeTurn[] = [
    { type: 'turnStall', user: 'Bob', isUser: false },
    { type: 'turnAdd', item: 'Vase', isUser: true },
    { type: 'turnOffer', user: 'Bob', item: 'Lamp', isUser: false },
  ];
  await render(<TradeTurns turns={turns} />);
  expect(screen.getByText('Bob stalled')).toBeTruthy();
  expect(screen.getByText('You added Vase')).toBeTruthy();
  expect(screen.getByText('Bob sent offer on Lamp')).toBeTruthy();
});

test('a question and its answer', async () => {
  await render(
    <TradeTurns
      turns={[
        { type: 'turnQuery', item: 'Dimmable? (Lamp)', isUser: true },
        { type: 'turnAnswer', user: 'Bob', item: 'Yes', isUser: false },
      ]}
    />,
  );
  expect(screen.getByText('You asked: Dimmable? (Lamp)')).toBeTruthy();
  expect(screen.getByText('Bob answered: Yes')).toBeTruthy();
});

test('a move type the app does not know shows nothing (instead of a broken line)', async () => {
  await render(
    <TradeTurns
      turns={[
        { type: 'turnSomethingNew' as any, isUser: true },
        { type: 'turnStall', isUser: true },
      ]}
    />,
  );
  expect(screen.getByText('You stalled')).toBeTruthy();
  expect(lines()).toEqual(['You stalled']);
});

test('no box unless a question is being written', async () => {
  await render(<TradeTurns turns={[]} />);
  expect(screen.queryByPlaceholderText('Ask a question…')).toBeNull();
});

// ── the question box ─────────────────────────────────────────────────────────

test('typing a question reports each change, up to the message limit', async () => {
  const onQueryTextChange = jest.fn();
  await render(<TradeTurns turns={[]} isQueryOpen onQueryTextChange={onQueryTextChange} />);
  const box = screen.getByPlaceholderText('Ask a question…');
  expect(box.props.maxLength).toBe(TEXT_LIMITS.message);
  await fireEvent.changeText(box, 'Still available?');
  expect(onQueryTextChange).toHaveBeenLastCalledWith('Still available?');
  expect(box.props.value).toBe('Still available?');
});

test('closing the box throws away what was typed', async () => {
  const { rerender } = await render(<TradeTurns turns={[]} isQueryOpen />);
  await fireEvent.changeText(screen.getByPlaceholderText('Ask a question…'), 'Half a thought');
  await rerender(<TradeTurns turns={[]} isQueryOpen={false} />);
  await rerender(<TradeTurns turns={[]} isQueryOpen />);
  expect(screen.getByPlaceholderText('Ask a question…').props.value).toBe('');
});

test('other uses set their own placeholder (answering, reviewing)', async () => {
  await render(<TradeTurns turns={[]} isQueryOpen queryPlaceholder="Answer to begin your turn" />);
  expect(screen.getByPlaceholderText('Answer to begin your turn')).toBeTruthy();
});

test("the keyboard's key turns into Done once the box is focused, and Done closes the keyboard", async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  await render(<TradeTurns turns={[]} isQueryOpen />);
  const box = () => screen.getByPlaceholderText('Ask a question…');
  expect(box().props.returnKeyType).toBe('default');
  await fireEvent(box(), 'focus');
  expect(box().props.returnKeyType).toBe('done');
  await fireEvent(box(), 'submitEditing');
  expect(dismiss).toHaveBeenCalled();
});

test('the box focuses itself when it opens', async () => {
  // React Native's test setup gives every text field the same mock focus().
  const { focus } = require('@react-native/jest-preset/jest/MockNativeMethods').default;
  jest.useFakeTimers();
  focus.mockClear();
  await render(<TradeTurns turns={[]} isQueryOpen={false} />);
  await screen.rerender(<TradeTurns turns={[]} isQueryOpen />);
  expect(focus).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);
  expect(focus).toHaveBeenCalled();
  jest.useRealTimers();
});
