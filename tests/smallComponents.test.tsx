// Small pieces: the review stars, the feed's search / sort bar, and the
// barter page's OPEN / BARTER / CLOSE bar.
import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { FontAwesome6: ({ name, solid }: { name: string; solid?: boolean }) =>
    <Text>{`icon:${name}${solid ? ':solid' : ''}`}</Text> };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));

import StarPicker from '@/components/StarPicker';
import BarFeed from '@/components/BarFeed';
import BarBarter from '@/components/BarBarter';
import { colors } from '@/styles/globalStyles';
import { TEXT_LIMITS } from '@/config/textLimits';

// ── stars ────────────────────────────────────────────────────────────────────

test('stars: none filled until picked; tapping the 4th rates 4 and fills four', async () => {
  const onChange = jest.fn();
  const { rerender } = await render(<StarPicker rating={null} onChange={onChange} />);
  expect(screen.queryAllByText('icon:star:solid')).toHaveLength(0);
  await fireEvent.press(screen.getAllByText(/^icon:star/)[3]);
  expect(onChange).toHaveBeenCalledWith(4);
  await rerender(<StarPicker rating={4} onChange={onChange} />);
  expect(screen.getAllByText('icon:star:solid')).toHaveLength(4);
  expect(screen.getAllByText('icon:star')).toHaveLength(1);
});

// ── feed bar ─────────────────────────────────────────────────────────────────

function feedBar() {
  const cb = { onSearchSubmit: jest.fn(), onSearchClear: jest.fn(), onSortPress: jest.fn(), onLocationPress: jest.fn() };
  return { cb, el: <BarFeed showLocation headerTranslateY={new Animated.Value(0)} {...cb} /> };
}
const box = () => screen.getByPlaceholderText('Search');

test('search: Done searches the trimmed text; empty text does nothing', async () => {
  const { cb, el } = feedBar();
  await render(el);
  expect(box().props.maxLength).toBe(TEXT_LIMITS.search);
  await fireEvent.changeText(box(), '   ');
  await fireEvent(box(), 'submitEditing');
  expect(cb.onSearchSubmit).not.toHaveBeenCalled();
  await fireEvent.changeText(box(), '  desk lamp ');
  await fireEvent(box(), 'submitEditing');
  expect(cb.onSearchSubmit).toHaveBeenCalledWith('desk lamp');
});

test('while a search shows, the magnifying glass becomes an X that clears it', async () => {
  const { cb, el } = feedBar();
  await render(el);
  expect(screen.getByText('icon:magnifying-glass')).toBeTruthy();
  await fireEvent.changeText(box(), 'lamp');
  await fireEvent(box(), 'submitEditing');
  await fireEvent.press(screen.getByText('icon:circle-xmark'));
  expect(cb.onSearchClear).toHaveBeenCalled();
  expect(box().props.value).toBe('');
  expect(screen.getByText('icon:magnifying-glass')).toBeTruthy();
});

test('the sort button opens the sort menu', async () => {
  const { cb, el } = feedBar();
  await render(el);
  await fireEvent.press(screen.getByText('icon:sliders'));
  expect(cb.onSortPress).toHaveBeenCalled();
});

// ── barter tabs ──────────────────────────────────────────────────────────────

test('OPEN / BARTER / CLOSE: each switches the tab and lights up', async () => {
  const cb = { onOffersPress: jest.fn(), onTradesPress: jest.fn(), onDealsPress: jest.fn() };
  await render(<BarBarter {...cb} />);
  const lit = () => ['OPEN', 'BARTER', 'CLOSE'].filter(t => StyleSheet.flatten(screen.getByText(t).props.style).color === '#fff');
  expect(lit()).toEqual(['OPEN']);
  await fireEvent.press(screen.getByText('BARTER'));
  expect(cb.onTradesPress).toHaveBeenCalled();
  expect(lit()).toEqual(['BARTER']);
  await fireEvent.press(screen.getByText('CLOSE'));
  expect(cb.onDealsPress).toHaveBeenCalled();
  expect(lit()).toEqual(['CLOSE']);
  await fireEvent.press(screen.getByText('OPEN'));
  expect(cb.onOffersPress).toHaveBeenCalled();
  expect(lit()).toEqual(['OPEN']);
  void colors;
});
