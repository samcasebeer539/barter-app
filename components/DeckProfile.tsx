import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import Deck from './Deck';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import { TRADE_ACTIONS } from '../config/tradeConfig';
import { deckStyles, makeIconButton, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';

import { Post, User, Locations } from '@/types/index';
import { createPost, updatePost, deletePost } from '@/services/postService';

const SLIDE_MARGIN = 0;
const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnOffer', user: 'Jay Wilson', item: 'iPad 6th gen', isUser: false },
];

interface ProfileDeckProps {
  posts: Post[];
  primaryUser: User;
  secondaryPosts?: Post[];
  secondaryUser?: User;
  initialLocations?: Locations[];
  onConfirmLocations?: (locations: Locations[]) => void;
  externalLocations?: Locations[];
  onSelectLocation?: (location: Locations | null) => void;
  onToggleReveal?: () => void;
  toggleEnabled?: boolean;
  isDeckRevealed?: boolean;
  onSaveUser?: (updated: User) => void;
  onPostsChange?: (updated: Post[]) => void;
  onTopPrimaryPostChange?: (index: number | null) => void;
}

export default function ProfileDeck({
  posts,
  primaryUser,
  secondaryPosts = [],
  secondaryUser,
  onConfirmLocations,
  externalLocations = [],
  onSelectLocation,
  onToggleReveal,
  toggleEnabled = false,
  isDeckRevealed = false,
  onSaveUser,
  onPostsChange,
  onTopPrimaryPostChange,
}: ProfileDeckProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [showSecondary, setShowSecondary] = useState(false);
  const [secondaryHeight, setSecondaryHeight] = useState(0);
  const pendingOpenRef = useRef(false);

  const isDeckRevealedRef = useRef(isDeckRevealed);
  useEffect(() => { isDeckRevealedRef.current = isDeckRevealed; }, [isDeckRevealed]);

  const [isQueryDrawerOpen, setIsQueryDrawerOpen] = useState(false);
  const [isTradeSelectMode, setIsTradeSelectMode] = useState(false);
  const [selectedSecondaryPosts, setSelectedSecondaryPosts] = useState<number[]>([]);
  const [topSecondaryPostIndex, setTopSecondaryPostIndex] = useState<number | null>(null);
  const [isTradeQueryOpen, setIsTradeQueryOpen] = useState(false);
  const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);
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
  const offerCount = useMemo(() => secondaryPosts.length, [secondaryPosts]);

  const animateOpen = useCallback(() => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, { toValue: 1, useNativeDriver: false, duration: 440 }).start();
  }, [slideAnim]);

  const animateClose = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 0, useNativeDriver: false, duration: 440 }).start(({ finished }) => {
      if (finished) {
        setShowSecondary(false);
        setSecondaryHeight(0);
        setIsTradeSelectMode(false);
        setSelectedSecondaryPosts([]);
        setIsTradeQueryOpen(false);
        setQuerySelectedPost(null);
        pendingOpenRef.current = false;
      }
    });
  }, [slideAnim]);

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
    if (action.actionType === 'barter' && action.subAction === 'write') {
      if (!isTradeSelectMode) {
        setIsTradeSelectMode(true);
        if (topSecondaryPostIndex !== null) setSelectedSecondaryPosts([topSecondaryPostIndex]);
      } else {
        if (topSecondaryPostIndex !== null) {
          setSelectedSecondaryPosts(prev =>
            prev.includes(topSecondaryPostIndex)
              ? prev.filter(i => i !== topSecondaryPostIndex)
              : [...prev, topSecondaryPostIndex]
          );
        }
      }
    }
  };

  const topSecondaryCardIsSelected =
    topSecondaryPostIndex !== null && selectedSecondaryPosts.includes(topSecondaryPostIndex);

  const tradeActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['barter', 'query', 'decline'].includes(a.actionType)),
    []
  );

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
  const secondaryUserName = secondaryUser?.first_name ?? 'Partner';
  const deleteDisabled = topCardType !== 'post' || topPrimaryPostIndex === null;

  // check for incoming offers.
  const topPost = topPrimaryPostIndex !== null ? posts[topPrimaryPostIndex] : null;
  const hasIncomingOffers = (topPost?.incoming_offers?.length ?? 0) > 0;
  
  const handleTopPrimaryPostChange = useCallback((index: number | null) => {
    setTopPrimaryPostIndex(index);
    onTopPrimaryPostChange?.(index);
  }, [onTopPrimaryPostChange]);
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={[deckStyles.itemCountRow, { marginBottom: 8 }]}>
        <TouchableOpacity style={styles.queryButton} onPress={() => setIsQueryDrawerOpen(prev => !prev)}>
          <Text style={[deckStyles.actionButtonText, { color: colors.ui.secondarydisabled }]}>QUERIES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.offerButton} onPress={onToggleReveal} disabled={!toggleEnabled || !hasIncomingOffers}>
          <Text style={[deckStyles.actionButtonText, {  color: hasIncomingOffers ? colors.actions.offer : colors.ui.secondarydisabled}]}>OFFERS</Text>
          <Text style={[deckStyles.countText, { marginLeft: 'auto' }]}>0{offerCount}</Text>
          <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
        </TouchableOpacity>
      </View>

      <View style={styles.decksContainer}>

        {/* Secondary deck — other user, query select enabled */}
        {showSecondary && secondaryPosts.length > 0 && (
          <View
            style={styles.secondaryDeckContainer}
            onLayout={e => handleSecondaryLayout(e.nativeEvent.layout.height)}
          >
            <View style={deckStyles.deckWrapper}>
              <Deck
                posts={secondaryPosts}
                user={secondaryUser}
                cardWidth={cardWidth}
                enabled
                isSelectMode={isTradeSelectMode}
                selectedPosts={selectedSecondaryPosts}
                onTopCardChange={setTopSecondaryPostIndex}
                selectColor={colors.actions.trade}
                isUser={false}
                externalLocations={externalLocations}
                onSelectLocation={onSelectLocation}
                isQueryMode={true}
                querySelectedPostIndex={querySelectedPost}
              />
            </View>
            <View style={styles.turnsAndButtonColumn}>
              <View style={[styles.queryRow, { marginBottom: isTradeQueryOpen ? 4 : 0 }]}>
                <TradeTurns turns={[]} isQueryOpen={isTradeQueryOpen} />
              </View>
              <View style={styles.actionRow}>
                <TradeUI
                  actions={tradeActions}
                  onActionSelected={handleTradeActionSelected}
                  onQueryToggle={isOpen => setIsTradeQueryOpen(isOpen)}
                  isSelectMode={isTradeSelectMode}
                  selectedCount={selectedSecondaryPosts.length}
                  topCardIsSelected={topSecondaryCardIsSelected}
                  isQueryMode={true}
                  queryPostSelected={querySelectedPost !== null}
                  onQueryPostSelect={() => setQuerySelectedPost(topSecondaryPostIndex)}
                  onQueryPostDeselect={() => setQuerySelectedPost(null)}
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
                posts={posts}
                user={primaryUser}
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
                initialLocations={primaryUser.locations ?? []}
                jumpToken={jumpToken}
                jumpToCardIndex={jumpToIndex}
                onConfirmLocations={onConfirmLocations}
              />
            </View>
            {isQueryDrawerOpen && (
              <View style={styles.queryDrawer}>
                <TradeTurns turns={[{ type: 'turnQuery', user: secondaryUserName, item: 'Fantasy Books', isUser: false }]} />
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