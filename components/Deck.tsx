import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import PostCard from './PostCard';

interface CardData {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface DeckProps {
  cards: CardData[];
}

const Deck: React.FC<DeckProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const CARDS_TO_SHOW = 4; // Show 4 stacked cards

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onMoveShouldSetPanResponder: () => !isAnimating,
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Swipe left - send top card to back
        if (gestureState.dx < -50) {
          animateCardToBack();
        }
        // Swipe right - bring back card to front
        else if (gestureState.dx > 50) {
          animateCardToFront();
        }
        // Not enough swipe - return to position
        else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const animateCardToBack = () => {
    setIsAnimating(true);
    Animated.timing(slideAnim, {
      toValue: -400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((currentIndex + 1) % cards.length);
      slideAnim.setValue(0);
      setIsAnimating(false);
    });
  };

  const animateCardToFront = () => {
    setIsAnimating(true);
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((currentIndex - 1 + cards.length) % cards.length);
      slideAnim.setValue(0);
      setIsAnimating(false);
    });
  };

  // Get the visible cards in order (top to bottom)
  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < CARDS_TO_SHOW; i++) {
      const index = (currentIndex + i) % cards.length;
      visible.push({ ...cards[index], originalIndex: index, stackIndex: i });
    }
    return visible;
  };

  const visibleCards = getVisibleCards();

  return (
    <View style={styles.container}>
      <View style={styles.deck}>
        {visibleCards.map((card, idx) => {
          const isTopCard = idx === 0;
          const offset = idx * 10; // Offset for stacking effect

          return (
            <Animated.View
              key={`${card.originalIndex}-${idx}`}
              {...(isTopCard ? panResponder.panHandlers : {})}
              style={[
                styles.cardWrapper,
                {
                  zIndex: CARDS_TO_SHOW - idx,
                  transform: [
                    { translateX: isTopCard ? slideAnim : offset },
                    { translateY: offset },
                  ],
                },
              ]}
            >
              <PostCard 
                post={{
                  type: card.type,
                  name: card.name,
                  description: card.description,
                  photos: card.photos,
                }}
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: {
    position: 'relative',
    width: 400,
    height: 550,
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default Deck;
