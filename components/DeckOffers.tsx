import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, DECK_BAR_WIDTH } from '../styles/deckStyles';

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
}

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery', isUser: true },
];

const DECK_WIDTH = Math.min(width - 40, 600);

export default function OfferDeck({ posts, actions, onHorizontalGestureStart, onGestureEnd }: OfferDeckProps) {
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
            <Text style={deckStyles.countText}>0{itemCount}</Text>
            <FontAwesome6 name='arrows-rotate' size={22} color={colors.ui.secondarydisabled} />
          </View>
        </View>

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

        <View style={deckStyles.turnsRow}>
          <TradeTurns turns={trade1Turns} isQueryOpen={isQueryOpen} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    bottom: 600,
  },
  // pill shape — both ends capped
  statusBar: {
    ...makeCountBar('pill', 'flex-end'),
  },
});