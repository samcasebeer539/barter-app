import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { defaultTextStyle, globalFonts, colors} from '../styles/globalStyles';
import { Pressable } from 'react-native';

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
  const [showPlay, setShowPlay] = useState(false);

  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
  }, [posts]);

  useEffect(() => {
    if (visible) {
      deckTranslateY.setValue(-Dimensions.get('window').height);

      Animated.spring(deckTranslateY, {
        toValue: Dimensions.get('window').height / 16,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
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

  const handleOffer = () => console.log('Offer button pressed');
  const handleSave = () => setShowSaved(prev => !prev);
  const handlePlay = () => setShowPlay(prev => !prev);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
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
              { transform: [{ translateY: deckTranslateY }] },
            ]}
          >
            <View style={styles.column}>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[
                    styles.saveButton, 
                    { backgroundColor: showSaved ? 'transparent' : colors.actions.offer }
                  ]}
                  onPress={handleSave}
                >
                  <Icon name='bookmark' size={22} color={showSaved ? colors.actions.offer : '#000'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOffer}>
                  <Text style={styles.offerText}>OFFER</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.playButton, 
                    { backgroundColor: showPlay ? 'transparent' : colors.actions.offer }
                  ]}
                  onPress={handlePlay}
                >
                  <FontAwesome6 name='arrow-left-long' size={26} color={showPlay ? colors.actions.offer : '#000'} />
                </TouchableOpacity>
              </View>

              <View style={styles.deckWrapper}>
                <Deck 
                  posts={posts}
                  cardWidth={Math.min(width - 40, 400)}
                  enabled={true}
                />
              </View>

              <View style={styles.goodServiceRow}>
                <TouchableOpacity 
                  style={styles.upButton}
                  onPress={handleCloseModal}
                >
                  <FontAwesome6 name="angle-up" size={26} color='#fff' />
                </TouchableOpacity>

                <View style={styles.goodServiceButton}>
                  
                  <FontAwesome6 name="gifts" size={16} color={colors.cardTypes.good} />
                  <Text style={[styles.offerButtonText, {color: colors.cardTypes.good}]}>0{goodCount}</Text>
                  
                  <FontAwesome6 name="hand-sparkles" size={16} color={colors.cardTypes.service} />
                  <Text style={[styles.offerButtonText, {color: colors.cardTypes.service}]}>0{serviceCount}</Text>
                </View>
              </View>

            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
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
    zIndex: 10,
    
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ui.background,
    opacity: .88,
    
  },
  modalContent: {
    width: '100%',
    
    position: 'relative',
    
    alignItems: 'center',
   
  },
  animatedContainer: {
    position: 'absolute',
    bottom: 480,
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
    width: 334,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    top: 346,
    left: 0,
  },
  goodServiceRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    top: -304,
    left: 0,
    zIndex: 0,
  },
  upButton: {
    width: 50,
    height: 36,
    backgroundColor: colors.ui.secondary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 2,
    
    
    justifyContent: 'center',
    alignItems: 'center',
    
    
   
  },
  saveButton: {
    flex: 1,
    height: 40,
    
    borderTopRightRadius: 2,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderWidth: 3,
    borderColor: colors.actions.offer,
    justifyContent: 'center',
    alignItems: 'flex-end',
    shadowColor: colors.actions.offer,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    paddingHorizontal: 16
    
   
  },
  playButton: {
    
    width: 50,
    height: 40,
    
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
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
    marginRight: 'auto',
    letterSpacing: -2
    
  },

  offerButtonText: {
   
    fontSize: 20,
    fontFamily: globalFonts.bold,
    
  },
  goodServiceButton: {
    
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
    paddingHorizontal: 10,
    marginLeft: 'auto',
    
    
  },
  

});
