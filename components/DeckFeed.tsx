import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { globalFonts, colors} from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns from './TradeTurns';
import { TRADE_ACTIONS } from '@/config/tradeConfig';

const { width, height } = Dimensions.get('window');

interface Post {
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
  const deckTranslateY = useRef(new Animated.Value(height)).current;
  const [isRendered, setIsRendered] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  const feedActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
    []
  );

  const { postCount } = useMemo(() => {
    const postCount = posts.length;
   
    return { postCount };
  }, [posts]);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      deckTranslateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(deckTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          duration: 350,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.88,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(deckTranslateY, {
          toValue: height,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
        setIsQueryOpen(false);
      });
    }
  }, [visible]);

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(deckTranslateY, {
        toValue: height,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleActionSelected = (action: TradeAction) => {
    if (action.actionType === 'offer' && action.subAction === 'write') {
        if (!isSelectMode) {
            setIsSelectMode(true);
            if (topPostIndex !== null) {
                setSelectedPosts([topPostIndex]);
            }
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
    if (action.actionType === 'offer' && action.subAction === 'select') {
        setIsSelectMode(false);
        setSelectedPosts([]);
    }
  };

  const handleTopCardChange = (postIndex: number | null) => {
    setTopPostIndex(postIndex);
  };

  const handleSave = () => setShowSaved(prev => !prev);

  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={[styles.modalBackground, { opacity: backdropOpacity }]}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCloseModal}
        />

        <Animated.View
          pointerEvents="auto"
          style={[
            styles.animatedContainer,
            { transform: [{ translateY: deckTranslateY }] },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}
            keyboardVerticalOffset={120}
          >
            <View style={styles.column}>
            <View style={styles.itemCountRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Icon name='bookmark' size={22} color={showSaved ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
              <View style={styles.itemCountButton}>
                <Text style={[styles.buttonText, { color: colors.ui.secondarydisabled }]}>0{postCount}</Text>
            
              </View>
              
              {/* <TouchableOpacity style={styles.upButton} onPress={handleCloseModal}>
                <FontAwesome6 name="angle-down" size={26} color='#fff' />
              </TouchableOpacity> */}
            </View>

            <View style={styles.deckWrapper}>
              <Deck
                posts={posts}
                cardWidth={Math.min(width - 40, 400)}
                enabled={true}
                isSelectMode={isSelectMode}
                selectedPosts={selectedPosts}
                onTopCardChange={handleTopCardChange}
                selectColor={colors.actions.offer}
              />
            </View>

            <View style={styles.actionRow}>
              <TradeUI
                actions={feedActions}
                onActionSelected={handleActionSelected}
                onQueryToggle={setIsQueryOpen}
                isSelectMode={isSelectMode}
                selectedCount={selectedPosts.length}
                topCardIsSelected={topCardIsSelected}
              />
            </View>

            <View style={styles.turnsRow}>
              <TradeTurns
                turns={[]}
                isQueryOpen={isQueryOpen}
              />
            </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ui.background,
  },
  animatedContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deckWrapper: {
    left: -12,
  },
  itemCountRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  itemCountButton: {
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
  },
  saveButton: {
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
  upButton: {
    width: 50,
    height: 36,
    backgroundColor: colors.ui.secondary,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontFamily: globalFonts.bold,
  },
  actionRow: {
    width: 334,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnsRow: {
    width: 334,
    marginTop: -10,
  },
});