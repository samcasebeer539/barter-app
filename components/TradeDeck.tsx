import React, { useState, useMemo } from 'react';
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

interface FeedDeckProps {
  posts: Post[];

}

export default function FeedDeck({ posts}: FeedDeckProps) {
  
  
  const [isExpanded, setIsExpanded] = useState(true);
  // Count good and service posts
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);





  const handleOffer = () => {
    console.log('Offer button pressed');
    // Add your offer logic here
  };
  const handleCollapseTurns = () => {
    console.log('Collapse turn button pressed');
    // Add your offer logic here
  };
  const handlePlayAction = () => {
    console.log('Collapse turn button pressed');
    // Add your offer logic here
  };
  


  return (
 

      <View style={styles.modalContent} pointerEvents="box-none">

     
          <View style={styles.column}>
            
            <View style={styles.deckWrapperPlayer}>
              <View style={styles.goodServiceRow}>
              
             
              <View style={styles.goodServiceButton}>
       
                <Text style={styles.offerButtonText}> 0{goodCount}</Text>
                <FontAwesome6 name="gifts" size={18} color={colors.cardTypes.good} />
                
                <Text style={styles.offerButtonText}> 0{serviceCount}</Text>
                <FontAwesome6 name="hand-sparkles" size={18} color={colors.cardTypes.service} />
              </View>
             

              <TouchableOpacity 
                style={[
                  styles.upButton, 
                
                ]}
                onPress={() => setIsExpanded(!isExpanded)}
              >
              <FontAwesome6 name={isExpanded ? "angle-left" : "angle-right"} size={26} color="#fff" />
              </TouchableOpacity>

              
            </View>
              <Deck 
                posts={posts}
                cardWidth={Math.min(width - 40, 290)}
                enabled={true}
              />
            </View>
            <View style={styles.deckWrapperPartner}>

            <View style={styles.goodServiceRow}>
              
             
              <View style={styles.goodServiceButton}>
       
                <Text style={styles.offerButtonText}> 0{goodCount}</Text>
                <FontAwesome6 name="gifts" size={18} color={colors.cardTypes.good} />
                
                <Text style={styles.offerButtonText}> 0{serviceCount}</Text>
                <FontAwesome6 name="hand-sparkles" size={18} color={colors.cardTypes.service} />
              </View>
             

              <TouchableOpacity 
                style={[
                  styles.upButton, 
                
                ]}
                onPress={() => setIsExpanded(!isExpanded)}
              >
              <FontAwesome6 name={isExpanded ? "angle-right" : "angle-left"} size={26} color="#fff" />
              </TouchableOpacity>

              
            </View>
              <Deck 
                posts={posts}
                cardWidth={Math.min(width - 40, 290)}
                enabled={true}
              />
            </View>
            
            
          
            <View style={styles.turnsAndButtonRow}>
              
              <TradeUI />
              {isExpanded && (
                <View style={styles.turnsRows}><TradeTurns turns={trade1Turns} /></View>
              )}
                
            </View>

          </View>

    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
 
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
    marginBottom: 20,
    
    left: -42,
    top: -108
  },
  deckWrapperPlayer: {
    marginBottom: 20,
    left: 272,
    top: -44
  },

  turnsAndButtonRow: {
    width: 334,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed from flex-end
    
    top: 100,
    left: 0, 
    zIndex: 10,
    
  },
  goodServiceRow: {
    width: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -198,
    left: 12,
    zIndex: 0,
  },
  upButton: {
    width: 50,
    height: 36,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    
    justifyContent: 'center',
    alignItems: 'center',
   
    backgroundColor: colors.ui.secondary, 
    marginRight: 'auto'
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
  playButton: {
    
    width: 50,
    height: 40,
    
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    borderWidth: 3,
    borderColor: colors.actions.offer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.actions.offer,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    
    
  },
  offerText: {
    color: colors.actions.offer,
    fontSize: 48,
    fontFamily: globalFonts.extrabold,
    top: -2,
    shadowColor: colors.actions.offer,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    
    
  },

  offerButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: globalFonts.bold
    
  },
  goodServiceButton: {
    
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
  turnsRows: {
    top: -8
  }
  

});
