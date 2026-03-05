import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TRADE_ACTIONS, TradeActionConfig } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH, } from '../styles/deckStyles';

const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery',   user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
  { type: 'turnCounter', isUser: true },
  { type: 'turnTrade',   user: 'Jay Wilson', item: 'Bike Repair',   isUser: false },
  { type: 'turnOffer',   item: 'Fantasy Books',                      isUser: true  },
];

interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface TradeDeckProps {
  posts: Post[];
  actions: TradeActionConfig[];
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  showDateTime?: boolean;
  showLocation?: boolean;
}

const DECK_WIDTH = Math.min(width - 36, 400);

export default function TradeDeck({
  posts,
  actions,
  showDateTime = false,
  showLocation = false,
  onHorizontalGestureStart,
  onGestureEnd,
}: TradeDeckProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [turns, setTurns] = useState<TradeTurn[]>(trade1Turns);

  const slideAnim = useRef(new Animated.Value(-12)).current;

  const itemCount = useMemo(() => posts.length, [posts]);

  const handleSwitchDecks = () => {
    const toValue = showingPlayer ? -12 : -(DECK_WIDTH) - 38;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setShowingPlayer(prev => !prev);
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
            <FontAwesome6 name="circle-user" size={22} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, !showingPlayer && styles.activeText]}>0{itemCount}</Text>
            <FontAwesome6
              name="arrows-rotate"
              size={22}
              color={!showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playerBar} onPress={handleSwitchDecks}>
            <FontAwesome6 name="circle-user" size={22} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, showingPlayer && styles.activeText]}>0{itemCount}</Text>
            <FontAwesome6
              name="arrows-rotate"
              size={22}
              color={showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled}
            />
          </TouchableOpacity>
        </View>

        {/* Sliding deck window */}
        <View style={styles.deckClipWindow}>
          <Animated.View style={[styles.decksRow, { transform: [{ translateX: slideAnim }] }]}>
            <View style={{ width: DECK_WIDTH }}>
              <Deck posts={posts} {...sharedDeckProps} />
            </View>
            <View style={{ width: DECK_WIDTH }}>
              <Deck posts={posts} {...sharedDeckProps} />
            </View>
          </Animated.View>
        </View>

        {/* Actions + turns */}
        <View style={deckStyles.turnsAndButtonRow}>
          {isExpanded && (
          <TradeUI actions={actions} onQueryToggle={setIsQueryOpen} />
          )}
          {isExpanded && (
            <View style={deckStyles.turnsRow}>
              <TradeTurns turns={turns} isQueryOpen={isQueryOpen} />
            </View>
          )}
        </View>

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
  // Partner bar: left-cap, count left-aligned
  partnerBar: {
    ...makeCountBar('leftCap', 'flex-start'),
  },
  // Player bar: right-cap, count right-aligned
  playerBar: {
    ...makeCountBar('rightCap', 'flex-end'),
  },
  activeText: {
    color: colors.cardTypes.good,
  },
  deckClipWindow: {
    width: width,
    overflow: 'hidden',
    alignItems: 'flex-start',
   
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 26,
    zIndex: 30,
  },
  
  collapseBar: {
    top: -6,
    width: DECK_BAR_WIDTH,
    height: 36,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
});