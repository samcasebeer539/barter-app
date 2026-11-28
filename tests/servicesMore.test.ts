// The last small services: the settings cache (fetched once, shared), the
// profile page and offerer profiles (server -> app shapes).
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(), apiJsonIfChanged: jest.fn() }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/firebase', () => ({ auth: {}, storage: {} }));

beforeEach(() => jest.resetModules());
// A fresh copy of a module (its cache starts empty), with the fake server
// it talks to.
const fresh = <T>(path: string): T & { api: jest.Mock; ifChanged: jest.Mock } => {
  let mod: any, fake: any;
  jest.isolateModules(() => {
    fake = require('@/lib/api');
    mod = require(path);
  });
  return Object.assign({}, mod, { api: fake.apiJson, ifChanged: fake.apiJsonIfChanged });
};

// ── settings cache ───────────────────────────────────────────────────────────

test('settings are fetched once, even when asked for at the same time, then remembered', async () => {
  const { getSettings, api: api2 } = fresh<typeof import('@/lib/settingsCache')>('@/lib/settingsCache');
  let release!: (v: unknown) => void;
  api2.mockImplementationOnce(
    () =>
      new Promise(r => {
        release = r;
      }),
  );
  const a = getSettings(),
    b = getSettings();
  release({ is_location_allowed: false, notifications_enabled: true });
  expect(await a).toEqual({ locationAllowed: false, notificationsEnabled: true });
  expect(await b).toBe(await a);
  await getSettings();
  expect(api2).toHaveBeenCalledTimes(1);
  expect(api2).toHaveBeenCalledWith('/settings');
});

test('changing a setting updates what is remembered; a failed fetch is tried again next time', async () => {
  const cache = fresh<typeof import('@/lib/settingsCache')>('@/lib/settingsCache');
  const api2 = cache.api;
  api2.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({});
  await expect(cache.getSettings()).rejects.toThrow('offline');
  await expect(cache.getSettings()).resolves.toEqual({ locationAllowed: true, notificationsEnabled: true });
  cache.updateSettingsCache({ notificationsEnabled: false });
  await expect(cache.getSettings()).resolves.toEqual({ locationAllowed: true, notificationsEnabled: false });
});

// ── profile page ─────────────────────────────────────────────────────────────

test('profile page: server -> app shapes, with its version', async () => {
  const { getProfilePage, ifChanged } = fresh<typeof import('@/services/profileService')>('@/services/profileService');
  ifChanged.mockResolvedValue({
    changed: true,
    version: 'v7',
    data: {
      user: { _id: 'me', first_name: 'Ana', profile_photo: 'https://x/p.jpg' },
      posts: [{ _id: 'p', post_title: 'Lamp', in_trade: true }],
      offererProfiles: { bob: { user: { _id: 'bob', first_name: 'Bob' }, posts: [{ _id: 'c', post_title: 'Chair' }] } },
      settings: { is_location_allowed: false, notifications_enabled: true },
    },
  });
  const page = await getProfilePage('v6');
  expect(ifChanged).toHaveBeenCalledWith('/dev/profile_page', 'v6');
  expect(page).toMatchObject({
    version: 'v7',
    user: { _id: 'me', profileImageUrl: 'https://x/p.jpg' },
    posts: [{ _id: 'p', name: 'Lamp', inTrade: true }],
    locations: [],
    incomingOffers: [],
    incomingQueries: [],
    offererProfiles: { bob: { user: { first_name: 'Bob' }, posts: [{ name: 'Chair' }] } },
    settings: { locationAllowed: false, notificationsEnabled: true },
  });
});

test('profile page: null when nothing changed', async () => {
  const { getProfilePage, ifChanged } = fresh<typeof import('@/services/profileService')>('@/services/profileService');
  ifChanged.mockResolvedValue({ changed: false });
  await expect(getProfilePage('v7')).resolves.toBeNull();
});

// ── offerer profiles ─────────────────────────────────────────────────────────

test("offerers' profiles: one request for all of them; none needed for no one", async () => {
  const { getOffererProfiles, api: api2 } =
    fresh<typeof import('@/services/offererService')>('@/services/offererService');
  await expect(getOffererProfiles([])).resolves.toEqual({});
  expect(api2).not.toHaveBeenCalled();
  api2.mockResolvedValue({ bob: { user: { _id: 'bob', first_name: 'Bob', rating: 4 }, posts: [] } });
  const found = await getOffererProfiles(['bob', 'cara']);
  expect(api2).toHaveBeenCalledWith('/dev/profiles?ids=bob,cara');
  expect(found.bob.user).toMatchObject({ _id: 'bob', first_name: 'Bob', rating: 4, reviewCount: 0, locations: [] });
  expect(found.cara).toBeUndefined();
});

test('signing out forgets the settings: the next account fetches its own', async () => {
  const cache = fresh<typeof import('@/lib/settingsCache')>('@/lib/settingsCache');
  cache.setSettingsCache({ locationAllowed: false, notificationsEnabled: false });
  cache.clearSettingsCache();
  cache.api.mockResolvedValueOnce({});
  await expect(cache.getSettings()).resolves.toEqual({ locationAllowed: true, notificationsEnabled: true });
  expect(cache.api).toHaveBeenCalledWith('/settings');
});
