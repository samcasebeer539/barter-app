import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, {TradeTurn} from './TradeTurns';
import { TRADE_ACTIONS } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';

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


export default function FeedDeck({ posts, visible, onClose, }: FeedDeckProps) {
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

  const postCount = useMemo(() => posts.length, [posts]);

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
        if (topPostIndex !== null) setSelectedPosts([topPostIndex]);
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

  const handleTopCardChange = (postIndex: number | null) => setTopPostIndex(postIndex);
  const handleSave = () => setShowSaved(prev => !prev);

  const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

  return (
    <Modal visible={isRendered} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
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
          style={[styles.animatedContainer, { transform: [{ translateY: deckTranslateY }] }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}
            keyboardVerticalOffset={120}
          >
            <View style={deckStyles.column}>
              <View style={deckStyles.itemCountRow}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Icon name='bookmark' size={22} color={showSaved ? colors.ui.secondarydisabled : '#fff'} />
                </TouchableOpacity>
                <View style={styles.statusBar}>
                  <FontAwesome6 name='circle-user' size={22} color={colors.ui.secondarydisabled} />
                  <FontAwesome6 name='circle-dot' size={22} color={colors.ui.secondarydisabled} />
                  <Text style={[deckStyles.countText]}>0{postCount}</Text>
                  <FontAwesome6 name='arrows-rotate' size={22} color={colors.ui.secondarydisabled} />
                </View>
              </View>

              <View style={deckStyles.deckWrapper} pointerEvents="box-none">
                <Deck
                  posts={posts}
                  cardWidth={Math.min(width - 36, 400)}
                  enabled={true}
                  isSelectMode={isSelectMode}
                  selectedPosts={selectedPosts}
                  onTopCardChange={handleTopCardChange}
                  selectColor={colors.actions.offer}
                  showLocation={true}
                />
              </View>

              <View style={deckStyles.turnsAndButtonRow}>
                <View style={deckStyles.queryRow}>
                  <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
                </View>
                <View style={[deckStyles.actionRow, {bottom: 4}]}>
                  <TradeUI
                    actions={feedActions}
                    onActionSelected={handleActionSelected}
                    onQueryToggle={setIsQueryOpen}
                    isSelectMode={isSelectMode}
                    selectedCount={selectedPosts.length}
                    topCardIsSelected={topCardIsSelected}
                  />
                </View>

                
              </View>
              {/* <TouchableOpacity
                style={styles.collapseBar}
                onPress={handleCloseModal}
              >
                <FontAwesome6 name="angle-down" size={26} color="#fff" />
              </TouchableOpacity> */}
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
  saveButton: {
    width: 50,
    height: 36,
    backgroundColor: colors.ui.secondary,
    ...barRadius.leftCap,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    ...makeCountBar('rightCap', 'flex-end'),
  },
  collapseBar: {
    top: -10,
    width: DECK_BAR_WIDTH ,
    height: 36,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
});