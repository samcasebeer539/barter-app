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
  
  // Fixed angle between cards (60 degrees = PI/3)
  const anglePerCard = Math.PI / 3;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          spinToNext();
        } else if (gestureState.dx > 50) {
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

  // Get the visible cards - current card and next 4
  const getVisibleCards = () => {
    const visible = [];
    for (let i = 0; i < TOTAL_CARDS; i++) {
      const index = (currentIndex + i) % cards.length;
      visible.push({ ...cards[index], originalIndex: index, positionIndex: i });
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
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [-2 * Math.PI, 0, 2 * Math.PI],
                  outputRange: ['-360deg', '0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {visibleCards.map((card) => {
          // Position based on the card's position in the visible array (0-4)
          // Not based on currentIndex - that's handled by wheel rotation
          const angle = card.positionIndex * anglePerCard;
          const x = RADIUS * Math.sin(angle);
          const y = -RADIUS * Math.cos(angle);
          const cardRotation = (angle * 180) / Math.PI;

          // Top card (position 0) has highest z-index
          const zIndex = card.positionIndex === 0 ? 100 : 100 - card.positionIndex;

          return (
            <Animated.View
              key={card.originalIndex}
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
