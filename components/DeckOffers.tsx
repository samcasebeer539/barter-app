import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post } from '@/types/index';

const { width } = Dimensions.get('window');

export type OfferDeckType = 'queries' | 'offers' | 'declined' | 'deals';

interface OfferDeckProps {
  posts: Post[];
  deckType: OfferDeckType;
  actions?: TradeActionConfig[];
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
}

const DECK_LABELS: Record<OfferDeckType, { text: string; color: string }> = {
  queries:  { text: 'QUERIES',  color: colors.actions.query   },
  offers:   { text: 'OFFERS',   color: colors.actions.offer   },
  declined: { text: 'DECLINED', color: colors.actions.decline },
  deals:    { text: 'DEALS',    color: colors.actions.accept  },
};

const HAS_ACTIONS: Record<OfferDeckType, boolean> = {
  queries:  true,
  offers:   true,
  declined: false,
  deals:    false,
};

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery', isUser: true },
];

export default function OfferDeck({
  posts,
  deckType,
  actions = [],
  onHorizontalGestureStart,
  onGestureEnd,
}: OfferDeckProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);

  const itemCount = useMemo(() => posts.length, [posts]);
  const label = DECK_LABELS[deckType];
  const hasActions = HAS_ACTIONS[deckType];
  const isQueryDeck = deckType === 'queries';

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

  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
      <View style={deckStyles.column}>
        <View style={deckStyles.itemCountRow}>
          <View style={styles.statusBar}>
            <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: label.color }]}>
              {label.text}
            </Text>
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
              onTopCardChange={setTopPostIndex}
              selectColor={selectColor}
              isQueryMode={isQueryDeck}
              querySelectedPostIndex={querySelectedPost}
            />
          </View>
        )}

        {isExpanded && (
          <View style={styles.turnsAndButtonColumn}>
            <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
              <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
            </View>
            {hasActions && (
              <View style={styles.actionRow}>
                <TradeUI
                  actions={actions}
                  onActionSelected={handleActionSelected}
                  onQueryToggle={setIsQueryOpen}
                  isSelectMode={isSelectMode}
                  selectedCount={selectedPosts.length}
                  topCardIsSelected={topCardIsSelected}
                  isQueryMode={isQueryDeck}
                  queryPostSelected={querySelectedPost !== null}
                  onQueryPostSelect={() => setQuerySelectedPost(topPostIndex)}
                  onQueryPostDeselect={() => setQuerySelectedPost(null)}
                />
              </View>
            )}
            <View style={styles.turnsRow}>
              <TradeTurns turns={trade1Turns} />
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
  modalContent: { width: '100%', position: 'relative', alignItems: 'center' },
  statusBar: { ...makeCountBar('pill', 'flex-end') },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH, },
  queryRow: {},
  actionRow: {marginBottom: -2},
  turnsRow: {},
  collapseBar: {
    
    width: DECK_BAR_WIDTH,
    height: 44,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
    marginBottom: 6,
  },
});