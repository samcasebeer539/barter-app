import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  KeyboardEvent,
  Platform,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView, Edges } from 'react-native-safe-area-context';
import ProfileDeck from "@/components/DeckProfile";
import { colors } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Post, User, Locations } from '@/types/index';
import { getCurrentUser, updateUser } from '@/services/userService';
import { getUserPosts } from '@/services/postService';
import { getMyLocations, getUserLocations, saveMyLocations } from '@/services/locationService';
import { getOffererProfiles } from '@/services/offererService';
import { getIncomingOffers, IncomingOffer, declineTrade, getIncomingQueries, IncomingQuery, sendBarter } from '@/services/tradeService';
import { FeedProfile, OffererGroup } from '@/types/index';


const TOP_PADDING = 0;
const BOTTOM_PADDING = 20;

const SAFE_AREA_EDGES: Edges = Platform.OS === 'android' ? [] : ['top', 'right', 'bottom', 'left'];

// TODO: replace with the real secondary user's MongoDB _id from routing/auth.
// Leave empty to skip the secondary locations fetch until you have a real id —
// a fake id will cause ObjectId() to throw a 404 on the backend.
const SECONDARY_USER_ID = '';

// Pairs an offerer's profile with the gameId of their pending offer, so
// downstream components (ProfileDeck) never need to reverse-engineer which
// game a given group of cards belongs to.


// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const [primaryUser, setPrimaryUser] = useState<User | null>(null);
  const [primaryPosts, setPrimaryPosts] = useState<Post[]>([]);
  const [myLocations, setMyLocations] = useState<Locations[]>([]);
  const [theirLocations, setTheirLocations] = useState<Locations[]>([]);
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

  useEffect(() => {
    getIncomingOffers()
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
  useFocusEffect(useCallback(() => {
    // Your rating can change while you're away (someone reviews you).
    getCurrentUser()
      .then(fresh => setPrimaryUser(prev =>
        prev && (prev.rating !== fresh.rating || prev.reviewCount !== fresh.reviewCount)
          ? { ...prev, rating: fresh.rating, reviewCount: fresh.reviewCount }
          : prev
      ))
      .catch(err => console.warn('Failed to refresh rating:', err));

    getUserPosts()
      .then(fresh => {
        const lockById = new Map(fresh.map(p => [p._id, !!p.inTrade]));
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
      })
      .catch(err => console.warn('Failed to refresh post lock state:', err));
  }, []));

  useEffect(() => {
    const load = async () => {
      // ── Core data: must succeed for screen to render ──────────────────────
      try {
        const [user, posts] = await Promise.all([getCurrentUser(), getUserPosts()]);
        setPrimaryUser(user);
        setPrimaryPosts(posts);
      } catch (err: any) {
        console.error('Failed to load core profile data:', err);
        setError(err.message ?? 'Unknown error');
        return;
      }

      // ── My locations: non-fatal ───────────────────────────────────────────
      try {
        const myLocs = await getMyLocations();
        setMyLocations(myLocs);
      } catch (err) {
        console.warn('Could not load my locations:', err);
      }

      // ── Their locations: only fetch if we have a valid MongoDB _id ────────
      if (SECONDARY_USER_ID) {
        try {
          const theirLocs = await getUserLocations(SECONDARY_USER_ID);
          setTheirLocations(theirLocs);
        } catch (err) {
          console.warn('Could not load their locations:', err);
        }
      }
    };

    load();
  }, []);

  const handleSaveUser = async (updated: User) => {
    try {
      await updateUser(updated);
      setPrimaryUser(updated);
    } catch (err) {
      console.error('Failed to save user:', err);
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
      console.error('Failed to save locations:', err);
      setMyLocations(previous); // revert on failure
    }
  };

  const handleSelectLocation = (location: Locations | null) => {
    // Wire into your trade/offer submission flow here
    console.log('Selected meetup location:', location);
  };

  const handleBarterSubmit = async (gameId: string, selectedPostIds: string[]) => {
	if (!gameId || selectedPostIds.length === 0) return;
	try {
		await sendBarter(gameId, selectedPostIds);
	} catch (err) {
		console.error('Barter failed:', err);
		return;
	}

	removeOfferer(gameId);
	};

	const handleDeclineSubmit = async (gameId: string) => {
		try {
			await declineTrade(gameId);
		} catch (err) {
			console.error('Decline failed:', err);
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

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Scroll only as far as needed to keep the field you're typing in just
    // above the keyboard; fields the keyboard won't cover don't move the page.
    // (Scrolling by the full keyboard height overshot fields near the top,
    // then bounced back where the page couldn't scroll that far.)
    const KEYBOARD_GAP = 16;
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      const keyboardTop = e.endCoordinates.screenY;
      const input = TextInput.State.currentlyFocusedInput();
      if (!input) return;
      // Wait a beat for the extra bottom padding to lay out.
      setTimeout(() => {
        input.measureInWindow((_x, y, _w, h) => {
          const overlap = y + h + KEYBOARD_GAP - keyboardTop;
          if (overlap > 0) {
            scrollViewRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
          }
        });
      }, 50);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const [incomingQueries, setIncomingQueries] = useState<IncomingQuery[]>([]);

  const refreshIncomingQueries = useCallback(() => {
    return getIncomingQueries()
      .then(setIncomingQueries)
      .catch(err => console.warn('Failed to load incoming queries:', err));
  }, []);

  useEffect(() => {
    refreshIncomingQueries();
  }, [refreshIncomingQueries]);

	const queriesForTopPost = topPost?._id
	? incomingQueries.filter(q => q.targetPostId === topPost._id)
	: [];

  // Pull to refresh, like the feed: reload everything on the profile. A new
  // post you haven't saved yet stays at the front of the deck.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getCurrentUser()
          .then(setPrimaryUser)
          .catch(err => console.warn('Failed to refresh profile:', err)),
        getUserPosts()
          .then(fresh => setPrimaryPosts(prev => [...prev.filter(p => !p._id), ...fresh]))
          .catch(err => console.warn('Failed to refresh posts:', err)),
        getIncomingOffers()
          .then(async offers => {
            const ids = [...new Set(offers.map(o => o.fromUserId))];
            const profiles = await getOffererProfiles(ids);
            setOffererProfiles(profiles);
            setIncomingOffers(offers);
          })
          .catch(err => console.warn('Failed to refresh incoming offers:', err)),
        refreshIncomingQueries(),
        getMyLocations()
          .then(setMyLocations)
          .catch(err => console.warn('Failed to refresh locations:', err)),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshIncomingQueries]);

  if (error) return (
    <SafeAreaView style={styles.container} edges={SAFE_AREA_EDGES}>
      <Text style={{ color: 'red', padding: 20 }}>Error: {error}</Text>
    </SafeAreaView>
  );

  // A plain spinner in the refresh spinners' color. (Not a RefreshControl:
  // unmounting one mid-refresh left iOS's refresh inset on the scroll view
  // React Native reused for the profile, so its pull-to-refresh fired at once.)
  if (!primaryUser) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={colors.ui.secondarydisabled} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={SAFE_AREA_EDGES}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: keyboardHeight > 0 ? BOTTOM_PADDING + keyboardHeight : 0 },
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ui.secondarydisabled}
          />
        }
      >
        <View style={styles.topSpacer} />
        <View style={styles.deckWrapper}>
          <ProfileDeck
            posts={primaryPosts}
            primaryUser={primaryUser}
            secondaryOfferers={secondaryOfferers}
            initialLocations={myLocations}
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
            incomingOffers={offersForTopPost}
          />
        </View>
      </ScrollView>

      <View style={styles.settingsButtonRow}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            router.push('/settings');
        }}
        >
          <FontAwesome6 name="gear" size={22} color={colors.ui.secondarydisabled} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ui.background,
  },
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