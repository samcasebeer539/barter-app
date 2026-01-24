import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import PostCard from './PostCard';
import UserCard from './UserCard';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface DeckProps {
  posts: Post[];
  cardWidth?: number;
}

type DeckItem =
  | { type: 'user' }
  | { type: 'post'; post: Post };

const Deck: React.FC<DeckProps> = ({ posts, cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const scaledWidth = finalCardWidth * 0.85;
  const scaledHeight = cardHeight * 0.85;
  const offset = 6;

  // Card position definitions
  const POSITIONS = {
    first: { x: -5, y: -15 },
    second: { x: -14, y: -24 },
    third: { x: -22, y: -32 },
  };

  // Track which card is in which position
  const [cardIndices, setCardIndices] = useState({
    first: 0,
    second: 1,
    third: 2,
  });

  // Animated values for each card slot
  const firstCardX = useRef(new Animated.Value(0)).current;
  const secondCardAnim = useRef(new Animated.ValueXY(POSITIONS.second)).current;
  const thirdCardAnim = useRef(new Animated.ValueXY(POSITIONS.third)).current;
  
  const SWIPE_THRESHOLD = screenWidth * 0.25;

  const [cards, setCards] = useState<DeckItem[]>([
    { type: 'user' },
    ...posts.map((post): DeckItem => ({ type: 'post', post })),
  ]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),

      onPanResponderMove: (_, gesture) => {
        firstCardX.setValue(gesture.dx); // only horizontal
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOut(1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOut(-1);
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeOut = (direction: number) => {
    // Animate all cards
    Animated.parallel([
      // Swipe out the first card
      Animated.timing(firstCardX, {
        toValue: direction * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move second card to first position
      Animated.timing(secondCardAnim, {
        toValue: POSITIONS.first,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move third card to second position
      Animated.timing(thirdCardAnim, {
        toValue: POSITIONS.second,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Cycle the cards array - move first card to end
      setCards((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      
      // Update card indices - rotate positions
      setCardIndices((prev) => ({
        first: prev.second,
        second: prev.third,
        third: (prev.first + 3) % cards.length, // Next card in sequence
      }));

      // Reset first card position for next swipe
      firstCardX.setValue(0);
      
      // Reset second and third to their starting positions
      // (they'll now hold different cards)
      secondCardAnim.setValue(POSITIONS.second);
      thirdCardAnim.setValue(POSITIONS.third);
    });
  };

  const resetPosition = () => {
    Animated.spring(firstCardX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // rotation while dragging
  const rotate = firstCardX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.deckContainer} {...panResponder.panHandlers}>
      {/* back card (third position) */}
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX: thirdCardAnim.x },
              { translateY: thirdCardAnim.y },
              { scale: 1.0 }
            ],
          },
        ]}
      >
        {cards[cardIndices.third]?.type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[cardIndices.third]?.post}
            scale={0.85}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>

      {/* middle card (second position) */}
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX: secondCardAnim.x },
              { translateY: secondCardAnim.y },
              { scale: 1.0 }
            ],
          },
        ]}
      >
        {cards[cardIndices.second]?.type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[cardIndices.second]?.post}
            scale={0.85}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>

      {/* Front card (first position) */}
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX: firstCardX },
              { translateY: POSITIONS.first.y },
              { rotate }
            ],
            right: POSITIONS.first.x,
          },
        ]}
      >
        {cards[cardIndices.first]?.type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[cardIndices.first]?.post}
            scale={0.85}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 8, // Android shadow
},
});

export default Deck;
