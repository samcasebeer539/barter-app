import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TRADE_ACTIONS } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';

const { width, height } = Dimensions.get('window');

const BOTTOM_BASE = 140;
const MAX_SCROLL_HEIGHT = height - BOTTOM_BASE - 60;

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  const feedActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
    []
  );

  const postCount = useMemo(() => posts.length, [posts]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      const kbHeight = e.endCoordinates.height;
      setKeyboardHeight(kbHeight);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollY.current + kbHeight * 0.8,
          animated: true,
        });
      }, 50);
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
        setKeyboardHeight(0);
      });
    }
  }, [visible]);

  const handleCloseModal = () => {
    Keyboard.dismiss();
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
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

        {/* Dim backdrop — purely visual, no touch handling */}
        <Animated.View
          style={[styles.modalBackground, { opacity: backdropOpacity }]}
          pointerEvents="none"
        />

        {/* Close strip — only occupies the space BELOW the deck (BOTTOM_BASE tall) */}
        <TouchableOpacity
          style={styles.closeStrip}
          activeOpacity={1}
          onPress={handleCloseModal}
        />

        {/* Deck — slides in/out, sits above the close strip */}
        <Animated.View
          style={[styles.animatedContainer, { transform: [{ translateY: deckTranslateY }] }]}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ maxHeight: MAX_SCROLL_HEIGHT }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={scrollEnabled}
            onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
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

              <View style={deckStyles.deckWrapper}>
                <Deck
                  posts={posts}
                  cardWidth={Math.min(width - 36, 400)}
                  enabled={true}
                  isSelectMode={isSelectMode}
                  selectedPosts={selectedPosts}
                  onTopCardChange={handleTopCardChange}
                  selectColor={colors.actions.offer}
                  showLocation={true}
                  onHorizontalGestureStart={() => setScrollEnabled(false)}
                  onGestureEnd={() => setScrollEnabled(true)}
                />
              </View>

              <View style={styles.turnsAndButtonColumn}>
                <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
                  <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
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
              </View>
            </View>
          </ScrollView>
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
  // Sits in the bottom strip only — the gap between screen bottom and the deck
  closeStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_BASE,
  },
  animatedContainer: {
    position: 'absolute',
    bottom: BOTTOM_BASE,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
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
    width: DECK_BAR_WIDTH,
    height: 36,
    ...barRadius.bottomCap,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
  },
  turnsAndButtonColumn: {
    flexDirection: 'column',
    width: DECK_BAR_WIDTH,
  },
  queryRow: {

  },
  actionRow: {

  }
});