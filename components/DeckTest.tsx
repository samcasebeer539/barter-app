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
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardOrder, setCardOrder] = useState([0, 1, 2]); // Track which position each card is in

  const frontCardTranslateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isAnimating && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating) return;

        const swipeThreshold = 30;
        
        if (gestureState.dx < -swipeThreshold) {
          sendToBack();
        } else if (gestureState.dx > swipeThreshold) {
          bringToFront();
        }
      },
    })
  ).current;

  const sendToBack = () => {
    setIsAnimating(true);

    // Animate front card out to the left
    Animated.timing(frontCardTranslateX, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Move first card to end
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
        return newCards;
      });

      // Reset front card position
      frontCardTranslateX.setValue(0);
      setIsAnimating(false);
    });
  };

  const bringToFront = () => {
    if (cards.length <= 1) return;
    setIsAnimating(true);

    // Animate front card out to the right
    Animated.timing(frontCardTranslateX, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Move last card to front
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
        return newCards;
      });

      // Reset front card position
      frontCardTranslateX.setValue(0);
      setIsAnimating(false);
    });
  };

  const getCardStyle = (index: number) => {
    const scales = [1, 0.92, 0.84]; // More dramatic scale difference
    const translateYs = [0, 40, 80]; // Greater offset (40px and 80px)
    
    return {
      scale: scales[index] || 0.84,
      translateY: translateYs[index] || 80,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {cards.slice(0, 3).map((card, index) => {
          const isTopCard = index === 0;
          const { scale, translateY } = getCardStyle(index);
          
          const animatedStyle = {
            transform: [
              ...(isTopCard ? [{ translateX: frontCardTranslateX }] : []),
              { scale },
              { translateY },
            ],
            zIndex: 3 - index,
          };

          return (
            <Animated.View
              key={`${card.id}-${index}`}
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
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
});

export default DeckTest;
