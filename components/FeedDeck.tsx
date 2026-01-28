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
        toValue: 40,
        useNativeDriver: true,
        damping: 23,
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
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <TouchableOpacity 
        style={styles.modalBackground} 
        activeOpacity={1} 
        onPress={handleCloseModal}
      />
      <View style={styles.modalContent} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleCloseModal}
        >
          <FontAwesome6 name="angle-left" size={28} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          pointerEvents="auto"
          style={[
            styles.animatedDeck,
            {
              transform: [{ translateY: deckTranslateY }],
            },
          ]}
        >
          <Deck 
            posts={posts}
            cardWidth={Math.min(width - 40, 400)}
            enabled={true}
          />
        </Animated.View>

        {/* Offer button */}
        <View style={styles.buttonContainer} pointerEvents="auto">
          <TouchableOpacity 
            style={styles.offerButton}
            onPress={handleOffer}
          >
            <Text style={styles.offerButtonText}>OFFER</Text>
          </TouchableOpacity>
        </View>

        {/* Save button */}
        <View style={styles.saveButtonContainer} pointerEvents="auto">
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Icon name={showSaved === true ? 'bookmark-o' : 'bookmark'} size={30} color='#FFFFFF' />
          </TouchableOpacity>
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
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    paddingHorizontal: 20,
    alignItems: 'center',
    bottom: 400,
  },
  closeButton: {
    position: 'absolute',
    top: -280,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
    zIndex: 5,
  },
  offerButton: {
    top: 260,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveButtonContainer: {
    alignItems: 'flex-end',
    width: '100%',
    marginTop: -54,
    marginLeft: -82,
    zIndex: 4,
  },
  saveButton: {
    top: 260,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  animatedDeck: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 26,
    alignItems: 'center',
  },
});
