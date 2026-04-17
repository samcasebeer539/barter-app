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
import { TRADE_ACTIONS } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { getFeedProfile } from '@/services/feedService';
import { FeedProfile } from '@/types/index';
import { Post, User, Locations } from '@/types/index';

const { width, height } = Dimensions.get('window');
const BOTTOM_BASE = 140;
const MAX_SCROLL_HEIGHT = height - BOTTOM_BASE - 60;

interface FeedDeckProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
  prefetchedProfile?: FeedProfile | null;
}

export default function FeedDeck({ postId, visible, onClose, prefetchedProfile }: FeedDeckProps) {
  const deckTranslateY = useRef(new Animated.Value(height)).current;
  const [isRendered, setIsRendered] = useState(false);
  // const [showSaved, setShowSaved] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [profile, setProfile] = useState<FeedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeActionType, setActiveActionType] = useState<string>('offer');
  const isOfferActive = activeActionType === 'offer';
  const isQueryActive = activeActionType === 'query';

  const feedActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
    []
  );

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
        setIsQueryOpen(false);
        setKeyboardHeight(0);
        setIsSelectMode(false);
        setSelectedPosts([]);
        setQuerySelectedPost(null);
      });
    }
  }, [visible]);

  const handleCloseModal = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(deckTranslateY, { toValue: height, duration: 80, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleActionSelected = (action: TradeAction) => {
    if (action.actionType === 'offer' && action.subAction === 'write') {
      if (!isSelectMode) { 
        setIsSelectMode(true); 
        if (topPostIndex !== null) 
          setSelectedPosts([topPostIndex]); 
      }
      else if (topPostIndex !== null) {
        setSelectedPosts(prev =>
          prev.includes(topPostIndex) ? prev.filter(i => i !== topPostIndex) : [...prev, topPostIndex]
        );
      }
    }
    if (action.actionType === 'offer' && action.subAction === 'select') {
      setIsSelectMode(false); setSelectedPosts([]);
    }
  };

  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

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
                    posts={deckPosts}
                    user={deckUser}
                    cardWidth={Math.min(width - 36, 400)}
                    enabled={true}
                    isUser={false}
                   
                    isSelectMode={isOfferActive && isSelectMode}
                    isQueryMode={isQueryActive}
                    selectedPosts={selectedPosts}
                    onTopCardChange={setTopPostIndex}
                    selectColor={colors.actions.offer}
                    showLocation={true}
                    externalLocations={externalLocations}
                    onHorizontalGestureStart={() => setScrollEnabled(false)}
                    onGestureEnd={() => setScrollEnabled(true)}
                    jumpToken={jumpToken}
                    jumpToCardIndex={jumpToIndex}
                    querySelectedPostIndex={querySelectedPost}
                    onSelectPost={(postIndex) => {
                      if (!isSelectMode) setIsSelectMode(true);
                      setSelectedPosts(prev =>
                        prev.includes(postIndex)
                          ? prev.filter(i => i !== postIndex)
                          : [...prev, postIndex]
                      );
                    }}
                    
                  />
                </View>
              )}

              <View style={styles.turnsAndButtonColumn}>
                <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
                  <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
                </View>
                <View style={styles.actionRow}>
                  <TradeUI
                    actions={feedActions}
                    onActionSelected={handleActionSelected}
                    onQueryToggle={setIsQueryOpen}
                    isSelectMode={isSelectMode}
                    selectedCount={selectedPosts.length}
                    topCardIsSelected={topCardIsSelected}
                    isQueryMode={true}
                    queryPostSelected={querySelectedPost !== null}
                    onQueryPostSelect={() => setQuerySelectedPost(topPostIndex)}
                    onQueryPostDeselect={() => setQuerySelectedPost(null)}
                    onActionChange={setActiveActionType}
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