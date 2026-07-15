import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import DecksProfile from '@/components/DeckProfile';
import { colors } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post, User, Locations } from '@/types/index';
import { getCurrentUser, updateUser } from '@/services/userService';
import { getUserPosts } from '@/services/postService';
import { getMyLocations, getUserLocations, saveMyLocations } from '@/services/locationService';
import { getOffererProfile } from '@/services/offererService';
import { getIncomingOffers, IncomingOffer, declineTrade, getIncomingQueries, IncomingQuery } from '@/services/tradeService';
import { FeedProfile, OffererGroup } from '@/types/index';
import { getAuth } from 'firebase/auth';


const TOP_PADDING = 0;
const BOTTOM_PADDING = 20;

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
  const [secondaryOfferers, setSecondaryOfferers] = useState<OffererGroup[]>([]);

  const topPost = topPrimaryPostIndex !== null ? primaryPosts[topPrimaryPostIndex] : null;

  const offersForTopPost = topPost?._id
    ? incomingOffers.filter(o => o.targetPostId === topPost._id)
    : [];

  useEffect(() => {
    getIncomingOffers()
      .then(setIncomingOffers)
      .catch(err => console.warn('Failed to load incoming offers:', err));
  }, []);

  useEffect(() => {
    if (offersForTopPost.length === 0) {
      setSecondaryOfferers([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      offersForTopPost.map(offer =>
        getOffererProfile(offer.fromUserId).then(profile => ({ gameId: offer.gameId, profile }))
      )
    )
      .then(groups => { if (!cancelled) setSecondaryOfferers(groups); })
      .catch(err => console.warn('Failed to load offerer profiles:', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offersForTopPost.map(o => o.gameId).join(',')]);

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

  async function getAuthHeader() {
    const token = await getAuth().currentUser?.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  const handleBarterSubmit = async (gameId: string, selectedPostIds: string[]) => {
	if (!gameId || selectedPostIds.length === 0) return;
	try {
		const headers = await getAuthHeader();
		await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/barter`, {
		method: 'POST',
		headers: { ...headers, 'Content-Type': 'application/json' },
		body: JSON.stringify({ gameId, selectedPostIds }),
		});
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
	const removeOfferer = (gameId: string) => {
	setSecondaryOfferers(prev => {
		const next = prev.filter(o => o.gameId !== gameId);
		if (next.length === 0) {
		setIsDeckRevealed(false);
		}
		return next;
	});
	setIncomingOffers(prev => prev.filter(o => o.gameId !== gameId));
	};

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      const kbHeight = e.endCoordinates.height;
      setKeyboardHeight(kbHeight);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollY.current + kbHeight,
          animated: true,
        });
      }, 50);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const [incomingQueries, setIncomingQueries] = useState<IncomingQuery[]>([]);

	useEffect(() => {
	getIncomingQueries()
		.then(setIncomingQueries)
		.catch(err => console.warn('Failed to load incoming queries:', err));
	}, []);

	const queriesForTopPost = topPost?._id
	? incomingQueries.filter(q => q.targetPostId === topPost._id)
	: [];

  if (error) return (
    <SafeAreaView style={styles.container}>
      <Text style={{ color: 'red', padding: 20 }}>Error: {error}</Text>
    </SafeAreaView>
  );

  if (!primaryUser) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconContainer}>
        <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
      >
        <View style={styles.topSpacer} />
        <View style={styles.deckWrapper}>
          <DecksProfile
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
          />
        </View>
      </ScrollView>

      <View style={styles.settingsButtonRow}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
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
  loadingIconContainer: {
    height: 44,
    width: 44,
    borderRadius: 36,
    backgroundColor: colors.ui.secondary,
    alignItems: 'center',
    justifyContent: 'center',
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