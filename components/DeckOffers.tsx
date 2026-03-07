import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';

const { width } = Dimensions.get('window');

interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface OfferDeckProps {
  posts: Post[];
  actions: TradeActionConfig[];
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  isOffer?: boolean;
  isDecline?: boolean;
}

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery', isUser: true },
];

export default function OfferDeck({ posts, actions, onHorizontalGestureStart, onGestureEnd, isOffer, isDecline }: OfferDeckProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  const itemCount = useMemo(() => posts.length, [posts]);

  const selectColor = useMemo(
    () => actions.find(a => a.hasButtons)?.color ?? colors.actions.offer,
    [actions]
  );

  const handleActionSelected = (action: TradeAction) => {
    if (action.subAction === 'write') {
      if (!isSelectMode) {
        setIsSelectMode(true);
        if (topPostIndex !== null) setSelectedPosts([topPostIndex]);
      } else {
        if (topPostIndex !== null) {
          setSelectedPosts(prev =>
            prev.includes(topPostIndex)
              ? prev.filter(i => i !== topPostIndex)
              : [...prev, topPostIndex]
          );
        }
      }
    }
    if (action.subAction === 'select') {
      setIsSelectMode(false);
      setSelectedPosts([]);
    }
  };

  const handleTopCardChange = (postIndex: number | null) => setTopPostIndex(postIndex);

  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
      <View style={deckStyles.column}>
        <View style={deckStyles.itemCountRow}>
          
          <View style={styles.statusBar}>
            {isOffer && !isDecline && (
              <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: colors.actions.offer }]}>
                12 OFFERS
              </Text>
            )}
            {!isOffer && !isDecline && (
              <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: colors.actions.query }]}>
                6 QUERIES
              </Text>
            )}
            {isDecline && (
              <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: colors.actions.decline }]}>
                6 DECLINES
              </Text>
            )}

            <Text style={deckStyles.countText}>0{itemCount}</Text>
            <FontAwesome6 name='arrows-rotate' size={22} color={colors.ui.secondarydisabled} />
          </View>
        </View>
        {isExpanded && (
        <View style={deckStyles.deckWrapper}>
          <Deck
            posts={posts}
            cardWidth={Math.min(width - 36, 400)}
            enabled={true}
            onHorizontalGestureStart={onHorizontalGestureStart}
            onGestureEnd={onGestureEnd}
            isSelectMode={isSelectMode}
            selectedPosts={selectedPosts}
            onTopCardChange={handleTopCardChange}
            selectColor={selectColor}
          />
        </View>
        )}
        <View style={deckStyles.turnsAndButtonRow}>
          {isExpanded && (
            <View style={deckStyles.actionRow}>
              <TradeUI
                actions={actions}
                onActionSelected={handleActionSelected}
                onQueryToggle={setIsQueryOpen}
                isSelectMode={isSelectMode}
                selectedCount={selectedPosts.length}
                topCardIsSelected={topCardIsSelected}
              />
            </View>
          )}
          {isExpanded && (
            <View style={[deckStyles.turnsRow]}>
              <TradeTurns turns={trade1Turns} isQueryOpen={isQueryOpen} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.collapseBar, {top: isExpanded ? -6 : -8}]}
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
  statusBar: {
    ...makeCountBar('pill', 'flex-end'),
  },
  collapseBar: {
    top: -6,
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