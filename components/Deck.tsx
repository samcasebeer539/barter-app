import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import PostCard from './CardItem';
import UserCard from './CardUser';
import BlankCard from './CardBlank';
import CardDateTime from './CardDateTime';
import CardLocation from './CardMeetingLocation';

import { colors } from '@/styles/globalStyles';

interface Post {
  name: string;
  description: string;
  photos: string[];
}

interface User {
  name: string;
  pronouns: string;
  location: string;
  bio: string;
  avatarText?: string;
  profileImageUrl?: string;
}

interface DeckProps {
  posts: Post[];
  user?: User;
  cardWidth?: number;
  enabled?: boolean;
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  isSelectMode?: boolean;
  selectedPosts?: number[];
  onTopCardChange?: (postIndex: number | null) => void;
  onTopCardTypeChange?: (type: 'user' | 'post' | 'datetime' | 'location') => void;
  selectColor?: string;
  showDateTime?: boolean;
  showLocation?: boolean;
  isEditMode?: boolean;
  onExitEdit?: () => void;
  onEnterEdit?: () => void;
  isUser?: boolean;
  isPostEditMode?: boolean;
  onExitPostEdit?: () => void;
  onEnterPostEdit?: () => void;
}

type DeckItem =
  | { type: 'user' }
  | { type: 'post'; post: Post; postIndex: number }
  | { type: 'datetime' }
  | { type: 'location' };

const Deck: React.FC<DeckProps> = ({
  posts,
  user,
  cardWidth,
  enabled = true,
  onHorizontalGestureStart,
  onGestureEnd,
  isSelectMode = false,
  selectedPosts = [],
  onTopCardChange,
  onTopCardTypeChange,
  selectColor = colors.actions.offer,
  showDateTime = false,
  showLocation = true,
  isEditMode = false,
  onExitEdit,
  onEnterEdit,
  isUser = false,
  isPostEditMode = false,
  onExitPostEdit,
  onEnterPostEdit,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 38, 290);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const POSITIONS = {
    first: { x: 0, y: 0 },
    second: { x: 6, y: 6 },
    third: { x: 12, y: 12 },
  };

  const deckContainerWidth = finalCardWidth + POSITIONS.third.x;
  const deckContainerHeight = cardHeight + POSITIONS.third.y;

  const SWIPE_THRESHOLD = 10;
  const GESTURE_THRESHOLD = 3;

  const mapActiveRef = useRef(false);

  const shouldRepeat = posts.length < 2;
  const baseItems: DeckItem[] = [
    { type: 'user' },
    ...(showDateTime ? [{ type: 'datetime' as const }] : []),
    ...(showLocation ? [{ type: 'location' as const }] : []),
    ...posts.map((post, i): DeckItem => ({ type: 'post', post, postIndex: i })),
  ];
  const [cards] = useState<DeckItem[]>(
    shouldRepeat ? [...baseItems, ...baseItems] : baseItems
  );

  const cardAnimations = useRef(
    cards.map((_, index) => ({
      position: new Animated.ValueXY(
        index === 0 ? POSITIONS.first :
        index === 1 ? POSITIONS.second :
        index === 2 ? POSITIONS.third :
        { x: -22, y: -32 }
      ),
      swipeX: new Animated.Value(0),
    }))
  ).current;

  const [visibleIndices, setVisibleIndices] = useState({
    first: 0,
    second: 1,
    third: 2,
  });

  // shadowIndices tracks which cards should have shadow — updated at animation
  // START so the third card gets its shadow as soon as the swipe begins,
  // not after it finishes moving into the second slot.
  const [shadowIndices, setShadowIndices] = useState({
    first: 0,
    second: 1,
  });

  const visibleIndicesRef = useRef(visibleIndices);
  visibleIndicesRef.current = visibleIndices;
  const isAnimatingRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const topCard = cards[visibleIndices.first];
    if (topCard?.type === 'post') {
      onTopCardChange?.(topCard.postIndex);
    } else {
      onTopCardChange?.(null);
    }
    if (topCard) {
      onTopCardTypeChange?.(topCard.type);
    }
  }, [visibleIndices]);

  const isHorizontalGestureRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_, g) => {
        if (mapActiveRef.current) return false;
        const horizontal = (
          enabledRef.current &&
          !isAnimatingRef.current &&
          Math.abs(g.dx) > GESTURE_THRESHOLD &&
          Math.abs(g.dx) > Math.abs(g.dy) * 2
        );
        isHorizontalGestureRef.current = horizontal;
        return horizontal;
      },

      onMoveShouldSetPanResponderCapture: (_, g) => {
        if (mapActiveRef.current) return false;
        return (
          enabledRef.current &&
          !isAnimatingRef.current &&
          Math.abs(g.dx) > GESTURE_THRESHOLD &&
          Math.abs(g.dx) > Math.abs(g.dy) * 2
        );
      },

      onPanResponderGrant: () => {
        if (!enabledRef.current) return;
        onHorizontalGestureStart?.();
        const firstCardIndex = visibleIndicesRef.current.first;
        cardAnimations[firstCardIndex].swipeX.setOffset(0);
        cardAnimations[firstCardIndex].swipeX.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        if (!enabledRef.current) return;
        const firstCardIndex = visibleIndicesRef.current.first;
        cardAnimations[firstCardIndex].swipeX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!enabledRef.current) return;
        isHorizontalGestureRef.current = false;
        onGestureEnd?.();
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOut(1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOut(-1);
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        isHorizontalGestureRef.current = false;
        onGestureEnd?.();
        resetPosition();
      },
    })
  ).current;

  const swipeOut = (direction: number) => {
    isAnimatingRef.current = true;
    const firstIndex = visibleIndicesRef.current.first;
    const secondIndex = visibleIndicesRef.current.second;
    const thirdIndex = visibleIndicesRef.current.third;
    const nextIndex = (thirdIndex + 1) % cards.length;

    // Update shadow immediately at animation start — third card gets shadow
    // as it begins moving into the second position
    setShadowIndices({ first: secondIndex, second: thirdIndex });

    Animated.parallel([
      Animated.timing(cardAnimations[firstIndex].swipeX, {
        toValue: direction * screenWidth * 1.1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations[secondIndex].position, {
        toValue: POSITIONS.first,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations[thirdIndex].position, {
        toValue: POSITIONS.second,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations[nextIndex].position, {
        toValue: POSITIONS.third,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      cardAnimations[secondIndex].swipeX.flattenOffset();
      cardAnimations[secondIndex].swipeX.setValue(0);
      const newIndices = {
        first: secondIndex,
        second: thirdIndex,
        third: nextIndex,
      };
      setVisibleIndices(newIndices);
      visibleIndicesRef.current = newIndices;
      // Sync shadow back to the new first/second after animation completes
      setShadowIndices({ first: secondIndex, second: thirdIndex });
      isAnimatingRef.current = false;
      onExitEdit?.();
      onExitPostEdit?.();
    });
  };

  const resetPosition = () => {
    Animated.spring(cardAnimations[visibleIndicesRef.current.first].swipeX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const defaultUser: User = {
    name: "Jay Wilson",
    pronouns: "(she/he/they)",
    location: "Santa Cruz, CA",
    bio: "pro smasher",
    profileImageUrl: 'https://picsum.photos/seed/cat/400/400',
  };

  const userToRender = user ?? defaultUser;

  const renderCard = (index: number, isFirst: boolean = false) => {
    const card = cards[index];
    if (!card) return null;

    const cardAnim = cardAnimations[index];

    const rotate = cardAnim.swipeX.interpolate({
      inputRange: [-screenWidth, 0, screenWidth],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    const translateX = isFirst
      ? Animated.add(cardAnim.position.x, cardAnim.swipeX)
      : cardAnim.position.x;

    const hasShadow = index === shadowIndices.first || index === shadowIndices.second;

    return (
      <Animated.View
        key={index}
        style={[
          styles.frontCard,
          hasShadow ? styles.cardShadow : styles.noShadow,
          {
            transform: [
              { translateX },
              { translateY: cardAnim.position.y },
              ...(isFirst ? [{ rotate }] : [{ scale: 1.0 }]),
            ],
          },
        ]}
      >
        {card.type === 'user' ? (
          <UserCard
            user={userToRender}
            scale={1}
            cardWidth={finalCardWidth}
            isUser={isUser}
            isEditable={isFirst && isEditMode}
            onExitEdit={onExitEdit}
            onEnterEdit={onEnterEdit}
          />
        ) : card.type === 'datetime' ? (
          <CardDateTime cardWidth={finalCardWidth} />
        ) : card.type === 'location' ? (
          <CardLocation cardWidth={finalCardWidth} mapActiveRef={mapActiveRef} />
        ) : (
          <PostCard
            post={card.post}
            scale={1}
            cardWidth={finalCardWidth}
            isSelectMode={isFirst && isSelectMode}
            isSelected={selectedPosts.includes(card.postIndex)}
            selectColor={selectColor}
            isUser={isUser}
            isEditable={isFirst && isPostEditMode}
            onEnterEdit={onEnterPostEdit}
            onExitEdit={onExitPostEdit}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.deckContainer, { width: deckContainerWidth, height: deckContainerHeight }]}
      {...(enabled ? panResponder.panHandlers : {})}
    >
      {/* Static blank card — no shadow */}
      <View
        style={[
          styles.frontCard,
          styles.noShadow,
          { transform: [{ translateX: POSITIONS.third.x }, { translateY: POSITIONS.third.y }] },
        ]}
      >
        <BlankCard cardWidth={finalCardWidth} />
      </View>
      {renderCard(visibleIndices.third)}
      {renderCard(visibleIndices.second)}
      {renderCard(visibleIndices.first, true)}
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginLeft: 24,
  },
  backingCard: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4d4d4',
    backgroundColor: 'transparent',
  },
  frontCard: {
    position: 'absolute',
    zIndex: 10,
    top: 0,
    left: 0,
  },
  cardShadow: {
    shadowColor: colors.ui.secondary,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 8,
  },
  noShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default Deck;