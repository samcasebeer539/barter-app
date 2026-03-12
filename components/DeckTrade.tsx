import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TRADE_ACTIONS, TradeActionConfig } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post } from '@/types/index';

const { width } = Dimensions.get('window');



interface TradeDeckProps {
  posts: Post[];
  actions: TradeActionConfig[];
  turns: TradeTurn[];
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  showDateTime?: boolean;
  showLocation?: boolean;
}

const DECK_WIDTH = Math.min(width - 36, 400);

export default function TradeDeck({
  posts,
  actions,
  turns,
  showDateTime = false,
  showLocation = false,
  onHorizontalGestureStart,
  onGestureEnd,
}: TradeDeckProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  // Partner deck (left) — the other user's posts, query-selectable
  const [partnerTopPostIndex, setPartnerTopPostIndex] = useState<number | null>(null);
  const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);

  // Player deck (right) — own posts, barter-selectable
  const [playerTopPostIndex, setPlayerTopPostIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

  const slideAnim = useRef(new Animated.Value(-12)).current;
  const itemCount = useMemo(() => posts.length, [posts]);

  const handleSwitchDecks = () => {
    const toValue = showingPlayer ? -12 : -(DECK_WIDTH) - 38;
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 60, friction: 10 }).start();
    setShowingPlayer(prev => !prev);
  };

  const topPostIndex = showingPlayer ? playerTopPostIndex : partnerTopPostIndex;
  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

  const handleActionSelected = (action: TradeAction) => {
    if (action.actionType === 'barter' && action.subAction === 'write') {
      if (!isSelectMode) {
        setIsSelectMode(true);
        if (playerTopPostIndex !== null) setSelectedPosts([playerTopPostIndex]);
      } else {
        if (playerTopPostIndex !== null) {
          setSelectedPosts(prev =>
            prev.includes(playerTopPostIndex)
              ? prev.filter(i => i !== playerTopPostIndex)
              : [...prev, playerTopPostIndex]
          );
        }
      }
    }
    if (action.actionType === 'barter' && action.subAction === 'select') {
      setIsSelectMode(false);
      setSelectedPosts([]);
    }
  };

  const sharedDeckProps = {
    cardWidth: DECK_WIDTH,
    enabled: true,
    onHorizontalGestureStart,
    onGestureEnd,
    showDateTime,
    showLocation,
  };

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
      <View style={deckStyles.column}>
        {/* Partner / Player switcher bar */}
        <View style={deckStyles.itemCountRow}>
          <TouchableOpacity style={styles.partnerBar} onPress={handleSwitchDecks}>
            <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, !showingPlayer && styles.activeText]}>0{itemCount}</Text>
            <FontAwesome6 name="arrows-rotate" size={24} color={!showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playerBar} onPress={handleSwitchDecks}>
            <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, showingPlayer && styles.activeText]}>0{itemCount}</Text>
            <FontAwesome6 name="arrows-rotate" size={24} color={showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.deckClipWindow}>
            <Animated.View style={[styles.decksRow, { transform: [{ translateX: slideAnim }] }]}>
              {/* Partner deck — query mode */}
              <View style={{ width: DECK_WIDTH }}>
                <Deck
                  posts={posts}
                  {...sharedDeckProps}
                  isUser={false}
                  onTopCardChange={setPartnerTopPostIndex}
                  isQueryMode={true}
                  querySelectedPostIndex={querySelectedPost}
                />
              </View>
              {/* Player deck — barter select mode */}
              <View style={{ width: DECK_WIDTH }}>
                <Deck
                  posts={posts}
                  {...sharedDeckProps}
                  isUser={true}
                  onTopCardChange={setPlayerTopPostIndex}
                  isSelectMode={isSelectMode}
                  selectedPosts={selectedPosts}
                  selectColor={colors.actions.trade}
                />
              </View>
            </Animated.View>
          </View>
        )}

        {/* Actions + turns */}
        {isExpanded && (
          <View style={styles.turnsAndButtonColumn}>
            <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
              <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
            </View>
            <View style={styles.actionRow}>
              <TradeUI
                actions={actions}
                onActionSelected={handleActionSelected}
                onQueryToggle={setIsQueryOpen}
                isSelectMode={isSelectMode}
                selectedCount={selectedPosts.length}
                topCardIsSelected={topCardIsSelected}
                isQueryMode={true}
                queryPostSelected={querySelectedPost !== null}
                onQueryPostSelect={() => setQuerySelectedPost(partnerTopPostIndex)}
                onQueryPostDeselect={() => setQuerySelectedPost(null)}
              />
            </View>
            <View style={styles.turnsRow}>
              <TradeTurns turns={turns} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.collapseBar}
          onPress={() => setIsExpanded(prev => !prev)}
        >
          <FontAwesome6 name={isExpanded ? 'angle-up' : 'angle-down'} size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {marginBottom: -2},
  turnsRow: {},
  partnerBar: {
    ...makeCountBar('leftCap', 'flex-start'),
  },
  playerBar: {
    ...makeCountBar('rightCap', 'flex-end'),
  },
  activeText: {
    color: colors.actions.trade,
  },
  deckClipWindow: {
    width: width,
    alignItems: 'flex-start',
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 26,
    zIndex: 30,
  },
  collapseBar: {
    top: 0,
    width: DECK_BAR_WIDTH,
    height: 44,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
});