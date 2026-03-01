import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { globalFonts, colors} from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import { TRADE_ACTIONS } from '@/config/tradeConfig';

const { width, height } = Dimensions.get('window');

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
  const deckTranslateY = useRef(new Animated.Value(height)).current;
  const [isRendered, setIsRendered] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [topPostIndex, setTopPostIndex] = useState<number | null>(null);

  const { goodCount, serviceCount } = useMemo(() => {
    const goodCount = posts.filter(post => post.type === 'good').length;
    const serviceCount = posts.filter(post => post.type === 'service').length;
    return { goodCount, serviceCount };
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
            // enter select mode AND select top card in one press
            setIsSelectMode(true);
            if (topPostIndex !== null) {
                setSelectedPosts([topPostIndex]);
            }
        } else {
            // already in select mode — toggle top card
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
          <View style={styles.column}>
            <View style={styles.goodServiceRow}>
              <View style={styles.goodServiceButton}>
                <FontAwesome6 name="gifts" size={16} color={colors.ui.secondarydisabled} />
                <Text style={[styles.buttonText, { color: colors.ui.secondarydisabled }]}>0{goodCount}</Text>
                <FontAwesome6 name="hand-sparkles" size={16} color={colors.ui.secondarydisabled} />
                <Text style={[styles.buttonText, { color: colors.ui.secondarydisabled }]}>0{serviceCount}</Text>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Icon name='bookmark' size={22} color={showSaved ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.upButton} onPress={handleCloseModal}>
                <FontAwesome6 name="angle-down" size={26} color='#fff' />
              </TouchableOpacity>
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
                actions={TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType))}
                onActionSelected={handleActionSelected}
                isSelectMode={isSelectMode}
                selectedCount={selectedPosts.length}
                topCardIsSelected={topCardIsSelected}
              />
            </View>
          </View>
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
  goodServiceRow: {
    width: 334,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
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
    paddingHorizontal: 10,
  },
  saveButton: {
    width: 50,
    height: 36,
    backgroundColor: colors.ui.secondary,
    borderRadius: 2,
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
});