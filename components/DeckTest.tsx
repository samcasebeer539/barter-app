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
  
  // Animated values for each card position
  const scaleAnims = useRef([
    new Animated.Value(1),    // Front card - scale 1
    new Animated.Value(0.95), // Second card - scale 0.95
    new Animated.Value(0.9),  // Third card - scale 0.9
  ]).current;

  const translateYAnims = useRef([
    new Animated.Value(0),   // Front card - no offset
    new Animated.Value(15),  // Second card - 15px down
    new Animated.Value(30),  // Third card - 30px down
  ]).current;

  const opacityAnims = useRef([
    new Animated.Value(1),   // Front card - full opacity
    new Animated.Value(1),   // Second card - full opacity
    new Animated.Value(1),   // Third card - full opacity
  ]).current;

  const frontCardTranslateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isAnimating && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating) return;

        const swipeThreshold = 30; // Reduced threshold for single swipe
        
        if (gestureState.dx < -swipeThreshold) {
          // Swipe left - send front card to back
          sendToBack();
        } else if (gestureState.dx > swipeThreshold) {
          // Swipe right - bring back card to front
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
    }).start();

    // Animate cards growing and moving up
    Animated.parallel([
      // Second card becomes first (scale up to 1, move to y: 0)
      Animated.timing(scaleAnims[1], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnims[1], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Third card becomes second (scale to 0.95, move to y: 15)
      Animated.timing(scaleAnims[2], {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnims[2], {
        toValue: 15,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move first card to end
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
        return newCards;
      });

      // Reset animations for new order
      frontCardTranslateX.setValue(0);
      scaleAnims[0].setValue(1);
      scaleAnims[1].setValue(0.95);
      scaleAnims[2].setValue(0.9);
      translateYAnims[0].setValue(0);
      translateYAnims[1].setValue(15);
      translateYAnims[2].setValue(30);
      
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
    }).start();

    // Animate cards shrinking and moving down
    Animated.parallel([
      // First card becomes second (scale to 0.95, move to y: 15)
      Animated.timing(scaleAnims[0], {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnims[0], {
        toValue: 15,
        duration: 300,
        useNativeDriver: true,
      }),
      // Second card becomes third (scale to 0.9, move to y: 30)
      Animated.timing(scaleAnims[1], {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnims[1], {
        toValue: 30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move last card to front
      setCards((prevCards) => {
        const newCards = [...prevCards];
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
        return newCards;
      });

      // Reset animations for new order
      frontCardTranslateX.setValue(0);
      scaleAnims[0].setValue(1);
      scaleAnims[1].setValue(0.95);
      scaleAnims[2].setValue(0.9);
      translateYAnims[0].setValue(0);
      translateYAnims[1].setValue(15);
      translateYAnims[2].setValue(30);
      
      setIsAnimating(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {cards.slice(0, 3).map((card, index) => {
          const isTopCard = index === 0;
          
          const animatedStyle = {
            transform: [
              ...(isTopCard ? [{ translateX: frontCardTranslateX }] : []),
              { scale: scaleAnims[index] },
              { translateY: translateYAnims[index] },
            ],
            zIndex: 3 - index,
            opacity: opacityAnims[index],
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
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
});

export default DeckTest;
