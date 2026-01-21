import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import PostCard from './PostCard';
import UserCard from './UserCard';

interface DeckTestProps {
  cardWidth?: number;
}

const DeckTest: React.FC<DeckTestProps> = ({ cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // Sample data for the deck
  const initialCards = [
    { type: 'user' as const, id: 'user-1' },
    {
      type: 'post' as const,
      id: 'post-1',
      data: {
        type: 'good' as const,
        name: 'Vintage Camera',
        description: 'Beautiful vintage camera from the 1970s in perfect working condition.',
        photos: [
          'https://picsum.photos/seed/camera1/600/400',
          'https://picsum.photos/seed/camera2/500/700',
        ],
      },
    },
    {
      type: 'post' as const,
      id: 'post-2',
      data: {
        type: 'service' as const,
        name: 'Guitar Lessons',
        description: 'Professional guitar instruction for beginners and intermediate players.',
        photos: [
          'https://picsum.photos/seed/guitar1/700/500',
          'https://picsum.photos/seed/guitar2/400/600',
        ],
      },
    },
    {
      type: 'post' as const,
      id: 'post-3',
      data: {
        type: 'good' as const,
        name: 'Mountain Bike',
        description: 'High-quality mountain bike, great for trails and outdoor adventures.',
        photos: [
          'https://picsum.photos/seed/bike1/800/400',
          'https://picsum.photos/seed/bike2/600/600',
        ],
      },
    },
  ];

  const [cards, setCards] = useState(initialCards);
  const pan = useRef(new Animated.ValueXY()).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow horizontal movement
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 100;
        
        if (gestureState.dx < -swipeThreshold) {
          // Swipe left - send front card to back
          sendToBack();
        } else if (gestureState.dx > swipeThreshold) {
          // Swipe right - bring back card to front
          bringToFront();
        } else {
          // Return to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const sendToBack = () => {
    Animated.timing(pan, {
      toValue: { x: -screenWidth, y: 0 },
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Move first card to end
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
        return newCards;
      });
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const bringToFront = () => {
    if (cards.length <= 1) {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(pan, {
      toValue: { x: screenWidth, y: 0 },
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Move last card to front
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
        return newCards;
      });
      pan.setValue({ x: 0, y: 0 });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {cards.map((card, index) => {
          const isTopCard = index === 0;
          const scale = 1 - index * 0.05; // Each card slightly smaller
          const translateY = index * 10; // Stack cards with offset
          const opacity = index < 3 ? 1 : 0; // Only show top 3 cards

          const animatedStyle = isTopCard
            ? {
                transform: [
                  { translateX: pan.x },
                  { scale },
                  { translateY },
                ],
                zIndex: cards.length - index,
                opacity,
              }
            : {
                transform: [{ scale }, { translateY }],
                zIndex: cards.length - index,
                opacity,
              };

          return (
            <Animated.View
              key={card.id}
              style={[styles.cardWrapper, animatedStyle]}
              {...(isTopCard ? panResponder.panHandlers : {})}
            >
              {card.type === 'user' ? (
                <UserCard cardWidth={finalCardWidth} />
              ) : (
                <PostCard post={card.data} cardWidth={finalCardWidth} />
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
});

export default DeckTest;
