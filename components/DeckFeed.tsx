import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  Modal, Platform, ScrollView, Keyboard, KeyboardEvent, ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns from './TradeTurns';
import { TRADE_ACTIONS, TradeActionType } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { getFeedProfile } from '@/services/feedService';
import { FeedProfile } from '@/types/index';
import { Post, User, Locations } from '@/types/index';
import { getAuth } from 'firebase/auth';
import { useTradeAction } from '../hooks/useTradeAction';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const BOTTOM_BASE = 140;

interface FeedDeckProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
  prefetchedProfile?: FeedProfile | null;
  onQuerySubmit?: (payload: { postIndex: number | null; question: string }) => void;
}

export default function FeedDeck({ postId, visible, onClose, prefetchedProfile, onQuerySubmit }: FeedDeckProps) {
  const deckTranslateY = useRef(new Animated.Value(height)).current;
  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
  const insets = useSafeAreaInsets();
  const MAX_SCROLL_HEIGHT = height - BOTTOM_BASE - insets.top;


  const feedActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
    []
  );

  const trade = useTradeAction();

  // What the action wheel is currently scrolled to — distinct from
  // trade.activeAction, which only changes on an icon tap. Select/subflow
  // UI should disappear as soon as the wheel scrolls away, not linger
  // until the next tap. See TradeDeck for the same pattern.
  const [scrolledActionType, setScrolledActionType] = useState<TradeActionType | null>(
    feedActions[0]?.actionType ?? null
  );

  // The typed question lives outside the hook, same reasoning as in
  // TradeDeck: subflowData for 'query' holds the selected post index.
  const [queryText, setQueryText] = useState('');

  const isOfferActive =
    trade.activeAction === 'offer' &&
    scrolledActionType === 'offer' &&
    trade.phase !== 'confirmed';

  const isQueryActive =
    trade.activeAction === 'query' &&
    scrolledActionType === 'query' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';

  const effectiveIsReady =
    trade.activeAction === 'query'
      ? trade.isReady || queryText.trim().length > 0
      : trade.isReady;

  useEffect(() => {
    if (!isQueryActive) setQueryText('');
  }, [isQueryActive]);

  const deckUser: User | undefined = profile?.user;
  const deckPosts: Post[] = profile
    ? profile.posts.map(p => ({
        _id: p._id, name: p.name, description: p.description,
        photos: p.photos, date_posted: p.date_posted,
      }))
    : [];
  const externalLocations: Locations[] = profile?.user?.locations ?? [];
  const postCount = deckPosts.length;

  const [jumpToken, setJumpToken] = useState<number | undefined>(undefined);
  const [jumpToIndex, setJumpToIndex] = useState(0);
  const jumpCounterRef = useRef(0);

  useEffect(() => {
    if (!postId) return;
    const applyProfile = (data: FeedProfile) => {
      setProfile(data);
      const idx = data.posts.findIndex(p => p._id === data.tappedPostId);
      jumpCounterRef.current += 1;
      setJumpToIndex(idx >= 0 ? 2 + idx : 2);
      setJumpToken(jumpCounterRef.current);
    };
    if (prefetchedProfile) { setProfile(null); applyProfile(prefetchedProfile); }
    else {
      setIsLoading(true); setProfile(null);
      getFeedProfile(postId).then(applyProfile)
        .catch(err => console.error('FeedDeck profile load error:', err))
        .finally(() => setIsLoading(false));
    }
  }, [postId, prefetchedProfile]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: scrollY.current + e.endCoordinates.height * 0.8, animated: true }), 50);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      deckTranslateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(deckTranslateY, { toValue: 0, useNativeDriver: true, duration: 440 }),
        Animated.timing(backdropOpacity, { toValue: 0.88, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(deckTranslateY, { toValue: height, duration: 80, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 440, useNativeDriver: true }),
      ]).start(() => {
        setIsRendered(false);
        setKeyboardHeight(0);
        trade.reset();
        setQueryText('');
        setScrolledActionType(feedActions[0]?.actionType ?? null);
      });
    }
  }, [visible]);

  async function getAuthHeader() {
    const token = await getAuth().currentUser?.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  const handleCloseModal = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(deckTranslateY, { toValue: height, duration: 80, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleActionSelected = (action: TradeAction) => {
    const { actionType, subAction } = action;

    // Arrow / confirm tap always sends 'select' for the currently-active action.
    if (subAction === 'select' && trade.activeAction === actionType) {
      handleConfirm();
      return;
    }

    if (actionType === 'offer') {
      trade.selectAction(actionType, topPostIndex);
      return;
    }

    // query: arm the subflow on icon tap
    trade.selectAction(actionType);
  };

  const handleConfirm = async () => {
    if (!effectiveIsReady || !trade.activeAction) return;

    // Let the press-out opacity animation settle before anything disables
    // this same button — see TradeDeck for the full explanation.
    await new Promise(resolve => setTimeout(resolve, 0));

    switch (trade.activeAction) {
      case 'offer': {
        if (trade.selectedPosts.length === 0 || isSubmittingOffer) break;
        const selectedPost = deckPosts[trade.selectedPosts[0]];

        setIsSubmittingOffer(true);
        try {
          const headers = await getAuthHeader();
          await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/offer`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetPostId: selectedPost._id,
            }),
          });
        } catch (err) {
          console.error('Offer failed:', err);
        } finally {
          setIsSubmittingOffer(false);
        }
        break;
      }

      case 'query': {
        if (typeof trade.subflowData !== 'number' || !queryText.trim() || isSubmittingQuery) break;
        const targetPost = deckPosts[trade.subflowData];
        if (!targetPost) break;

        setIsSubmittingQuery(true);
        try {
          const headers = await getAuthHeader();
          await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/query`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetPostId: targetPost._id,
              message: queryText,
            }),
          });
        } catch (err) {
          console.error('Query failed:', err);
        } finally {
          setIsSubmittingQuery(false);
        }

        onQuerySubmit?.({
          postIndex: trade.subflowData,
          question: queryText,
        });
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
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.modalBackground, { opacity: backdropOpacity }]} pointerEvents="none" />
        <TouchableOpacity style={styles.closeStrip} activeOpacity={1} onPress={handleCloseModal} />
        <Animated.View style={[styles.animatedContainer, { transform: [{ translateY: deckTranslateY }] }]}>
          <ScrollView
            ref={scrollViewRef}
            style={{ maxHeight: MAX_SCROLL_HEIGHT }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={scrollEnabled}
            onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
          >
            <View style={deckStyles.column}>
              <View style={deckStyles.itemCountRow}>
                <View style={styles.statusBar}>
                  <FontAwesome6 name='circle-user' size={24} color={colors.ui.secondarydisabled} />
                  <FontAwesome6 name='circle-dot' size={24} color={colors.ui.secondarydisabled} />
                  <Text style={[deckStyles.countText]}>0{postCount}</Text>
                  <FontAwesome6 name='arrows-rotate' size={24} color={colors.ui.secondarydisabled} />
                </View>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.ui.secondarydisabled} />
                </View>
              ) : (
                <View style={deckStyles.deckWrapper}>
                  <Deck
                    groups={deckUser ? [{ user: deckUser, posts: deckPosts, locations: externalLocations }] : []}
                    cardWidth={Math.min(width - 36, 400)}
                    enabled={true}
                    isUser={false}
                    isSelectMode={isOfferActive}
                    isQueryMode={isQueryActive}
                    selectedPosts={trade.selectedPosts}
                    onTopCardChange={setTopPostIndex}
                    selectColor={colors.actions.offer}
                    showLocation={true}
                    onHorizontalGestureStart={() => setScrollEnabled(false)}
                    onGestureEnd={() => setScrollEnabled(true)}
                    jumpToken={jumpToken}
                    jumpToCardIndex={jumpToIndex}
                    querySelectedPostIndex={
                      isQueryActive && typeof trade.subflowData === 'number' ? trade.subflowData : null
                    }
                    onQueryPostTap={(postIndex) => trade.setSubflowData(postIndex)}
                    onSelectPost={(postIndex) => {
                      if (trade.activeAction !== 'offer') {
                        trade.selectAction('offer', postIndex);
                      } else {
                        trade.togglePost(postIndex);
                      }
                    }}
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
                    queryPostSelected={isQueryActive && trade.subflowData != null}
                    onQueryPostSelect={() => trade.setSubflowData(topPostIndex)}
                    onQueryPostDeselect={() => trade.setSubflowData(null)}
                    onActionChange={setScrolledActionType}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.ui.background },
  closeStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BOTTOM_BASE },
  animatedContainer: { position: 'absolute', bottom: BOTTOM_BASE, left: 0, right: 0, alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  loadingContainer: { height: 300, justifyContent: 'center', alignItems: 'center' },
  saveButton: { width: 50, height: 36, backgroundColor: colors.ui.secondary, ...barRadius.leftCap, justifyContent: 'center', alignItems: 'center' },
  statusBar: { ...makeCountBar('topCap', 'flex-end') },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {},
});