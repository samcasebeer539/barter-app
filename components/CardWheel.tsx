import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BarterCard from './BarterCard';

interface CardData {
  title: string;
  photo: string;
}

interface CardWheelProps {
  cards: CardData[];
}

const CardWheel: React.FC<CardWheelProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  const RADIUS = 350;
  const TOTAL_CARDS = 5; // Only show 5 cards at a time
  
  // Calculate the angle between each card (as if it's a full wheel)
  const anglePerCard = (2 * Math.PI) / cards.length;

  // Pan responder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        // Swipe left moves to next card (clockwise)
        if (gestureState.dx < -50) {
          spinToNext();
        }
        // Swipe right moves to previous card (counter-clockwise)
        else if (gestureState.dx > 50) {
          spinToPrevious();
        }
      },
    })
  ).current;

  const spinToNext = () => {
    const nextIndex = (currentIndex + 1) % cards.length;
    animateToIndex(nextIndex);
  };

  const spinToPrevious = () => {
    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
    animateToIndex(prevIndex);
  };

  const animateToIndex = (targetIndex: number) => {
    const targetRotation = -targetIndex * anglePerCard;
    
    Animated.spring(rotationAnim, {
      toValue: targetRotation,
      useNativeDriver: true,
      damping: 15,
      stiffness: 100,
    }).start();

    setCurrentIndex(targetIndex);
  };

  // Get the visible cards (5 cards: current and 2 on each side)
  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < TOTAL_CARDS; i++) {
      const index = (currentIndex + i) % cards.length;
      visible.push({ ...cards[index], originalIndex: index, displayIndex: i });
    }
    return visible;
  };

  const visibleCards = getVisibleCards();

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.wheel,
          {
            transform: [
              { rotate: rotationAnim.interpolate({
                inputRange: [-2 * Math.PI, 0, 2 * Math.PI],
                outputRange: ['-360deg', '0deg', '360deg'],
              })},
            ],
          },
        ]}
      >
        {visibleCards.map((card, displayIndex) => {
          // Position cards as if they're part of a full wheel
          // displayIndex 0 is at top, then 1, 2, 3, 4 are to the right
          const angle = displayIndex * anglePerCard;
          const x = RADIUS * Math.sin(angle);
          const y = -RADIUS * Math.cos(angle);

          // Calculate rotation so card top points outward
          const cardRotation = (angle * 180) / Math.PI;

          // Calculate z-index: top card (displayIndex 0) should be highest
          const zIndex = displayIndex === 0 ? 10 : 5 - displayIndex;

          return (
            <Animated.View
              key={`${card.originalIndex}-${displayIndex}`}
              style={[
                styles.cardContainer,
                {
                  zIndex,
                  transform: [
                    { translateX: x },
                    { translateY: y },
                    { rotate: `${cardRotation}deg` },
                  ],
                },
              ]}
            >
              <BarterCard title={card.title} photo={card.photo} />
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  wheel: {
    position: 'relative',
    width: 800,
    height: 800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    position: 'absolute',
  },
});

export default CardWheel;
