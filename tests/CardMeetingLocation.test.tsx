// components/CardMeetingLocation.tsx: the location card. Saving up to three
// safe exchange spots, picking one in a trade (WHERE), showing a proposed
// spot, choosing someone else's, and where the map starts.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

const mockMap: { props?: any; animateToRegion: jest.Mock } = { animateToRegion: jest.fn() };
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef((props: any, ref: any) => {
    mockMap.props = props;
    React.useImperativeHandle(ref, () => ({ animateToRegion: mockMap.animateToRegion }));
    return <View testID="map">{props.children}</View>;
  });
  const Marker = (p: any) => <View testID={`pin-${p.title ?? 'new'}`} />;
  return { __esModule: true, default: MapView, Marker };
});
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return { FontAwesome6: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text> };
});
const mockDevice = {
  allowed: true,
  permission: 'granted',
  position: { coords: { latitude: 40.7, longitude: -74 } } as any,
};
jest.mock('@/lib/settingsCache', () => ({
  getSettings: async () => ({ locationAllowed: mockDevice.allowed, notificationsEnabled: true }),
  updateSettingsCache: jest.fn(),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: mockDevice.permission })),
  getLastKnownPositionAsync: async () => mockDevice.position,
  getCurrentPositionAsync: async () => mockDevice.position,
  Accuracy: { Balanced: 3 },
}));

import CardMeetingLocation from '@/components/CardMeetingLocation';
import { TEXT_LIMITS } from '@/config/textLimits';

const spot = (id: string, name: string, lat = 37, lon = -122) => ({
  id,
  name,
  description: '',
  latitude: lat,
  longitude: lon,
});
const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0));
  });
const tapMap = (latitude = 37.5, longitude = -122.5) =>
  act(async () => {
    mockMap.props.onPress({ nativeEvent: { coordinate: { latitude, longitude } } });
  });
const icons = (name: string) => screen.queryAllByText(`icon:${name}`);

beforeEach(() => {
  mockMap.animateToRegion.mockClear();
  Object.assign(mockDevice, {
    allowed: true,
    permission: 'granted',
    position: { coords: { latitude: 40.7, longitude: -74 } },
  });
});

// ── your saved locations ─────────────────────────────────────────────────────

test('with none saved: says one is needed, and Add waits for a pin on the map', async () => {
  await render(<CardMeetingLocation initialLocations={[]} onConfirm={jest.fn()} />);
  expect(screen.getByText('(1 location required to post)')).toBeTruthy();
  expect(screen.getByTestId('location-add')).toBeDisabled();
  await tapMap();
  expect(screen.getByTestId('pin-new')).toBeTruthy();
  expect(screen.getByTestId('location-add')).toBeEnabled();
});

test('adding one: drop a pin, name it (description optional), save the whole list', async () => {
  const onConfirm = jest.fn();
  await render(<CardMeetingLocation initialLocations={[spot('a', 'Library')]} onConfirm={onConfirm} />);
  await tapMap(37.25, -122.75);
  await fireEvent.press(screen.getByText('Location'));
  const name = screen.getByPlaceholderText('Name');
  expect(name.props.maxLength).toBe(TEXT_LIMITS.locationName);
  expect(screen.getByPlaceholderText('Description (optional)').props.maxLength).toBe(TEXT_LIMITS.locationDescription);

  await fireEvent.changeText(name, '   ');
  await fireEvent.press(icons('circle-check')[0]);
  expect(onConfirm).not.toHaveBeenCalled(); // needs a name

  await fireEvent.changeText(name, '  Park  ');
  await fireEvent.changeText(screen.getByPlaceholderText('Description (optional)'), ' by the fountain ');
  await fireEvent.press(icons('circle-check')[0]);
  expect(onConfirm).toHaveBeenCalledWith([
    spot('a', 'Library'),
    { id: expect.any(String), name: 'Park', description: 'by the fountain', latitude: 37.25, longitude: -122.75 },
  ]);
  expect(screen.queryByPlaceholderText('Name')).toBeNull();
  expect(screen.getByText('Park')).toBeTruthy();
});

test('cancelling the name saves nothing', async () => {
  const onConfirm = jest.fn();
  await render(<CardMeetingLocation initialLocations={[]} onConfirm={onConfirm} />);
  await tapMap();
  await fireEvent.press(screen.getByText('Location'));
  await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Park');
  await fireEvent.press(icons('circle-xmark')[0]);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.queryByPlaceholderText('Name')).toBeNull();
});

test('removing one saves the list without it', async () => {
  const onConfirm = jest.fn();
  await render(
    <CardMeetingLocation initialLocations={[spot('a', 'Library'), spot('b', 'Park')]} onConfirm={onConfirm} />,
  );
  await fireEvent.press(icons('circle-xmark')[0]);
  expect(onConfirm).toHaveBeenCalledWith([spot('b', 'Park')]);
  expect(screen.queryByText('Library')).toBeNull();
});

test('at three, no more can be added', async () => {
  await render(<CardMeetingLocation initialLocations={[spot('a', 'A'), spot('b', 'B'), spot('c', 'C')]} />);
  expect(screen.queryByText('Location')).toBeNull();
});

test('if saving fails and the screen puts the old list back, the card shows it too', async () => {
  const onConfirm = jest.fn();
  const { rerender } = await render(<CardMeetingLocation initialLocations={[]} onConfirm={onConfirm} />);
  await tapMap();
  await fireEvent.press(screen.getByText('Location'));
  await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Park');
  await fireEvent.press(icons('circle-check')[0]);
  expect(screen.getByText('Park')).toBeTruthy();
  // The screen showed it optimistically, then the save failed: back to none.
  await rerender(<CardMeetingLocation initialLocations={onConfirm.mock.calls[0][0]} onConfirm={onConfirm} />);
  await rerender(<CardMeetingLocation initialLocations={[]} onConfirm={onConfirm} />);
  expect(screen.queryByText('Park')).toBeNull();
  expect(screen.getByText('(1 location required to post)')).toBeTruthy();
});

// ── WHERE in a trade ─────────────────────────────────────────────────────────

test('picking a spot for WHERE: tap to pick, tap again to unpick; the map and editing are off', async () => {
  const onProposeLocation = jest.fn(),
    onConfirm = jest.fn();
  await render(
    <CardMeetingLocation
      initialLocations={[spot('a', 'Library')]}
      isSelectMode
      onProposeLocation={onProposeLocation}
      onConfirm={onConfirm}
    />,
  );
  expect(screen.queryByText('Location')).toBeNull();
  expect(icons('circle-xmark')).toHaveLength(0);
  await tapMap();
  expect(screen.queryByTestId('pin-new')).toBeNull();
  await fireEvent.press(icons('circle')[0]);
  expect(onProposeLocation).toHaveBeenLastCalledWith(spot('a', 'Library'));
  await fireEvent.press(icons('circle-check')[0]);
  expect(onProposeLocation).toHaveBeenLastCalledWith(null);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('a proposed spot is shown read-only, with a check', async () => {
  await render(<CardMeetingLocation initialLocations={[spot('a', 'Library')]} proposedLocation={spot('p', 'Cafe')} />);
  expect(screen.getByText('Meetup Location')).toBeTruthy();
  expect(screen.getByText('Cafe')).toBeTruthy();
  expect(screen.queryByText('Library')).toBeNull();
  expect(icons('circle-xmark')).toHaveLength(0);
});

test("someone else's spots: choose one (at most three are shown)", async () => {
  const onSelectLocation = jest.fn();
  const theirs = [spot('a', 'A'), spot('b', 'B'), spot('c', 'C'), spot('d', 'D')];
  await render(<CardMeetingLocation isUser={false} externalLocations={theirs} onSelectLocation={onSelectLocation} />);
  expect(screen.getByText('Safe Exchange Locations')).toBeTruthy();
  expect(screen.queryByText('D')).toBeNull();
  await fireEvent.press(icons('circle')[1]);
  expect(onSelectLocation).toHaveBeenLastCalledWith(spot('b', 'B'));
});

// ── where the map starts ─────────────────────────────────────────────────────

test('starts around your saved locations (without asking the phone where it is)', async () => {
  const Location = require('expo-location');
  Location.getForegroundPermissionsAsync.mockClear();
  await render(<CardMeetingLocation initialLocations={[spot('a', 'A', 37, -122), spot('b', 'B', 38, -121)]} />);
  await flush();
  expect(mockMap.props.initialRegion).toMatchObject({ latitude: 37.5, longitude: -121.5 });
  expect(Location.getForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(mockMap.animateToRegion).not.toHaveBeenCalledWith(
    expect.objectContaining({ latitude: 40.7 }),
    expect.anything(),
  );
});

test('with none saved: your area, if Location Services is on and allowed', async () => {
  await render(<CardMeetingLocation initialLocations={[]} />);
  await flush();
  expect(mockMap.animateToRegion).toHaveBeenCalledWith(
    expect.objectContaining({ latitude: 40.7, longitude: -74 }),
    300,
  );
});

test.each([
  ['Location Services off in settings', { allowed: false }],
  ['no permission on the phone', { permission: 'denied' }],
])('with none saved and %s: stays on the default (Santa Cruz)', async (_label, device) => {
  Object.assign(mockDevice, device);
  await render(<CardMeetingLocation initialLocations={[]} />);
  await flush();
  expect(mockMap.props.initialRegion).toMatchObject({ latitude: 36.9945, longitude: -122.0658 });
  expect(mockMap.animateToRegion).not.toHaveBeenCalled();
});

test('saved locations that arrive late move the map to them, once', async () => {
  const { rerender } = await render(<CardMeetingLocation initialLocations={[]} />);
  mockMap.animateToRegion.mockClear();
  await rerender(<CardMeetingLocation initialLocations={[spot('a', 'A', 39, -120)]} />);
  await flush();
  expect(mockMap.animateToRegion).toHaveBeenCalledWith(expect.objectContaining({ latitude: 39, longitude: -120 }), 300);
});
