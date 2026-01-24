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

  const positionX = useRef(new Animated.Value(0)).current; // x only
  const secondCardAnim = useRef(new Animated.ValueXY({ x: -14, y: -24 })).current;
  const thirdCardAnim = useRef(new Animated.ValueXY({ x: -22, y: -32 })).current;
  
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
        positionX.setValue(gesture.dx); // only horizontal
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
    // Animate all three cards simultaneously
    Animated.parallel([
      // Swipe out the front card
      Animated.timing(positionX, {
        toValue: direction * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move second card to front position
      Animated.timing(secondCardAnim, {
        toValue: { x: -5, y: -15 },
        duration: 250,
        useNativeDriver: true,
      }),
      // Move third card to second position
      Animated.timing(thirdCardAnim, {
        toValue: { x: -14, y: -24 },
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, update the cards array
      setCards((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      
      // Reset animations for next swipe
      positionX.setValue(0);
      secondCardAnim.setValue({ x: -14, y: -24 });
      thirdCardAnim.setValue({ x: -22, y: -32 });
    });
  };

  const resetPosition = () => {
    Animated.spring(positionX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // rotation while dragging
  const rotate = positionX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.deckContainer} {...panResponder.panHandlers}>
      {/* Backing cards */}
      
      {/* <View
        style={[
          styles.backingCard,
          {
            width: scaledWidth,
            height: scaledHeight,
            bottom: offset,
            right: offset,
          },
        ]}
      /> */}

      {/* back card (third in stack) */}
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
        {cards[2].type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[2].post}
            scale={0.85}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>

      {/* middle card (second in stack) */}
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
        {cards[1].type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[1].post}
            scale={0.85}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>


      {/* Front card */}
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX: positionX },
              { translateY: -15 },
              { rotate }
            ],
            right: -5,
          },
        ]}
      >
        {cards[0].type === 'user' ? (
          <UserCard scale={0.85} cardWidth={finalCardWidth} />
        ) : (
          <PostCard
            post={cards[0].post}
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
