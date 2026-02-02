import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { defaultTextStyle, globalFonts, colors} from '../styles/globalStyles';
import { LinearGradient } from 'expo-linear-gradient';


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

  // Count good and service posts
  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

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
    <View style={styles.modalOverlay} pointerEvents="box-none">
      <TouchableOpacity 
        style={styles.modalBackground} 
        activeOpacity={1} 
        onPress={handleCloseModal}
      />
      <View style={styles.modalContent} pointerEvents="box-none">
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: deckTranslateY }],
            },
          ]}
        >
     
          
          <View style={styles.goodServiceRow}>
            <View style={styles.goodButton}>
              <Text style={styles.offerButtonText}>{goodCount}</Text>
              <FontAwesome6 name="cube" size={22} color="#ffffff" />
            </View>
            {/* Save button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Icon name={showSaved ? 'bookmark' : 'bookmark-o'} size={28} color='#ffffff' />
            </TouchableOpacity>

            <View style={styles.serviceButton}>
              <Text style={styles.offerButtonText}>{serviceCount}</Text>
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
            {/* play button */}
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handleSave}
            >
              <FontAwesome6 name='arrow-right-long' size={22} color='#ffffff' />
            </TouchableOpacity>

            {/* Offer button */}
            {/* <TouchableOpacity 
              style={styles.offerButton}
              onPress={handleOffer}
            >
              <Text style={styles.offerButtonText}>OFFER</Text>
            </TouchableOpacity> */}
            <TouchableOpacity onPress={handleOffer} >
                <Text style={styles.offerText}>OFFER</Text>
            </TouchableOpacity>

            
            {/* Up/Close button */}
            <TouchableOpacity 
              style={styles.upButton}
              onPress={handleCloseModal}
            >
              <FontAwesome6 name="chevron-up" size={22} color="#ffffff" />
            </TouchableOpacity>

          </View>
        </Animated.View>
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
    top: 236,
  },
  goodServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    top: -224,
    zIndex: 0,
  },
  upButton: {
    width: 54,
    height: 40,
    
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
   
  },
  saveButton: {
    width: 50,
    height: 40,
    
    borderRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  playButton: {
    width: 54,
    height: 40,
    
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  offerText: {
    color: colors.actions.offer,
    fontSize: 52,
    fontFamily: globalFonts.extrabold,
    
    
  },
  offerButton: {
    backgroundColor: colors.actions.offer,
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  offerButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: globalFonts.bold
    
  },
  goodButton: {
    width: 90,
    height: 40,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  serviceButton: {
    width: 90,
    height: 38,
    flexDirection: 'row',
    gap: 8,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },

});
