import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Deck from './Deck';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import { TRADE_ACTIONS } from '../config/tradeConfig';
import { deckStyles, makeCountBar, makeIconButton, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';

const SLIDE_MARGIN = 0;
const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnOffer', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
];

const PRIMARY_USER = {
  name: 'Sam Casebeer',
  pronouns: '(they/them)',
  location: 'Santa Cruz, CA',
  bio: 'UCSC 2026 for Computer Science, multimedia visual artist, sci-fi/fantasy reader, cat lover',
  profileImageUrl: 'https://picsum.photos/seed/tutor1/600/600',
  rating: 4.2,
  reviewCount: 12,
};

const SECONDARY_USER = {
  name: 'Jay Wilson',
  pronouns: '(she/he/they)',
  location: 'Santa Cruz, CA',
  bio: 'Pro Smasher',
  profileImageUrl: 'https://picsum.photos/seed/bird/800/800',
};

export interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface ProfileDeckProps {
  posts: Post[];
  secondaryPosts?: Post[];
  onToggleReveal?: () => void;
  toggleEnabled?: boolean;
  isDeckRevealed?: boolean;
}

export default function ProfileDeck({
  posts,
  secondaryPosts = [],
  onToggleReveal,
  toggleEnabled = false,
  isDeckRevealed = false,
}: ProfileDeckProps) {
  const router = useRouter();
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
  const [tradeTurns, setTradeTurns] = useState<TradeTurn[]>(trade1Turns);

  // Track what type of card is on top of the primary deck
  const [topCardType, setTopCardType] = useState<'user' | 'post' | 'datetime' | 'location'>('user');
  // Edit mode — only meaningful when topCardType === 'user'
  const [isEditMode, setIsEditMode] = useState(false);
  // Post edit mode — only meaningful when topCardType === 'post'
  const [isPostEditMode, setIsPostEditMode] = useState(false);

  // When the top card changes away from its type, exit the relevant edit mode
  useEffect(() => {
    if (topCardType !== 'user') setIsEditMode(false);
    if (topCardType !== 'post') setIsPostEditMode(false);
  }, [topCardType]);

  const itemCount = useMemo(() => posts.length, [posts]);

  const animateOpen = useCallback((toHeight: number) => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      useNativeDriver: false,
      duration: 300,
    }).start();
  }, [slideAnim]);

  const animateClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      useNativeDriver: false,
      duration: 300,
    }).start(({ finished }) => {
      if (finished) {
        setShowSecondary(false);
        setSecondaryHeight(0);
        setIsTradeSelectMode(false);
        setSelectedSecondaryPosts([]);
        setIsTradeQueryOpen(false);
        pendingOpenRef.current = false;
      }
    });
  }, [slideAnim]);

  useEffect(() => {
    if (isDeckRevealed) {
      pendingOpenRef.current = true;
      setShowSecondary(true);
    } else {
      animateClose();
    }
  }, [isDeckRevealed]);

  const handleSecondaryLayout = (h: number) => {
    if (h === 0) return;
    setSecondaryHeight(h);
    if (pendingOpenRef.current) {
      pendingOpenRef.current = false;
      animateOpen(h);
    }
  };

  const handleTradeActionSelected = (action: TradeAction) => {
    if (action.actionType === 'trade' && action.subAction === 'write') {
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

  const handleTopSecondaryCardChange = (postIndex: number | null) =>
    setTopSecondaryPostIndex(postIndex);
  const handleTradeQueryToggle = (isOpen: boolean) => setIsTradeQueryOpen(isOpen);

  const topSecondaryCardIsSelected =
    topSecondaryPostIndex !== null && selectedSecondaryPosts.includes(topSecondaryPostIndex);

  const tradeActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['trade', 'query', 'decline'].includes(a.actionType)),
    []
  );

  const cardWidth = Math.min(width - 36, 400);

  const spacerHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, secondaryHeight + SLIDE_MARGIN],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Offers bar */}
      <View style={[deckStyles.itemCountRow, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={styles.queryButton}
          onPress={() => setIsQueryDrawerOpen(prev => !prev)}
        >
          <Text style={[deckStyles.actionButtonText, { color: colors.actions.query }]}>
            1 QUERY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.offerButton}
          onPress={onToggleReveal}
          disabled={!toggleEnabled}
        >
          <Text style={[deckStyles.actionButtonText, { color: colors.actions.offer }]}>
            2 OFFERS
          </Text>
          <Text style={[deckStyles.countText, { marginLeft: 'auto' }]}>0{itemCount}</Text>
          <FontAwesome6 name="arrows-rotate" size={24} color={colors.ui.secondarydisabled} />
        </TouchableOpacity>
      </View>

      {/* Decks */}
      <View style={styles.decksContainer}>

        {/* Secondary deck */}
        {showSecondary && secondaryPosts.length > 0 && (
          <View
            style={styles.secondaryDeckContainer}
            onLayout={e => handleSecondaryLayout(e.nativeEvent.layout.height)}
          >
            <View style={deckStyles.deckWrapper}>
              <Deck
                posts={secondaryPosts}
                user={SECONDARY_USER}
                cardWidth={cardWidth}
                enabled
                isSelectMode={isTradeSelectMode}
                selectedPosts={selectedSecondaryPosts}
                onTopCardChange={handleTopSecondaryCardChange}
                selectColor={colors.actions.trade}
              />
            </View>
            <View style={[deckStyles.turnsAndButtonRow, { marginBottom: 4 }]}>
              <View style={deckStyles.actionRow}>
                <TradeUI
                  actions={tradeActions}
                  onActionSelected={handleTradeActionSelected}
                  onQueryToggle={handleTradeQueryToggle}
                  isSelectMode={isTradeSelectMode}
                  selectedCount={selectedSecondaryPosts.length}
                  topCardIsSelected={topSecondaryCardIsSelected}
                />
              </View>
              <View style={deckStyles.turnsRow}>
                <TradeTurns turns={tradeTurns} isQueryOpen={isTradeQueryOpen} />
              </View>
            </View>
          </View>
        )}

        {/* Spacer */}
        <Animated.View style={{ height: spacerHeight }} pointerEvents="none" />

        {/* Primary deck */}
        <View style={styles.primaryDeckWrapper}>
          <View style={styles.primaryDeckColumn}>
            <View style={deckStyles.deckWrapper}>
              <Deck
                posts={posts}
                user={PRIMARY_USER}
                cardWidth={cardWidth}
                enabled
                onTopCardTypeChange={setTopCardType}
                isUser={true}
                isEditMode={isEditMode}
                onExitEdit={() => setIsEditMode(false)}
                onEnterEdit={() => setIsEditMode(true)}
                isPostEditMode={isPostEditMode}
                onExitPostEdit={() => setIsPostEditMode(false)}
                onEnterPostEdit={() => setIsPostEditMode(true)}
              />
            </View>
            {isQueryDrawerOpen && (
              <View style={styles.queryDrawer}>
                <TradeTurns
                  turns={[
                    { type: 'turnQuery', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
                  ]}
                />
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.addButton} onPress={() => {}}>
                <FontAwesome6 name="circle-plus" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => {}}>
                <FontAwesome6 name="circle-xmark" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.myItemCountBar}>
                <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
                <FontAwesome6 name="circle-dot" size={24} color={colors.ui.secondarydisabled} />
                <Text style={[deckStyles.countText, { color: colors.actions.trade }]}>
                  0{itemCount}
                </Text>
                <FontAwesome6 name="arrows-rotate" size={24} color={colors.actions.trade} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    alignItems: 'center',
    overflow: 'visible',
  },
  decksContainer: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  primaryDeckWrapper: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  primaryDeckColumn: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.ui.background,
    paddingBottom: 50,
  },
  secondaryDeckContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
    zIndex: 1,
    elevation: 1,
    backgroundColor: colors.ui.background,
  },
  queryDrawer: {
    width: DECK_BAR_WIDTH,
  },
  buttonRow: {
    width: DECK_BAR_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  myItemCountBar: {
    height: 44,
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    ...barRadius.bottomRightCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offerButton: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    height: 36,
    ...barRadius.rightCap,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.secondary,
    gap: 8,
  },
  queryButton: {
    flexShrink: 0,
    paddingLeft: 16,
    paddingRight: 12,
    height: 36,
    ...barRadius.leftCap,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ui.secondary,
  },
  deleteButton: {
    ...makeIconButton('flat'),
  },
  editButton: {
    ...makeIconButton('flat'),
  },
  addButton: {
    ...makeIconButton('bottomLeftCap'),
  },
});