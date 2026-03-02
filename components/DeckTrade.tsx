import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

import { defaultTextStyle, globalFonts, colors} from '../styles/globalStyles';
import TradeUI from './TradeActions';
import TradeTurns, { TradeTurn, TradeTurnType } from './TradeTurns';
import { TRADE_ACTIONS, TradeActionType, TradeActionConfig } from '../config/tradeConfig';

const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
  { type: 'turnCounter', isUser: true  },
  { type: 'turnTrade', user: 'Jay Wilson', item: 'Bike Repair', isUser: false  },
  { type: 'turnOffer', item: 'Fantasy Books', isUser: true  },
];

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface TradeDeckProps {
  posts: Post[];
  actions: TradeActionConfig[];
  onHorizontalGestureStart?: () => void; 
  onGestureEnd?: () => void;  
}

const DECK_WIDTH = width - 40;

export default function TradeDeck({ posts, actions, onHorizontalGestureStart, onGestureEnd }: TradeDeckProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isQueryOpen, setIsQueryOpen] = useState(false);
  const [turns, setTurns] = useState<TradeTurn[]>(trade1Turns);

  const slideAnim = useRef(new Animated.Value(-11)).current;

  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  const handleSwitchDecks = () => {
    const toValue = showingPlayer ? -11 : -(DECK_WIDTH) - 38;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setShowingPlayer(!showingPlayer);
  };

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
      <View style={styles.column}>

        <View style={styles.goodServiceRow}>
          <View style={styles.goodServiceButtonParter}>
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.good }]}>0{goodCount}</Text>
            <FontAwesome6 name="gifts" size={18} color={showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.good} />
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.service }]}> 0{serviceCount}</Text>
            <FontAwesome6 name="hand-sparkles" size={18} color={showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.service} />
          </View>
          <TouchableOpacity style={styles.switchDecksButton} onPress={handleSwitchDecks}>
            <FontAwesome6 name={showingPlayer ? "angle-right" : "angle-left"} size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.goodServiceButtonPlayer}>
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled }]}>0{goodCount}</Text>
            <FontAwesome6 name="gifts" size={18} color={showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled} />
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.cardTypes.service : colors.ui.secondarydisabled }]}> 0{serviceCount}</Text>
            <FontAwesome6 name="hand-sparkles" size={18} color={showingPlayer ? colors.cardTypes.service : colors.ui.secondarydisabled} />
          </View>
        </View>

        <View style={styles.deckClipWindow}>
          <Animated.View style={[styles.decksRow, { transform: [{ translateX: slideAnim }] }]}>
            <View style={{ width: DECK_WIDTH }}>
              <Deck posts={posts} 
                cardWidth={DECK_WIDTH} 
                enabled={true} 
                onHorizontalGestureStart={onHorizontalGestureStart}
                onGestureEnd={onGestureEnd}  
              />
            </View>
            <View style={{ width: DECK_WIDTH }}>
              <Deck posts={posts} 
                cardWidth={DECK_WIDTH} 
                enabled={true} 
                onHorizontalGestureStart={onHorizontalGestureStart}
                onGestureEnd={onGestureEnd}         
              />
            </View>
          </Animated.View>
        </View>

        <View style={styles.turnsAndButtonRow}>
          <TradeUI
            actions={actions}
            onQueryToggle={setIsQueryOpen}
          />
          {isExpanded && (
            <View style={styles.turnsRows}>
              <TradeTurns
                turns={turns}
                isQueryOpen={isQueryOpen}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.collapseBar}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <FontAwesome6 name={isExpanded ? "angle-up" : "angle-down"} size={26} color="#fff" />
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
    bottom: 400,
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  goodServiceRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    alignSelf: 'center',
  },
  deckClipWindow: {
    width: width,
    overflow: 'hidden',
    alignItems: 'flex-start',
    paddingTop: 20,      
    marginTop: -20,    
    paddingBottom: 20,  
    marginBottom: -20,    
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 27,
    zIndex: 30,
  },
  switchDecksButton: {
    width: 50,
    height: 36,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ui.secondary,
  },
  goodServiceButtonParter: {
    height: 36,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  goodServiceButtonPlayer: {
    height: 36,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  turnsAndButtonRow: {
    width: 334,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
    gap: 4,
  },
  turnsRows: {
    top: -6,
  },
  secondaryText: {
    color: colors.ui.secondarydisabled,
    fontSize: 20,
    fontFamily: globalFonts.bold,
  },
  goodText: {
    color: colors.cardTypes.good,
    fontSize: 20,
    fontFamily: globalFonts.bold,
  },
  serviceText: {
    color: colors.cardTypes.service,
    fontSize: 20,
    fontFamily: globalFonts.bold,
  },
  collapseBar: {
    top: -10,
    width: 334,
    height: 36,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
});