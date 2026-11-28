import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TRADE_ACTIONS, TradeActionType } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { getFeedProfile } from '@/services/feedService';
import { FeedProfile, Post, User, Locations } from '@/types/index';
import { sendOffer, sendQuery, addPost } from '@/services/tradeService';
import { useTradeAction } from '../hooks/useTradeAction';
import { useKeyboardLift, KeyboardLiftContext } from '../hooks/useKeyboardLift';
import { useStableCallback } from '../hooks/useStableCallback';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { showError } from '@/lib/errors';
import { pad2 } from '@/lib/format';

const { width, height } = Dimensions.get('window');
const BOTTOM_BASE = 140;

interface FeedDeckProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
  prefetchedProfile?: FeedProfile | null;
  onQuerySubmit?: (payload: { postIndex: number | null; question: string }) => void;
  // ── ADD mode (opened from a trade deck) ─────────────────────────────────
  // With addGameId set, the wheel shows only ADD: select one of this
  // person's posts and play adds it to that game.
  addGameId?: string;
  /** Posts to leave out of the deck, e.g. ones already in the trade. */
  excludePostIds?: string[];
  /** Fired after ADD succeeds (the deck then closes itself). */
  onAdded?: () => void;
  onAddFailed?: (err: unknown) => void;
}

export default function FeedDeck({
  postId,
  visible,
  onClose,
  prefetchedProfile,
  onQuerySubmit,
  addGameId,
  excludePostIds,
  onAdded,
  onAddFailed,
}: FeedDeckProps) {
  const deckTranslateY = useRef(new Animated.Value(height)).current;
  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(0);
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const insets = useSafeAreaInsets();
  const MAX_SCROLL_HEIGHT = height - BOTTOM_BASE - insets.top;

  const isAddMode = !!addGameId;
  const feedActions = useMemo(
    () => TRADE_ACTIONS.filter(a => (isAddMode ? ['add'] : ['offer', 'query']).includes(a.actionType)),
    [isAddMode],
  );

  const trade = useTradeAction();

  const [scrolledActionType, setScrolledActionType] = useState<TradeActionType | null>(
    feedActions[0]?.actionType ?? null,
  );

  const [queryText, setQueryText] = useState('');

  const isOfferActive = trade.activeAction === 'offer' && scrolledActionType === 'offer' && trade.phase !== 'confirmed';

  const isAddActive = trade.activeAction === 'add' && scrolledActionType === 'add' && trade.phase !== 'confirmed';

  const isQueryActive =
    trade.activeAction === 'query' &&
    scrolledActionType === 'query' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';

  // A feed question is always about the post on top: it follows the deck as
  // you swipe, and with the user or location card on top there's nothing to
  // ask about, so QUERY is greyed out and can't be sent.
  const queryPostIndex = isQueryActive ? topPostIndex : null;
  // Swiping to a user or location card turns QUERY off (closing the box):
  // there's no post to ask about.
  useEffect(() => {
    if (trade.activeAction === 'query' && topPostIndex === null) trade.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topPostIndex]);
  const effectiveIsReady =
    trade.activeAction === 'query' ? topPostIndex !== null && queryText.trim().length > 0 : trade.isReady;

  useEffect(() => {
    if (!isQueryActive) setQueryText('');
  }, [isQueryActive]);

  const deckUser: User | undefined = profile?.user;
  const excluded = useMemo(() => new Set(excludePostIds ?? []), [excludePostIds]);
  // Memoized so the deck's cards aren't rebuilt on every render (e.g. each
  // keystroke in the question box).
  const deckPosts: Post[] = useMemo(
    () =>
      profile
        ? profile.posts
            .filter(p => !p._id || !excluded.has(p._id))
            .map(p => ({
              _id: p._id,
              name: p.name,
              description: p.description,
              photos: p.photos,
              date_posted: p.date_posted,
            }))
        : [],
    [profile, excluded],
  );
  const externalLocations: Locations[] = useMemo(() => profile?.user?.locations ?? [], [profile]);
  const deckGroups = useMemo(
    () => (deckUser ? [{ user: deckUser, posts: deckPosts, locations: externalLocations }] : []),
    [deckUser, deckPosts, externalLocations],
  );
  const postCount = deckPosts.length;

  const [jumpToken, setJumpToken] = useState<number | undefined>(undefined);
  const [jumpToIndex, setJumpToIndex] = useState(0);
  const jumpCounterRef = useRef(0);

  useEffect(() => {
    if (!postId) return;
    const applyProfile = (data: FeedProfile) => {
      setProfile(data);
      const shown = data.posts.filter(p => !p._id || !excluded.has(p._id));
      const idx = shown.findIndex(p => p._id === data.tappedPostId);
      jumpCounterRef.current += 1;
      setJumpToIndex(idx >= 0 ? 2 + idx : 2);
      setJumpToken(jumpCounterRef.current);
    };
    if (prefetchedProfile) {
      setProfile(null);
      applyProfile(prefetchedProfile);
    } else {
      setIsLoading(true);
      setProfile(null);
      getFeedProfile(postId)
        .then(applyProfile)
        .catch(err => console.error('FeedDeck profile load error:', err))
        .finally(() => setIsLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per post; a changed exclude list doesn't refetch the profile.
  }, [postId, prefetchedProfile]);

  // Keeps the field you're typing in visible above the keyboard (shared with
  // the profile and barter page; see hooks/useKeyboardLift).
  const keyboardLift = useKeyboardLift(scrollViewRef, scrollY, insets.top);
  const keyboardHeight = keyboardLift.keyboardHeight;

  // The open animation waits until the deck has been laid out and a frame
  // drawn. Starting it as the modal was asked to appear meant part of it ran
  // while the modal and deck were still being built (a varying amount each
  // time), so the visible slide looked faster on some opens than others.
  const pendingOpen = useRef(false);
  const openBackstop = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (openBackstop.current) clearTimeout(openBackstop.current);
    },
    [],
  );
  const startOpenAnimation = () => {
    if (!pendingOpen.current) return;
    pendingOpen.current = false;
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(deckTranslateY, { toValue: 0, useNativeDriver: true, duration: 440 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    if (visible) {
      deckTranslateY.setValue(height);
      backdropOpacity.setValue(0);
      pendingOpen.current = true;
      if (isRendered) {
        // Reopened before the close finished: already laid out, so no
        // layout event is coming. Start now.
        startOpenAnimation();
      } else {
        setIsRendered(true);
        // Backstop in case a layout event never arrives.
        openBackstop.current = setTimeout(startOpenAnimation, 500);
      }
    } else {
      pendingOpen.current = false;
      if (openBackstop.current) clearTimeout(openBackstop.current);
      Animated.parallel([
        Animated.timing(deckTranslateY, { toValue: height, duration: 80, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 440, useNativeDriver: true }),
      ]).start(() => {
        setIsRendered(false);
        setSentTurns([]);
        trade.reset();
        setQueryText('');
        setScrolledActionType(feedActions[0]?.actionType ?? null);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open or close only when `visible` changes, not on every re-render.
  }, [visible]);

  const handleCloseModal = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(deckTranslateY, { toValue: height, duration: 80, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  // Stable callbacks for the (memoized) deck.
  const disableScroll = useStableCallback(() => setScrollEnabled(false));
  const enableScroll = useStableCallback(() => setScrollEnabled(true));
  const handleQueryPostTap = useStableCallback((postIndex: number) => trade.setSubflowData(postIndex));
  const handleSelectPost = useStableCallback((postIndex: number) => {
    const selectType = isAddMode ? 'add' : 'offer';
    if (trade.activeAction !== selectType) {
      trade.selectAction(selectType, postIndex);
    } else {
      trade.togglePost(postIndex);
    }
  });

  const handleActionSelected = (action: TradeAction) => {
    const { actionType, subAction } = action;

    if (subAction === 'select' && trade.activeAction === actionType) {
      handleConfirm();
      return;
    }

    if (actionType === 'offer' || actionType === 'add') {
      trade.selectAction(actionType, topPostIndex);
      return;
    }

    // Like OFFER, a question has to be about a post: QUERY does nothing while
    // the user or location card is on top (closing an open box still works).
    if (actionType === 'query' && trade.activeAction !== 'query' && topPostIndex == null) {
      return;
    }

    trade.selectAction(actionType);
  };

  // After an offer or question goes through, its turn shows under the wheel
  // for a moment, like it would in a trade's history, then fades away.
  const [sentTurns, setSentTurns] = useState<TradeTurn[]>([]);
  const sentOpacity = useRef(new Animated.Value(0)).current;
  const showSentTurn = (turn: TradeTurn) => {
    setSentTurns([turn]);
    sentOpacity.stopAnimation();
    sentOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(sentOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(3200),
      Animated.timing(sentOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setSentTurns([]);
    });
  };

  const handleConfirm = async () => {
    if (!effectiveIsReady || !trade.activeAction) return;

    await new Promise(resolve => setTimeout(resolve, 0));

    switch (trade.activeAction) {
      case 'offer': {
        if (trade.selectedPosts.length === 0 || isSubmittingOffer) break;
        const selectedPost = deckPosts[trade.selectedPosts[0]];
        if (!selectedPost?._id) break;

        setIsSubmittingOffer(true);
        try {
          await sendOffer(selectedPost._id);
          showSentTurn({ type: 'turnOffer', item: selectedPost.name, isUser: true });
        } catch (err) {
          showError("Your offer didn't go through", err);
        } finally {
          setIsSubmittingOffer(false);
        }
        break;
      }

      case 'add': {
        const selectedPost = deckPosts[trade.selectedPosts[0]];
        if (!addGameId || !selectedPost?._id) break;
        try {
          await addPost(addGameId, selectedPost._id);
          onAdded?.();
          handleCloseModal();
        } catch (err) {
          console.error('Add failed:', err);
          onAddFailed?.(err);
        }
        break;
      }

      case 'query': {
        if (topPostIndex === null || !queryText.trim() || isSubmittingQuery) break;
        const targetPost = deckPosts[topPostIndex];
        if (!targetPost?._id) break;

        setIsSubmittingQuery(true);
        try {
          await sendQuery(targetPost._id, queryText);
          showSentTurn({ type: 'turnQuery', item: queryText.trim(), isUser: true });
          onQuerySubmit?.({
            postIndex: topPostIndex,
            question: queryText,
          });
        } catch (err) {
          showError("Your question didn't go through", err);
          setIsSubmittingQuery(false);
          return; // keep the box open with your text
        }
        setIsSubmittingQuery(false);
        break;
      }

      default:
        break;
    }

    trade.confirm();
    trade.reset();
  };

  const topCardIsSelected = topPostIndex !== null && trade.selectedPosts.includes(topPostIndex);

  return (
    <Modal visible={isRendered} transparent animationType="none" statusBarTranslucent>
      <KeyboardLiftContext.Provider value={keyboardLift.context}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.modalBackground, { opacity: backdropOpacity }]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, .8)', 'rgba(0, 0, 0, 1)']}
              locations={[0, 0.16, 0.24]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <TouchableOpacity
            style={styles.closeStrip}
            activeOpacity={1}
            onPress={handleCloseModal}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <Animated.View
            style={[styles.animatedContainer, { transform: [{ translateY: deckTranslateY }] }]}
            onLayout={startOpenAnimation}
          >
            <ScrollView
              ref={scrollViewRef}
              style={{ maxHeight: MAX_SCROLL_HEIGHT }}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollEnabled={scrollEnabled}
              onScroll={e => {
                scrollY.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              onContentSizeChange={keyboardLift.onContentSizeChange}
            >
              <View style={deckStyles.column}>
                <View style={deckStyles.itemCountRow}>
                  <View style={styles.statusBar}>
                    <View style={deckStyles.cardLineup}>
                      <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
                      <FontAwesome6 name="circle-dot" size={24} color={colors.ui.secondarydisabled} />
                      <Text style={deckStyles.countText}>{pad2(postCount)}</Text>
                      <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
                    </View>
                  </View>
                </View>

                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.ui.secondarydisabled} />
                  </View>
                ) : (
                  <View style={deckStyles.deckWrapper}>
                    <Deck
                      groups={deckGroups}
                      cardWidth={Math.min(width - 36, 400)}
                      enabled={true}
                      isUser={false}
                      isSelectMode={isOfferActive || isAddActive}
                      isQueryMode={isQueryActive}
                      selectedPosts={trade.selectedPosts}
                      onTopCardChange={setTopPostIndex}
                      selectColor={isAddMode ? colors.actions.verify : colors.actions.offer}
                      showLocation={true}
                      onHorizontalGestureStart={disableScroll}
                      onGestureEnd={enableScroll}
                      jumpToken={jumpToken}
                      jumpToCardIndex={jumpToIndex}
                      querySelectedPostIndex={queryPostIndex}
                      onQueryPostTap={handleQueryPostTap}
                      onSelectPost={handleSelectPost}
                    />
                  </View>
                )}

                <View style={styles.turnsAndButtonColumn}>
                  <View style={[styles.queryRow, { marginBottom: isQueryActive ? 4 : 0 }]}>
                    <TradeTurns turns={[]} isQueryOpen={isQueryActive} onQueryTextChange={setQueryText} />
                  </View>
                  <View style={styles.actionRow}>
                    <TradeUI
                      actions={feedActions}
                      onActionSelected={handleActionSelected}
                      activeActionType={trade.activeAction}
                      isReady={effectiveIsReady}
                      selectedCount={trade.selectedPosts.length}
                      topCardIsSelected={topCardIsSelected}
                      isQueryMode={isQueryActive}
                      queryPostSelected={queryPostIndex !== null}
                      onQueryPostSelect={() => {}}
                      onQueryPostDeselect={() => {}}
                      queryBlocked={topPostIndex === null}
                      blockedActionTypes={topPostIndex === null ? ['offer', 'add'] : []}
                      onActionChange={setScrolledActionType}
                    />
                  </View>
                  {sentTurns.length > 0 && (
                    <Animated.View style={[styles.sentTurnsRow, { opacity: sentOpacity }]} pointerEvents="none">
                      <TradeTurns turns={sentTurns} />
                    </Animated.View>
                  )}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardLiftContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BASE },
  animatedContainer: { position: 'absolute', bottom: BOTTOM_BASE, left: 0, right: 0, alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  loadingContainer: { height: 300, justifyContent: 'center', alignItems: 'center' },
  saveButton: {
    width: 50,
    height: 36,
    backgroundColor: colors.ui.secondary,
    ...barRadius.leftCap,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: { ...makeCountBar('topCap', 'flex-end') },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {},
  // Same gap under the wheel as the open tab decks' turn log.
  sentTurnsRow: { marginTop: -2 },
});
