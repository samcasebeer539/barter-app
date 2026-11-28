import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  RefreshControl,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, Edges, useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileDeck from "@/components/DeckProfile";
import { colors } from '@/styles/globalStyles';
import { deckStyles, barRadius, DECK_BAR_WIDTH } from '@/styles/deckStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Post, User, Locations, FeedProfile, OffererGroup } from '@/types/index';
import { updateUser } from '@/services/userService';
import { getProfilePage } from '@/services/profileService';
import { setSettingsCache } from '@/lib/settingsCache';
import { onBlockChange } from '@/lib/safety';
import { useKeyboardLift, KeyboardLiftContext } from '@/hooks/useKeyboardLift';
import { saveMyLocations } from '@/services/locationService';
import { getOffererProfiles } from '@/services/offererService';
import { getIncomingOffers, IncomingOffer, declineTrade, getIncomingQueries, IncomingQuery, sendBarter } from '@/services/tradeService';
import { showError } from '@/lib/errors';


const TOP_PADDING = 0;
// How far the back card of a deck sits from the front one (Deck's SLOT_POSITIONS).
const DECK_STACK_OFFSET = 12;
// The deck container's left margin (Deck's deckContainer style).
const DECK_MARGIN_LEFT = 24;
// Longest the skeleton waits for the deck's images before showing it anyway.
const DECK_READY_TIMEOUT_MS = 4000;

// Loads the images visible when the profile first appears (your photo on
// the front card, the first posts' photos peeking out behind it) into the
// image cache, so they're there the moment the deck shows.
function prefetchDeckImages(user: User, posts: Post[]): Promise<void> {
  const urls = [user.profileImageUrl, ...posts.slice(0, 3).map(p => p.photos?.[0])]
    .filter((u): u is string => !!u && /^https?:/.test(u));
  if (urls.length === 0) return Promise.resolve();
  return Image.prefetch(urls, 'memory-disk').catch(() => false).then(() => undefined);
}
const BOTTOM_PADDING = 20;

const SAFE_AREA_EDGES: Edges = Platform.OS === 'android' ? [] : ['top', 'right', 'bottom', 'left'];

// Pairs an offerer's profile with the gameId of their pending offer, so
// downstream components (ProfileDeck) never need to reverse-engineer which
// game a given group of cards belongs to.


// ─── Screen ───────────────────────────────────────────────────────────────────

// The profile's layout as plain shapes: the QUERIES / OFFERS bars, the deck
// as one box the size of its outer bounds (front card plus the offset cards
// behind it), the add / delete / count bar row, and the settings button.
function ProfileSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 36, 400);           // as in DeckProfile
  const deckWidth = cardWidth + DECK_STACK_OFFSET;
  const deckHeight = cardWidth * (3.5 / 2.5) + DECK_STACK_OFFSET;

  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.scroll, { opacity }]}>
      <View style={styles.topSpacer} />
      <View style={styles.deckWrapper}>
        <View style={styles.skeletonColumn}>
          <View style={[deckStyles.itemCountRow, { marginBottom: 8 }]}>
            <View style={[styles.skeletonBar, barRadius.leftCap]} />
            <View style={[styles.skeletonBar, barRadius.rightCap]} />
          </View>
          <View style={styles.skeletonDeckColumn}>
            {/* Same offsets as the real deck (deckWrapper's left shift plus
                the deck container's left margin). */}
            <View style={deckStyles.deckWrapper}>
              <View style={[styles.skeletonBlock, { width: deckWidth, height: deckHeight, marginLeft: DECK_MARGIN_LEFT }]} />
            </View>
            <View style={styles.skeletonButtonRow}>
              <View style={[styles.skeletonBlock, styles.skeletonIconButton, barRadius.bottomLeftCap]} />
              <View style={[styles.skeletonBlock, styles.skeletonIconButton, barRadius.flat]} />
              <View style={[styles.skeletonBlock, styles.skeletonCountBar, barRadius.bottomRightCap]} />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const [primaryUser, setPrimaryUser] = useState<User | null>(null);
  const [primaryPosts, setPrimaryPosts] = useState<Post[]>([]);

  // The deck stays hidden behind the skeleton until it's fully ready: your
  // data, saved locations and visible images loaded, laid out, and a couple
  // of frames drawn (so card shadows are on). Never longer than the timeout.
  const [deckReady, setDeckReady] = useState(false);
  const [deckImagesLoaded, setDeckImagesLoaded] = useState(false);
  const [deckLaidOut, setDeckLaidOut] = useState(false);
  // null until loaded from the server.
  const [myLocations, setMyLocations] = useState<Locations[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  
  // ── Incoming offers (across all of this user's posts) ──────────────────────
  const [incomingOffers, setIncomingOffers] = useState<IncomingOffer[]>([]);
  const [topPrimaryPostIndex, setTopPrimaryPostIndex] = useState<number | null>(null);
  // Offerer profiles, cached by user id. Fetched in one batch for every
  // offer on any of your posts, so swiping between posts reads from here
  // instead of hitting the server.
  const [offererProfiles, setOffererProfiles] = useState<Record<string, FeedProfile>>({});

  const topPost = topPrimaryPostIndex !== null ? primaryPosts[topPrimaryPostIndex] : null;

  const offersForTopPost = topPost?._id
    ? incomingOffers.filter(o => o.targetPostId === topPost._id)
    : [];

  const refreshIncomingOffers = useCallback(() => {
    return getIncomingOffers()
      .then(setIncomingOffers)
      .catch(err => console.warn('Failed to load incoming offers:', err));
  }, []);

  // Fetch, in one request, any offerers not cached yet (new offers).
  useEffect(() => {
    const missing = [...new Set(incomingOffers.map(o => o.fromUserId))].filter(id => !offererProfiles[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    getOffererProfiles(missing)
      .then(found => { if (!cancelled) setOffererProfiles(prev => ({ ...prev, ...found })); })
      .catch(err => console.warn('Failed to load offerer profiles:', err));
    return () => { cancelled = true; };
  }, [incomingOffers, offererProfiles]);

  // The top post's offerers, straight from the cache. Keyed on the offers'
  // game ids so the array (and the deck) only changes when they do.
  const topOffersKey = offersForTopPost.map(o => o.gameId).join(',');
  const secondaryOfferers: OffererGroup[] = useMemo(
    () => offersForTopPost.flatMap(offer => {
      const profile = offererProfiles[offer.fromUserId];
      return profile ? [{ gameId: offer.gameId, profile }] : [];
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topOffersKey, offererProfiles]
  );

  // Posts can join or leave trades while you're elsewhere in the app, so
  // recheck which are locked each time the profile comes into view. Only
  // the lock flags change (and only if they differ), so the deck keeps its
  // place and any unsaved new post stays put.
  // The first time the profile comes into view, the page load above has
  // just fetched all of this, so it's skipped (it used to fetch your user and
  // posts a second time at startup).
  const hasFocusedOnce = useRef(false);
  // Version of the profile we have; the server sends nothing if it's current.
  const profileVersion = useRef('');
  useFocusEffect(useCallback(() => {
    if (!hasFocusedOnce.current) {
      hasFocusedOnce.current = true;
      return;
    }
    getProfilePage(profileVersion.current)
      .then(page => {
        if (!page) return; // nothing changed while you were away
        profileVersion.current = page.version;
        setSettingsCache(page.settings);
        // Your rating can change while you're away (someone reviews you).
        setPrimaryUser(prev =>
          prev && (prev.rating !== page.user.rating || prev.reviewCount !== page.user.reviewCount)
            ? { ...prev, rating: page.user.rating, reviewCount: page.user.reviewCount }
            : prev
        );
        // Only the lock flags change (and only if they differ), so the deck
        // keeps its place and any unsaved new post stays put.
        const lockById = new Map(page.posts.map(p => [p._id, !!p.inTrade]));
        setPrimaryPosts(prev => {
          let changed = false;
          const next = prev.map(p => {
            const locked = p._id ? lockById.get(p._id) : undefined;
            if (locked === undefined || locked === !!p.inTrade) return p;
            changed = true;
            return { ...p, inTrade: locked };
          });
          return changed ? next : prev;
        });
        // New offers and questions that came in while you were away.
        setOffererProfiles(prev => ({ ...prev, ...page.offererProfiles }));
        setIncomingOffers(page.incomingOffers);
        setIncomingQueries(page.incomingQueries);
      })
      .catch(err => console.warn('Failed to refresh profile:', err));
  }, []));

  useEffect(() => {
    const load = async () => {
      // ── Everything on the profile, in one request ─────────────────────────
      try {
        const page = (await getProfilePage())!;
        profileVersion.current = page.version;
        // Your settings ride along, so the settings screen and the maps'
        // centering don't need to fetch them.
        setSettingsCache(page.settings);
        // Profiles before offers, so the offers never wait on a profile fetch.
        setOffererProfiles(page.offererProfiles);
        setIncomingOffers(page.incomingOffers);
        setIncomingQueries(page.incomingQueries);
        setMyLocations(page.locations);
        setPrimaryPosts(page.posts);
        setPrimaryUser(page.user);
        prefetchDeckImages(page.user, page.posts).then(() => setDeckImagesLoaded(true));
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err.message ?? 'Unknown error');
        return;
      }

    };

    load();
  }, []);

  const handleSaveUser = async (updated: User) => {
    try {
      await updateUser(updated);
      setPrimaryUser(updated);
    } catch (err) {
      showError("Couldn't save your profile", err);
    }
  };

  const handlePostsChange = (updated: Post[]) => {
    setPrimaryPosts(updated);
  };

  const handleConfirmLocations = async (updated: Locations[]) => {
    const previous = myLocations;
    setMyLocations(updated); // optimistic
    try {
      await saveMyLocations(updated);
    } catch (err) {
      showError("Couldn't save your locations", err);
      setMyLocations(previous); // revert on failure
    }
  };

  const handleSelectLocation = (location: Locations | null) => {
    // Wire into your trade/offer submission flow here
  };

  const handleBarterSubmit = async (gameId: string, selectedPostIds: string[]) => {
	if (!gameId || selectedPostIds.length === 0) return;
	try {
		await sendBarter(gameId, selectedPostIds);
	} catch (err) {
		showError("That barter didn't go through", err);
		return;
	}

	removeOfferer(gameId);
	};

	const handleDeclineSubmit = async (gameId: string) => {
		try {
			await declineTrade(gameId);
		} catch (err) {
			showError("Couldn't decline the offer", err);
			return;
		}

		removeOfferer(gameId);
	};

	// Shared by both barter and decline — once a game leaves the deck, drop it
	// from local state, and auto-close the reveal if that was the last offerer
	// left, so the deck doesn't sit open showing nothing.
	// The offerer list is derived from incomingOffers, so dropping the offer
	// removes them.
	const removeOfferer = (gameId: string) => {
	if (offersForTopPost.every(o => o.gameId === gameId)) {
		setIsDeckRevealed(false);
	}
	setIncomingOffers(prev => prev.filter(o => o.gameId !== gameId));
	};

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  // Keeps the field you're typing in visible above the keyboard (shared with
  // the barter page and feed deck; see hooks/useKeyboardLift).
  const insets = useSafeAreaInsets();
  const keyboardLift = useKeyboardLift(scrollViewRef, scrollY, insets.top);
  const keyboardHeight = keyboardLift.keyboardHeight;

  const [incomingQueries, setIncomingQueries] = useState<IncomingQuery[]>([]);

  const refreshIncomingQueries = useCallback(() => {
    return getIncomingQueries()
      .then(setIncomingQueries)
      .catch(err => console.warn('Failed to load incoming queries:', err));
  }, []);

	const queriesForTopPost = topPost?._id
	? incomingQueries.filter(q => q.targetPostId === topPost._id)
	: [];

  // Pull to refresh, like the feed: reload everything on the profile. A new
  // post you haven't saved yet stays at the front of the deck.
  const [refreshing, setRefreshing] = useState(false);
  const reloadProfile = useCallback(async () => {
    try {
      const page = await getProfilePage(profileVersion.current);
      if (!page) return; // already up to date
      profileVersion.current = page.version;
      setSettingsCache(page.settings);
      setPrimaryUser(page.user);
      setPrimaryPosts(prev => [...prev.filter(p => !p._id), ...page.posts]);
      setOffererProfiles(page.offererProfiles);
      setIncomingOffers(page.incomingOffers);
      setIncomingQueries(page.incomingQueries);
      setMyLocations(page.locations);
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadProfile();
    } finally {
      setRefreshing(false);
    }
  }, [reloadProfile]);

  // Blocking someone declines their offers and questions: reload.
  useEffect(() => onBlockChange(() => { reloadProfile(); }), [reloadProfile]);

  useEffect(() => {
    if (deckReady || !primaryUser || !deckImagesLoaded || myLocations === null || !deckLaidOut) return;
    let cancelled = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!cancelled) setDeckReady(true); }));
    return () => { cancelled = true; };
  }, [deckReady, primaryUser, deckImagesLoaded, myLocations, deckLaidOut]);
  useEffect(() => {
    if (!primaryUser || deckReady) return;
    const t = setTimeout(() => setDeckReady(true), DECK_READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [primaryUser, deckReady]);

  if (error) return (
    <SafeAreaView style={styles.container} edges={SAFE_AREA_EDGES}>
      <Text style={{ color: 'red', padding: 20 }}>Error: {error}</Text>
    </SafeAreaView>
  );

  // Loading: plain pulsing shapes in the profile's layout, like the feed's
  // skeleton, so nothing jumps when it loads. (No RefreshControl here:
  // unmounting one mid-refresh left iOS's refresh inset on the scroll view
  // React Native reused for the profile, so its pull-to-refresh fired at once.)
  // The SafeAreaView and settings row stay mounted from loading to loaded;
  // only the middle swaps. (Swapping the whole screen gave the new
  // SafeAreaView a frame without its top inset, so the deck appeared at the
  // top of the screen and then jumped down.)
  return (
    <KeyboardLiftContext.Provider value={keyboardLift.context}>
    <SafeAreaView style={styles.container} edges={SAFE_AREA_EDGES}>
      <View style={styles.body}>
      {primaryUser && (
      <ScrollView
        ref={scrollViewRef}
        // Mounted (so it lays out and loads) but invisible until ready.
        style={[styles.scroll, !deckReady && styles.hidden]}
        pointerEvents={deckReady ? 'auto' : 'none'}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: keyboardHeight > 0 ? BOTTOM_PADDING + keyboardHeight : 0 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        onContentSizeChange={keyboardLift.onContentSizeChange}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ui.secondarydisabled}
          />
        }
      >
        <View style={styles.topSpacer} />
        <View style={styles.deckWrapper} onLayout={() => setDeckLaidOut(true)}>
          <ProfileDeck
            posts={primaryPosts}
            primaryUser={primaryUser}
            secondaryOfferers={secondaryOfferers}
            initialLocations={myLocations ?? undefined}
            onConfirmLocations={handleConfirmLocations}
            onSelectLocation={handleSelectLocation}
            onToggleReveal={() => setIsDeckRevealed(prev => !prev)}
            toggleEnabled={true}
            isDeckRevealed={isDeckRevealed}
            onSaveUser={handleSaveUser}
            onPostsChange={handlePostsChange}
            onTopPrimaryPostChange={setTopPrimaryPostIndex}
            hasIncomingOffers={offersForTopPost.length > 0}
            onBarterSubmit={handleBarterSubmit}
            onDeclineSubmit={handleDeclineSubmit}
            incomingQueries={queriesForTopPost}
            onQueryAnswered={refreshIncomingQueries}
            onQueryAsked={refreshIncomingOffers}
            incomingOffers={offersForTopPost}
            totalQueryCount={incomingQueries.length}
            totalOfferCount={incomingOffers.length}
          />
        </View>
      </ScrollView>
      )}
      {!deckReady && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ProfileSkeleton />
        </View>
      )}
      </View>

      <View style={styles.settingsButtonRow}>
        <TouchableOpacity
          style={styles.settingsButton}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => {
            router.push('/settings');
        }}
        >
          <FontAwesome6 name="gear" size={22} color={colors.ui.secondarydisabled} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </KeyboardLiftContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  body: { flex: 1 },
  hidden: { opacity: 0 },
  // ── Loading skeleton (sizes match DeckProfile) ──
  skeletonColumn: { width: '100%', maxWidth: 400, alignItems: 'center' },
  skeletonDeckColumn: { width: '100%', alignItems: 'center', gap: 8 },
  skeletonBlock: { backgroundColor: colors.ui.secondary, borderRadius: 2 },
  skeletonBar: { flex: 1, height: 36, backgroundColor: colors.ui.secondary },
  skeletonButtonRow: { width: DECK_BAR_WIDTH, flexDirection: 'row', gap: 4 },
  skeletonIconButton: { width: 50, height: 44 },
  skeletonCountBar: { flex: 1, height: 44 },
  scroll: {
    flex: 1,
    marginBottom: -8,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 0,
  },
  topSpacer: {
    height: TOP_PADDING,
  },
  deckWrapper: {
    alignItems: 'center',
  },
  settingsButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 38,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: colors.ui.background,
  },
  settingsButton: {
    flex: 1,
    height: 36,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});