import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface FeedDeckProps {
  posts: Post[];
  visible: boolean;
  onClose: () => void;
}

export default function FeedDeck({ posts, visible, onClose }: FeedDeckProps) {
  const deckTranslateY = useRef(new Animated.Value(-Dimensions.get('window').height)).current;
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      deckTranslateY.setValue(-Dimensions.get('window').height);

      Animated.spring(deckTranslateY, {
        toValue: Dimensions.get('window').height / 7,
        useNativeDriver: true,
        damping: 24,
        stiffness: 200,
      }).start();
    }
  }, [visible]);

  const handleCloseModal = () => {
    Animated.timing(deckTranslateY, {
      toValue: -Dimensions.get('window').height,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleOffer = () => {
    console.log('Offer button pressed');
    // Add your offer logic here
  };

  const handleSave = () => {
    console.log('Save button', showSaved);
    setShowSaved(prev => !prev);
  };

  if (!visible) return null;

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
        <View style={styles.goodServiceRow}>
            <View style={styles.goodButton}>
                <Text style={styles.tradeButtonText}>12</Text>
                <FontAwesome6 name="cube" size={22} color="#ffffff" />
            </View>
            <View style={styles.serviceButton}>
                <Text style={styles.tradeButtonText}>4</Text>
                <FontAwesome6 name="stopwatch" size={22} color="#ffffff" />
            </View>
        </View>
          
        <View style={styles.deckWrapper}>
            <Deck 
                posts={posts}
                cardWidth={Math.min(width - 40, 400)}
                enabled={true}
            />
        </View>

        {/* Button row with up chevron, offer button, and save button */}
        <View style={styles.buttonRow}>
        {/* plus button */}
        <TouchableOpacity 
            style={styles.plusButton}
            onPress={handleSave}
        >
            <FontAwesome6 name="plus" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Offer button */}
        <TouchableOpacity 
            style={styles.tradeButton}
            onPress={handleOffer}
        >
            <Text style={styles.tradeButtonText}>TRADE</Text>
        </TouchableOpacity>

        
        {/* minus button */}
        <TouchableOpacity 
            style={styles.minusButton}
            onPress={handleCloseModal}
        >
            <FontAwesome6 name="minus" size={22} color="#ffffff" />
        </TouchableOpacity>

    </View>
    </View>
  );
}

const styles = StyleSheet.create({

  modalContent: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    paddingHorizontal: 20,
    alignItems: 'center',
    bottom: 400,
  },
  animatedContainer: {
    position: 'absolute',
    bottom: 120,
  
    
    alignItems: 'center',
  },
  deckWrapper: {
    marginBottom: 20,
    left: -12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: 250,
  },
  goodServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: -226,
    zIndex: 6
  },
  plusButton: {
    width: 50,
    height: 50,
    
    borderTopRightRadius: 4,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
   
  },
  minusButton: {
    width: 50,
    height: 50,
    
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 25,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  tradeButton: {
    backgroundColor: '#1c8aff',
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  tradeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  goodButton: {
    width: 110,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  serviceButton: {
    width: 110,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: '#5c5579',
    justifyContent: 'center',
    alignItems: 'center',
    
  },

});
