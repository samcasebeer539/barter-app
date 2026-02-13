import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { defaultTextStyle, globalFonts, colors} from '../styles/globalStyles';
import TradeUI from '../components/TradeUI';

const { width } = Dimensions.get('window');

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
            <View style={styles.goodServiceRow}>
              
             
              <View style={styles.goodServiceButton}>
                <Text style={styles.offerButtonText}>{serviceCount}</Text>
                <FontAwesome6 name="user-astronaut" size={22} color={colors.cardTypes.user} />

                <Text style={styles.offerButtonText}>{goodCount}</Text>
                <FontAwesome6 name="gifts" size={22} color={colors.cardTypes.good} />
                
                <Text style={styles.offerButtonText}>{serviceCount}</Text>
                <FontAwesome6 name="hand-sparkles" size={22} color={colors.cardTypes.service} />
              </View>
             

              <TouchableOpacity 
                style={styles.upButton}
                onPress={handleCollapseTurns}
              >
                <FontAwesome6 name="chevron-up" size={26} color="#ffffff" />
              </TouchableOpacity>

              
            </View>
            
            <View style={styles.deckWrapper}>
              <Deck 
                posts={posts}
                cardWidth={Math.min(width - 40, 400)}
                enabled={true}
              />
            </View>

            
            {/* <View style={styles.buttonRow}>
              

              <TouchableOpacity onPress={handleOffer} >
                  <Text style={styles.offerText}>OFFER</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.playButton}
                onPress={handlePlayAction}
              >
                <FontAwesome6 name='arrow-left-long' size={26} color={colors.actions.offer} />
              </TouchableOpacity>        
            </View> */}
            <View style={styles.buttonRow}><TradeUI /></View>
            

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
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  deckWrapper: {
    marginBottom: 20,
    left: -12,
  },
  buttonRow: {
    width: 370,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    top: 244,
    left: 0,
  },
  goodServiceRow: {
    width: 320,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -232,
    left: 0,
    zIndex: 0,
  },
  upButton: {
    width: 54,
    height: 44,
    
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
   
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
    marginRight: 'auto'
    
  },

  offerButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: globalFonts.bold
    
  },
  goodServiceButton: {
    
    height: 44,
    width: 180,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginLeft: 'auto',
    
  },
  

});
