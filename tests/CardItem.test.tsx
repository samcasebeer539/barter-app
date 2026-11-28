// components/CardItem.tsx: the post card. Which buttons show for your own
// post vs someone else's, and the rules for saving an edit.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons/FontAwesome6', () => {
  const { Text: MockText } = require('react-native');
  return ({ name }: { name: string }) => <MockText>{`icon:${name}`}</MockText>;
});
jest.mock('react-native-text-ticker', () => {
  const { Text: MockText } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => <MockText>{children}</MockText>;
});
jest.mock('expo-image', () => {
  const { View: MockView } = require('react-native');
  return { Image: (props: any) => <MockView testID="photo" {...props} /> };
});
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/lib/safety', () => ({ startReport: jest.fn() }));

import * as ImagePicker from 'expo-image-picker';
import { startReport } from '@/lib/safety';
import CardItem from '@/components/CardItem';
import { TEXT_LIMITS } from '@/config/textLimits';

const photos = (n: number) => Array.from({ length: n }, (_, i) => `https://cdn.test/${i}.jpg`);
const lamp = { _id: 'p1', name: 'Lamp', description: 'Bright', photos: photos(1), date_posted: '2026-11-01' };
const newPost = { name: '', description: '', photos: [] as string[], date_posted: '' };

type Props = React.ComponentProps<typeof CardItem>;
const show = (props: Partial<Props>) => render(<CardItem post={lamp} {...props} />);
const pick = ImagePicker.launchImageLibraryAsync as jest.Mock;

// ── view mode ────────────────────────────────────────────────────────────────

test("someone else's post: a report button, no edit", async () => {
  await show({ isUser: false, ownerName: 'Bob' });
  expect(screen.queryByTestId('post-edit')).toBeNull();
  await fireEvent.press(screen.getByTestId('post-report'));
  expect(startReport).toHaveBeenCalledWith({ postId: 'p1', name: 'Bob' });
});

test('your own post: edit, no report', async () => {
  const onEnterEdit = jest.fn();
  await show({ isUser: true, onEnterEdit });
  expect(screen.queryByTestId('post-report')).toBeNull();
  await fireEvent.press(screen.getByTestId('post-edit'));
  expect(onEnterEdit).toHaveBeenCalled();
});

test('no edit button where the deck cannot edit (e.g. the trade deck)', async () => {
  await show({ isUser: true });
  expect(screen.queryByTestId('post-edit')).toBeNull();
});

test("a post in an active trade can't be edited", async () => {
  const onEnterEdit = jest.fn();
  await show({ isUser: true, onEnterEdit, post: { ...lamp, inTrade: true } });
  expect(screen.getByTestId('post-edit')).toBeDisabled();
  expect(screen.getByText('icon:square-pen')).toBeTruthy();
});

// ── edit mode ────────────────────────────────────────────────────────────────

const edit = (post: any, extra: Partial<Props> = {}) =>
  show({
    isUser: true,
    isEditable: true,
    post,
    onSave: jest.fn(),
    onExitEdit: jest.fn(),
    onDiscard: jest.fn(),
    ...extra,
  });

test('save needs a title and a photo', async () => {
  await edit({ ...newPost, photos: photos(1) });
  expect(screen.getByTestId('post-save')).toBeDisabled(); // no title
  await fireEvent.changeText(screen.getByPlaceholderText('Item title'), '   ');
  expect(screen.getByTestId('post-save')).toBeDisabled(); // spaces don't count
  await fireEvent.changeText(screen.getByPlaceholderText('Item title'), 'Desk');
  expect(screen.getByTestId('post-save')).toBeEnabled();

  await screen.unmount();
  await edit({ ...newPost, name: 'Desk' });
  expect(screen.getByTestId('post-save')).toBeDisabled(); // no photo
});

test('saving sends the edited post and leaves edit mode', async () => {
  const onSave = jest.fn(),
    onExitEdit = jest.fn();
  await edit(lamp, { onSave, onExitEdit });
  await fireEvent.changeText(screen.getByPlaceholderText('Item title'), 'Desk lamp');
  await fireEvent.press(screen.getByTestId('post-save'));
  expect(onSave).toHaveBeenCalledWith({ ...lamp, name: 'Desk lamp' });
  expect(onExitEdit).toHaveBeenCalled();
});

test('cancelling a brand-new post throws it away', async () => {
  const onDiscard = jest.fn(),
    onSave = jest.fn();
  await edit(newPost, { onDiscard, onSave });
  await fireEvent.press(screen.getByTestId('post-cancel'));
  expect(onDiscard).toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});

test('cancelling an edit keeps the post and saves nothing', async () => {
  const onDiscard = jest.fn(),
    onSave = jest.fn(),
    onExitEdit = jest.fn();
  await edit(lamp, { onDiscard, onSave, onExitEdit });
  await fireEvent.changeText(screen.getByPlaceholderText('Item title'), 'Changed my mind');
  await fireEvent.press(screen.getByTestId('post-cancel'));
  expect([onDiscard.mock.calls.length, onSave.mock.calls.length, onExitEdit.mock.calls.length]).toEqual([0, 0, 1]);
});

test('the title stops at the length limit', async () => {
  await edit(lamp);
  expect(screen.getByPlaceholderText('Item title').props.maxLength).toBe(TEXT_LIMITS.postTitle);
});

test('adding a photo from the picker', async () => {
  pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///new.jpg' }] });
  const onSave = jest.fn();
  await edit(lamp, { onSave });
  await fireEvent.press(screen.getByTestId('photo-add'));
  await fireEvent.press(screen.getByTestId('post-save'));
  expect(onSave.mock.calls[0][0].photos).toEqual([...lamp.photos, 'file:///new.jpg']);
});

test('backing out of the picker adds nothing', async () => {
  pick.mockResolvedValue({ canceled: true, assets: [] });
  const onSave = jest.fn();
  await edit(lamp, { onSave });
  await fireEvent.press(screen.getByTestId('photo-add'));
  await fireEvent.press(screen.getByTestId('post-save'));
  expect(onSave.mock.calls[0][0].photos).toEqual(lamp.photos);
});

test('add photo turns off at 10 photos', async () => {
  await edit({ ...lamp, photos: photos(9) });
  expect(screen.getByTestId('photo-add')).toBeEnabled();
  await screen.unmount();
  await edit({ ...lamp, photos: photos(10) });
  expect(screen.getByTestId('photo-add')).toBeDisabled();
  await fireEvent.press(screen.getByTestId('photo-add'));
  expect(pick).not.toHaveBeenCalled();
});

test('removing the last photo turns off remove (and save)', async () => {
  await edit(lamp);
  await fireEvent.press(screen.getByTestId('photo-remove'));
  expect(screen.getByTestId('photo-remove')).toBeDisabled();
  expect(screen.getByTestId('post-save')).toBeDisabled();
});
