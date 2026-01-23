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

  const positionX = useRef(new Animated.Value(0)).current; // X only
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
    Animated.timing(positionX, {
      toValue: direction * screenWidth,
      duration: 500,
      useNativeDriver: true, // smooth
    }).start(() => {
      
      setCards((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      positionX.setValue(0);
    });
  };

  const resetPosition = () => {
    Animated.spring(positionX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // Optional: rotation while dragging
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

      {/* back card */}
      <View
        style={[
          styles.frontCard,
          {
            bottom: -32,
            right: -22,
            transform: [{ scale: 1.0}], // if you still want to scale
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
      </View>

      {/* middle card */}
      <View
        style={[
          styles.frontCard,
          {
            bottom: -24,
            right: -14,
            transform: [{ scale: 1.0}], // if you still want to scale
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
      </View>


      {/* Front card */}
      <Animated.View
        style={[
          styles.frontCard,
          {
            transform: [{ translateX: positionX }, { rotate }],
            bottom: -15,
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
