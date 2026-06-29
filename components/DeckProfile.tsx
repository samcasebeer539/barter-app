import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import Deck, { DeckGroup } from './Deck';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import { TRADE_ACTIONS, TradeActionType } from '../config/tradeConfig';
import { deckStyles, makeIconButton, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { useTradeAction } from '../hooks/useTradeAction';

import { Post, User, Locations, OffererGroup } from '@/types/index';
import { createPost, updatePost, deletePost } from '@/services/postService';
import { IncomingQuery } from '@/services/tradeService';

const SLIDE_MARGIN = 0;
const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnOffer', user: 'Jay Wilson', item: 'iPad 6th gen', isUser: false },
];

interface ProfileDeckProps {
  posts: Post[];
  primaryUser: User;
  secondaryOfferers?: OffererGroup[];
  initialLocations?: Locations[];
  onConfirmLocations?: (locations: Locations[]) => void;
  onSelectLocation?: (location: Locations | null) => void;
  onToggleReveal?: () => void;
  toggleEnabled?: boolean;
  isDeckRevealed?: boolean;
  onSaveUser?: (updated: User) => void;
  onPostsChange?: (updated: Post[]) => void;
  onTopPrimaryPostChange?: (index: number | null) => void;
  hasIncomingOffers?: boolean;
  // ── Confirmed-action payload callbacks ──────────────────────────────────
  onBarterSubmit?: (gameId: string, selectedPostIds: string[]) => void;
  onQuerySubmit?: (payload: { gameId: string; postIndex: number | null }) => void;
  onDeclineSubmit?: (gameId: string) => void;
  incomingQueries?: IncomingQuery[];
  
}

export default function ProfileDeck({
  posts,
  primaryUser,
  secondaryOfferers = [],
  initialLocations,
  onConfirmLocations,
  onSelectLocation,
  onToggleReveal,
  toggleEnabled = false,
  isDeckRevealed = false,
  onSaveUser,
  onPostsChange,
  onTopPrimaryPostChange,
  hasIncomingOffers = false,
  onBarterSubmit,
  onQuerySubmit,
  onDeclineSubmit,
  incomingQueries = [],
}: ProfileDeckProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const hasIncomingQueries = incomingQueries.length > 0;
  const [showSecondary, setShowSecondary] = useState(false);
  const [secondaryHeight, setSecondaryHeight] = useState(0);
  const pendingOpenRef = useRef(false);

  const isDeckRevealedRef = useRef(isDeckRevealed);
  useEffect(() => { isDeckRevealedRef.current = isDeckRevealed; }, [isDeckRevealed]);

  const trade = useTradeAction();

  const [isQueryDrawerOpen, setIsQueryDrawerOpen] = useState(false);
  const [topSecondaryPostIndex, setTopSecondaryPostIndex] = useState<number | null>(null);
  const [topSecondaryGroupIndex, setTopSecondaryGroupIndex] = useState<number | null>(null);
  const [tradeTurns, setTradeTurns] = useState<TradeTurn[]>(trade1Turns);

  const [topCardType, setTopCardType] = useState<'user' | 'post' | 'datetime' | 'location'>('user');
  const [topPrimaryPostIndex, setTopPrimaryPostIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPostEditMode, setIsPostEditMode] = useState(false);

  const DECK_PREFIX = 2;

  const [jumpToken, setJumpToken] = useState<number | undefined>(undefined);
  const [jumpToIndex, setJumpToIndex] = useState(0);
  const jumpCounterRef = useRef(0);

  useEffect(() => {
    if (topCardType !== 'user') setIsEditMode(false);
    if (topCardType !== 'post') setIsPostEditMode(false);
  }, [topCardType]);

  const itemCount = useMemo(() => posts.length, [posts]);
  const offerCount = useMemo(() => secondaryOfferers.length, [secondaryOfferers]);

  // One deck group per offerer — their user card, location, and posts
  // appear together, and the existing 3-slot swipe mechanics interleave
  // multiple offerers automatically. Each group's index lines up 1:1 with
  // secondaryOfferers, so groupIndex -> gameId is a direct lookup.
  const secondaryGroups: DeckGroup[] = useMemo(
    () => secondaryOfferers.map(({ profile }) => ({
      user: profile.user,
      posts: profile.posts.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        photos: p.photos,
        date_posted: p.date_posted,
      })),
      locations: profile.user.locations ?? [],
    })),
    [secondaryOfferers]
  );

  const primaryGroups: DeckGroup[] = useMemo(
    () => [{
      user: primaryUser,
      posts,
      locations: (initialLocations && initialLocations.length > 0)
        ? initialLocations
        : (primaryUser.locations ?? []),
    }],
    [primaryUser, posts, initialLocations]
  );

  const tradeActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['barter', 'query', 'decline'].includes(a.actionType)),
    []
  );

  const secondaryTurns: TradeTurn[] = useMemo(
    () => incomingQueries.map(q => ({
      type: 'turnQuery' as const,
      user: q.fromUserName,
      item: q.question,
      isUser: false,
    })),
    [incomingQueries]
  );

  // What the action wheel is currently scrolled to — distinct from
  // trade.activeAction, which only changes on an icon tap. Select/subflow
  // UI should disappear the instant the wheel scrolls away from the armed
  // action, not linger until the next tap. Same pattern as FeedDeck/TradeDeck.
  const [scrolledActionType, setScrolledActionType] = useState<TradeActionType | null>(
    tradeActions[0]?.actionType ?? null
  );

  const isBarterActive =
    trade.activeAction === 'barter' &&
    scrolledActionType === 'barter' &&
    trade.phase !== 'confirmed';

  const isQueryActive =
    trade.activeAction === 'query' &&
    scrolledActionType === 'query' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';

  // ── Per-user multiselect for barter ─────────────────────────────────────
  // trade.selectedPosts holds global indices across all offerer groups.
  // Selecting a card from a different offerer than the current selection
  // resets the selection to just that card, rather than mixing two users'
  // posts together.
  const postIndexToGroupIndex = useCallback((postIndex: number) => {
    let cursor = 0;
    for (let g = 0; g < secondaryGroups.length; g++) {
      const len = secondaryGroups[g].posts.length;
      if (postIndex < cursor + len) return g;
      cursor += len;
    }
    return -1;
  }, [secondaryGroups]);

  const isDifferentGroup = useCallback((postIndex: number) => {
    if (trade.selectedPosts.length === 0) return false;
    return postIndexToGroupIndex(postIndex) !== postIndexToGroupIndex(trade.selectedPosts[0]);
  }, [trade.selectedPosts, postIndexToGroupIndex]);

  // Flattened post objects across all groups, in the same order as the
  // global postIndex space — lets us go from selected indices straight to
  // the underlying post _id's for the network call.
  const flattenedSecondaryPosts = useMemo(
    () => secondaryGroups.flatMap(g => g.posts),
    [secondaryGroups]
  );

  const animateOpen = useCallback(() => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, { toValue: 1, useNativeDriver: false, duration: 440 }).start();
  }, [slideAnim]);

  const animateClose = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 0, useNativeDriver: false, duration: 440 }).start(({ finished }) => {
      if (finished) {
        setShowSecondary(false);
        setSecondaryHeight(0);
        trade.reset();
        setScrolledActionType(tradeActions[0]?.actionType ?? null);
        pendingOpenRef.current = false;
      }
    });
  }, [slideAnim, trade, tradeActions]);

  useEffect(() => {
    if (isDeckRevealed) { pendingOpenRef.current = true; setShowSecondary(true); }
    else { animateClose(); }
  }, [isDeckRevealed]);

  const handleSecondaryLayout = (h: number) => {
    if (h === 0) return;
    setSecondaryHeight(h);
    if (pendingOpenRef.current) { pendingOpenRef.current = false; animateOpen(); }
  };

  const handleTradeActionSelected = (action: TradeAction) => {
    const { actionType, subAction } = action;

    // Arrow / confirm tap always sends 'select' for the currently-active action.
    if (subAction === 'select' && trade.activeAction === actionType) {
      handleConfirm();
      return;
    }

    if (actionType === 'barter') {
      if (topSecondaryPostIndex !== null && isDifferentGroup(topSecondaryPostIndex)) {
        trade.reset();
      }
      trade.selectAction(actionType, topSecondaryPostIndex);
      return;
    }

    // query, decline: arm on icon tap
    trade.selectAction(actionType);
  };

  const handleConfirm = async () => {
    if (!trade.isReady || !trade.activeAction) return;

    // Let the press-out opacity animation settle before anything disables
    // this same button — see TradeDeck for the full explanation.
    await new Promise(resolve => setTimeout(resolve, 0));

    switch (trade.activeAction) {
      case 'barter': {
        if (trade.selectedPosts.length === 0) break;
        const groupIndex = postIndexToGroupIndex(trade.selectedPosts[0]);
        const gameId = secondaryOfferers[groupIndex]?.gameId;
        const selectedPostIds = trade.selectedPosts
          .map(i => flattenedSecondaryPosts[i]?._id)
          .filter((id): id is string => !!id);
        if (gameId && selectedPostIds.length > 0) {
          onBarterSubmit?.(gameId, selectedPostIds);
        }
        break;
      }

      case 'query': {
        const groupIndex = topSecondaryGroupIndex;
        const gameId = groupIndex !== null ? secondaryOfferers[groupIndex]?.gameId : undefined;
        if (gameId) {
          onQuerySubmit?.({
            gameId,
            postIndex: typeof trade.subflowData === 'number' ? trade.subflowData : null,
          });
        }
        break;
      }

      case 'decline': {
        const groupIndex = topSecondaryGroupIndex;
        const gameId = groupIndex !== null ? secondaryOfferers[groupIndex]?.gameId : undefined;
        if (gameId) {
          onDeclineSubmit?.(gameId);
        }
        break;
      }

      default:
        break;
    }

    trade.confirm();
    trade.reset();
  };

  const topSecondaryCardIsSelected =
    topSecondaryPostIndex !== null && trade.selectedPosts.includes(topSecondaryPostIndex);

  const handleSavePost = useCallback(async (updated: Post) => {
    try {
      let newPosts: Post[];
      if (!updated._id) {
        const created = await createPost(updated);
        newPosts = posts.map((p, i) => (i === topPrimaryPostIndex ? created : p));
      } else {
        await updatePost(updated._id, updated);
        newPosts = posts.map(p => (p._id === updated._id ? updated : p));
      }
      onPostsChange?.(newPosts);
    } catch (err) { console.error('Failed to save post:', err); }
  }, [posts, onPostsChange, topPrimaryPostIndex]);

  const handleAddPost = useCallback(() => {
    const emptyPost: Post = { name: 'New Item', description: '', photos: [], date_posted: '' };
    jumpCounterRef.current += 1;
    setJumpToIndex(DECK_PREFIX);
    setJumpToken(jumpCounterRef.current);
    onPostsChange?.([emptyPost, ...posts]);
  }, [posts, onPostsChange]);

  const handleDeleteTopPost = useCallback(async () => {
    if (topCardType !== 'post' || topPrimaryPostIndex === null) return;
    const postToDelete = posts[topPrimaryPostIndex];
    const updated = posts.filter((_, i) => i !== topPrimaryPostIndex);
    const targetInNewCards = DECK_PREFIX + topPrimaryPostIndex;
    const newLen = DECK_PREFIX + updated.length;
    const target = targetInNewCards < newLen ? targetInNewCards : 0;
    jumpCounterRef.current += 1;
    setJumpToIndex(target);
    setJumpToken(jumpCounterRef.current);
    onPostsChange?.(updated);
    if (postToDelete._id) {
      try { await deletePost(postToDelete._id); }
      catch (err) { console.error('Failed to delete post:', err); onPostsChange?.(posts); }
    }
  }, [topCardType, topPrimaryPostIndex, posts, onPostsChange]);

  const cardWidth = Math.min(width - 36, 400);
  const spacerHeight = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, secondaryHeight + SLIDE_MARGIN] });
  const deleteDisabled = topCardType !== 'post' || topPrimaryPostIndex === null;

  const handleTopPrimaryPostChange = useCallback((index: number | null) => {
    setTopPrimaryPostIndex(index);
    onTopPrimaryPostChange?.(index);
  }, [onTopPrimaryPostChange]);

  // Auto-close the query drawer and the offers reveal when scrolling to a
  // post that no longer has queries/offers — both are otherwise independent
  // toggle states with no awareness of which post is currently on top.
  useEffect(() => {
    if (isQueryDrawerOpen && !hasIncomingQueries) {
      setIsQueryDrawerOpen(false);
    }
  }, [topPrimaryPostIndex, hasIncomingQueries]);

  useEffect(() => {
    if (isDeckRevealed && !hasIncomingOffers) {
      onToggleReveal?.();
    }
  }, [topPrimaryPostIndex, hasIncomingOffers]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[deckStyles.itemCountRow, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.queryButton}
          onPress={() => setIsQueryDrawerOpen(prev => !prev)}
          disabled={!hasIncomingQueries}
        >
          <Text style={[
            deckStyles.actionButtonText,
            { color: hasIncomingQueries ? colors.actions.query : colors.ui.secondarydisabled }
          ]}>
            QUERIES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.offerButton} onPress={onToggleReveal} disabled={!toggleEnabled || !hasIncomingOffers}>
          <Text style={[deckStyles.actionButtonText, {  color: hasIncomingOffers ? colors.actions.offer : colors.ui.secondarydisabled}]}>OFFERS</Text>
          <Text style={[deckStyles.countText, { marginLeft: 'auto' }]}>0{offerCount}</Text>
          <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
        </TouchableOpacity>
      </View>

      <View style={styles.decksContainer}>

        {/* Secondary deck — all pending offerers, query select enabled */}
        {showSecondary && secondaryGroups.length > 0 && (
          <View
            style={styles.secondaryDeckContainer}
            onLayout={e => handleSecondaryLayout(e.nativeEvent.layout.height)}
          >
            <View style={deckStyles.deckWrapper}>
              <Deck
                groups={secondaryGroups}
                cardWidth={cardWidth}
                enabled
                isSelectMode={isBarterActive}
                selectedPosts={trade.selectedPosts}
                onTopCardChange={setTopSecondaryPostIndex}
                onTopCardGroupChange={setTopSecondaryGroupIndex}
                selectColor={colors.actions.trade}
                isUser={false}
                onSelectLocation={onSelectLocation}
                isQueryMode={isQueryActive}
                querySelectedPostIndex={
                  isQueryActive && typeof trade.subflowData === 'number' ? trade.subflowData : null
                }
                onQueryPostTap={(postIndex) => trade.setSubflowData(postIndex)}
                onSelectPost={(postIndex) => {
                  if (trade.activeAction !== 'barter') {
                    trade.selectAction('barter', postIndex);
                  } else if (isDifferentGroup(postIndex)) {
                    trade.reset();
                    trade.selectAction('barter', postIndex);
                  } else {
                    trade.togglePost(postIndex);
                  }
                }}
              />
            </View>
            <View style={styles.turnsAndButtonColumn}>
              
              <View style={styles.actionRow}>
                <TradeUI
                  actions={tradeActions}
                  onActionSelected={handleTradeActionSelected}
                  activeActionType={trade.activeAction}
                  isReady={trade.isReady}
                  selectedCount={trade.selectedPosts.length}
                  topCardIsSelected={topSecondaryCardIsSelected}
                  isQueryMode={isQueryActive}
                  queryPostSelected={isQueryActive && trade.subflowData != null}
                  onQueryPostSelect={() => trade.setSubflowData(topSecondaryPostIndex)}
                  onQueryPostDeselect={() => trade.setSubflowData(null)}
                  onActionChange={setScrolledActionType}
                />
              </View>
              <View style={styles.turnsRow}>
                <TradeTurns turns={tradeTurns} />
              </View>
            </View>
          </View>
        )}

        <Animated.View style={{ height: spacerHeight }} pointerEvents="none" />

        {/* Primary deck — logged-in user, editable */}
        <View style={styles.primaryDeckWrapper}>
          <View style={styles.primaryDeckColumn}>
            <View style={[deckStyles.deckWrapper, {backgroundColor: colors.ui.background, paddingTop: 8, marginTop: -8}]}>
              <Deck
                groups={primaryGroups}
                cardWidth={cardWidth}
                enabled
                onTopCardTypeChange={setTopCardType}
                onTopCardChange={handleTopPrimaryPostChange}
                isUser={true}
                isEditMode={isEditMode}
                onExitEdit={() => setIsEditMode(false)}
                onEnterEdit={() => setIsEditMode(true)}
                isPostEditMode={isPostEditMode}
                onExitPostEdit={() => setIsPostEditMode(false)}
                onEnterPostEdit={() => setIsPostEditMode(true)}
                onSaveUser={onSaveUser}
                onSavePost={handleSavePost}
                jumpToken={jumpToken}
                jumpToCardIndex={jumpToIndex}
                onConfirmLocations={onConfirmLocations}
              />
            </View>
            {isQueryDrawerOpen && (
              <View style={styles.queryDrawer}>
                <TradeTurns turns={secondaryTurns} />
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddPost}>
                <FontAwesome6 name="circle-plus" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTopPost} disabled={deleteDisabled}>
                <FontAwesome6 name="circle-xmark" size={24} color={deleteDisabled ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
              <View style={styles.myItemCountBar}>
                <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
                <FontAwesome6 name="circle-dot" size={24} color={colors.ui.secondarydisabled} />
                <Text style={[deckStyles.countText, { color: colors.ui.secondarydisabled }]}>0{itemCount}</Text>
                <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 400, position: 'relative', alignItems: 'center', overflow: 'visible' },
  decksContainer: { width: '100%', alignItems: 'center', overflow: 'visible' },
  primaryDeckWrapper: { width: '100%', alignItems: 'center', zIndex: 2, elevation: 2},
  primaryDeckColumn: {
    width: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: colors.ui.background, paddingBottom: 50,
  },
  secondaryDeckContainer: {
    position: 'absolute', top: 0, width: '100%', alignItems: 'center',
    flexDirection: 'column', gap: 8, zIndex: 1, elevation: 1, backgroundColor: colors.ui.background,
  },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {marginBottom: -2},
  turnsRow: {marginBottom: 8},
  queryDrawer: { width: DECK_BAR_WIDTH },
  buttonRow: { width: DECK_BAR_WIDTH, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  myItemCountBar: {
    height: 44, flexDirection: 'row', flex: 1, gap: 8, ...barRadius.bottomRightCap,
    backgroundColor: colors.ui.secondary, justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  offerButton: {
    flex: 1, paddingLeft: 16, paddingRight: 16, height: 36, ...barRadius.rightCap,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.ui.secondary, gap: 8,
  },
  queryButton: {
    flexShrink: 0, paddingLeft: 16, paddingRight: 12, height: 36, ...barRadius.leftCap,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ui.secondary,
  },
  deleteButton: { ...makeIconButton('flat') },
  editButton: { ...makeIconButton('flat') },
  addButton: { ...makeIconButton('bottomLeftCap') },
});