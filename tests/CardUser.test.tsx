// components/CardUser.tsx: the user card. What contacts show, editing your
// own card (contact visibility, hidden-number dots, the phone field, save /
// cancel), and the reviews list.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { FontAwesome6: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text> };
});
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: () => <View /> };
});
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/lib/safety', () => ({
  useIsBlocked: () => false,
  confirmBlock: jest.fn(),
  confirmUnblock: jest.fn(),
  startReport: jest.fn(),
}));
jest.mock('@/services/userService', () => ({
  uploadProfilePhoto: jest.fn(),
  getUserReviews: jest.fn(async () => []),
  getCachedReviews: jest.fn(() => undefined),
}));

import CardUser from '@/components/CardUser';
import { getUserReviews, getCachedReviews } from '@/services/userService';
import { TEXT_LIMITS } from '@/config/textLimits';

const ana = {
  _id: 'ana',
  first_name: 'Ana',
  last_name: 'Ruiz',
  email: 'ana@example.com',
  phone: '555-0100',
  pronouns: 'she/her',
  bio: 'Hi',
  email_visible: false,
  phone_visible: false,
  rating: 4,
  reviewCount: 2,
} as any;
const flush = () =>
  act(async () => {
    for (let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0));
  });

// ── viewing ──────────────────────────────────────────────────────────────────

test('only contacts marked visible show; none -> no contact line at all', async () => {
  const { rerender } = await render(<CardUser user={{ ...ana, email_visible: true, phone_visible: true }} />);
  expect(screen.getByText('ana@example.com · 555-0100')).toBeTruthy();
  await rerender(<CardUser user={{ ...ana, email_visible: true }} />);
  expect(screen.getByText('ana@example.com')).toBeTruthy();
  await rerender(<CardUser user={ana} />);
  expect(screen.queryByText(/ana@example\.com|555/)).toBeNull();
});

// ── editing your own card ────────────────────────────────────────────────────

function editing(extra: object = {}) {
  const cb = { onSave: jest.fn(), onExitEdit: jest.fn() };
  return { cb, el: <CardUser user={ana} isUser isEditable {...cb} {...extra} /> };
}

test('hidden contacts show as dots, one per character', async () => {
  await render(editing().el);
  expect(screen.getByText('•'.repeat('ana@example.com'.length))).toBeTruthy();
  expect(screen.getByText('•'.repeat('555-0100'.length))).toBeTruthy();
});

test('the eyes show / hide each contact; saved with the check mark', async () => {
  const { cb, el } = editing();
  await render(el);
  await fireEvent.press(screen.getAllByText('icon:eye-slash')[0]); // email
  expect(screen.getByText('ana@example.com')).toBeTruthy();
  await fireEvent.press(screen.getByText('icon:circle-check'));
  expect(cb.onSave).toHaveBeenCalledWith(expect.objectContaining({ email_visible: true, phone_visible: false }));
  expect(cb.onExitEdit).toHaveBeenCalled();
});

test('tapping the dots opens the hidden number to edit; what you type is kept', async () => {
  const { cb, el } = editing();
  await render(el);
  await fireEvent.press(screen.getByText('•'.repeat(8)));
  const phone = screen.getByPlaceholderText('Phone (optional)');
  expect(phone.props.maxLength).toBe(TEXT_LIMITS.phone);
  await fireEvent.changeText(phone, '555-0199');
  await fireEvent(phone, 'blur');
  expect(screen.getByText('•'.repeat(8))).toBeTruthy(); // hidden again, new number
  await fireEvent.press(screen.getAllByText('icon:eye-slash')[1]); // show the phone: still what you typed
  expect(screen.getByPlaceholderText('Phone (optional)').props.value).toBe('555-0199');
  await fireEvent.press(screen.getByText('icon:circle-check'));
  expect(cb.onSave.mock.calls[0][0]).toMatchObject({ phone: '555-0199', phone_visible: true });
});

test('pronouns and bio: edited, limited, saved', async () => {
  const { cb, el } = editing();
  await render(el);
  const pronouns = screen.getByPlaceholderText('Pronouns (optional)');
  const bio = screen.getByPlaceholderText('Tell others about yourself (optional)');
  expect([pronouns.props.maxLength, bio.props.maxLength]).toEqual([TEXT_LIMITS.pronouns, TEXT_LIMITS.bio]);
  await fireEvent.changeText(pronouns, 'they/them');
  await fireEvent.changeText(bio, 'Collector of lamps');
  await fireEvent.press(screen.getByText('icon:circle-check'));
  expect(cb.onSave.mock.calls[0][0]).toMatchObject({ pronouns: 'they/them', bio: 'Collector of lamps' });
});

test('X throws away every change, the eyes included', async () => {
  const { cb, el } = editing();
  const { rerender } = await render(el);
  await fireEvent.changeText(screen.getByPlaceholderText('Tell others about yourself (optional)'), 'Changed');
  await fireEvent.press(screen.getAllByText('icon:eye-slash')[0]);
  await fireEvent.press(screen.getByText('icon:circle-xmark'));
  expect(cb.onSave).not.toHaveBeenCalled();
  expect(cb.onExitEdit).toHaveBeenCalled();
  await rerender(editing().el); // back into edit: the original values
  expect(screen.getByPlaceholderText('Tell others about yourself (optional)').props.value).toBe('Hi');
  expect(screen.getByText('•'.repeat('ana@example.com'.length))).toBeTruthy(); // email hidden again
});

// ── reviews ──────────────────────────────────────────────────────────────────

test('tapping the stars opens the reviews; the count reads right', async () => {
  (getUserReviews as jest.Mock).mockResolvedValueOnce([
    { _id: 'r1', rating: 5, text: 'Great trade', reviewerName: 'Bob Test', createdAt: null },
  ]);
  await render(<CardUser user={ana} />);
  await fireEvent.press(screen.getByText('(2 reviews)'));
  await flush();
  expect(getUserReviews).toHaveBeenCalledWith('ana', 2);
  expect(screen.getByText('Bob Test')).toBeTruthy();
  expect(screen.getByText('Great trade')).toBeTruthy();
});

test('one review reads "(1 review)"; none says so', async () => {
  (getUserReviews as jest.Mock).mockResolvedValueOnce([]);
  await render(<CardUser user={{ ...ana, reviewCount: 1 }} />);
  await fireEvent.press(screen.getByText('(1 review)'));
  await flush();
  expect(screen.getByText('No reviews yet')).toBeTruthy();
});

test('reviews already loaded this session show at once, without asking again', async () => {
  (getUserReviews as jest.Mock).mockClear();
  (getCachedReviews as jest.Mock).mockReturnValueOnce([
    { _id: 'r1', rating: 4, text: '', reviewerName: 'Cara', createdAt: null },
  ]);
  await render(<CardUser user={ana} />);
  await fireEvent.press(screen.getByText('(2 reviews)'));
  expect(screen.getByText('Cara')).toBeTruthy();
  expect(getUserReviews).not.toHaveBeenCalled();
});

test('if reviews fail to load, says so and tries again next time', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  (getUserReviews as jest.Mock).mockClear().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  await render(<CardUser user={ana} />);
  await fireEvent.press(screen.getByText('(2 reviews)'));
  await flush();
  expect(screen.getByText("Couldn't load reviews")).toBeTruthy();
  await fireEvent.press(screen.getAllByText('(2 reviews)')[0]); // close
  await fireEvent.press(screen.getAllByText('(2 reviews)')[0]); // open again
  await flush();
  expect(getUserReviews).toHaveBeenCalledTimes(2);
  expect(screen.getByText('No reviews yet')).toBeTruthy();
});
