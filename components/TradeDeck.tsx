import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';

import { defaultTextStyle, globalFonts, colors} from '../styles/globalStyles';
import TradeUI from '../components/TradeUI';
import TradeTurns, { TradeTurn, TradeTurnType } from '../components/TradeTurns';

const { width } = Dimensions.get('window');

const trade1Turns: TradeTurn[] = [
  { type: 'turnAccept', user: 'Jay Wilson', isUser: false  },
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

}

const DECK_WIDTH = Math.min(width - 40, 600);

export default function TradeDeck({ posts}: TradeDeckProps) {
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const slideAnim = useRef(new Animated.Value(DECK_WIDTH/2 + 2)).current;

  // Count good and service posts
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  const handleSwitchDecks = () => {
    const toValue = showingPlayer ? DECK_WIDTH/2 + 2: -DECK_WIDTH/2 - 28;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setShowingPlayer(!showingPlayer);
  };

  const handleOffer = () => {
    console.log('Offer button pressed');
  };
  const handleCollapseTurns = () => {
    console.log('Collapse turn button pressed');
  };
  const handlePlayAction = () => {
    console.log('Collapse turn button pressed');
  };
  


  return (
    <View style={styles.modalContent} pointerEvents="box-none">

      <View style={styles.column}>

        {/* ONE shared good/service row */}
        <View style={styles.goodServiceRow}>
          <View style={styles.goodServiceButtonParter}>
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.good }]}>0{goodCount}</Text>
            <FontAwesome6 name="gifts" size={18} color={showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.good} />

            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.service }]}> 0{serviceCount}</Text>
            <FontAwesome6 name="hand-sparkles" size={18} color={showingPlayer ? colors.ui.secondarydisabled : colors.cardTypes.service} />
          </View>  
          <TouchableOpacity 
            style={styles.switchDecksButton}
            onPress={handleSwitchDecks}
          >
            <FontAwesome6 name={showingPlayer ? "angle-right" : "angle-left"} size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.goodServiceButtonPlayer}>
            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled }]}>0{goodCount}</Text>
            <FontAwesome6 name="gifts" size={18} color={showingPlayer ? colors.cardTypes.good : colors.ui.secondarydisabled} />

            <Text style={[styles.secondaryText, { color: showingPlayer ? colors.cardTypes.service : colors.ui.secondarydisabled }]}> 0{serviceCount}</Text>
            <FontAwesome6 name="hand-sparkles" size={18} color={showingPlayer ? colors.cardTypes.service : colors.ui.secondarydisabled} />
          </View>

        </View>

        {/* BOTH decks in ONE row wrapper, sliding animated */}
        <Animated.View
          style={[
            styles.decksRow,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <View style={{ width: DECK_WIDTH }}>
            <Deck 
              posts={posts}
              cardWidth={DECK_WIDTH}
              enabled={true}
            />
          </View>

          <View style={{ width: DECK_WIDTH }}>
            <Deck 
              posts={posts}
              cardWidth={DECK_WIDTH}
              enabled={true}
            />
          </View>
        </Animated.View>


        <View style={styles.turnsAndButtonRow}>
          <TradeUI />
          {isExpanded && (
            <View style={styles.turnsRows}>
              <TradeTurns turns={trade1Turns} />
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
  animatedContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deckWrapperPartner: {
    left: -12,
    bottom: -32,
    width: DECK_WIDTH,
  },
  deckWrapperPlayer: {
    left: -12,
    bottom: -32,
    width: DECK_WIDTH,
  },

  turnsAndButtonRow: {
    width: 334,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    
    top: 302,
    left: 0, 
    zIndex: 10,
    
  },
  goodServiceRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -198,
    left: 0,
    zIndex: 0,
  },
  switchDecksButton: {
    width: 50,
    height: 36,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    
    justifyContent: 'center',
    alignItems: 'center',
   
    backgroundColor: colors.ui.secondary, 
    
  },
  saveButton: {
    width: 54,
    height: 44,
    
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
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
  turnsRows: {
    top: -8
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    left: 0,
    bottom: -32,
    gap: 30,
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
  top: 290,
    width: 334,
    height: 36,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
},
  

});
