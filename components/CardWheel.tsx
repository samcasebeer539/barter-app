import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BarterCard from './BarterCard';

interface CardData {
  title: string;
  photo: any;
}

interface CardWheelProps {
  cards: CardData[];
  resetKey?: number;
  onCardPlay?: (cardTitle: string) => void;
}

const CardWheel: React.FC<CardWheelProps> = ({ cards, resetKey, onCardPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const RADIUS = 900;
  const TOTAL_CARDS = cards.length;
  const anglePerCard = (2 * Math.PI) / 28;

  // Reset wheel when resetKey changes
  useEffect(() => {
    setCurrentIndex(0);
    rotationAnim.setValue(0);
  }, [resetKey]);

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

  const spinToNext = () => {
    const nextIndex = (currentIndex + 1) % cards.length;
    animateToIndex(nextIndex);
  };

  const spinToPrevious = () => {
    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
    animateToIndex(prevIndex);
  };

  // Create PanResponder for the entire container
  const containerPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -30) spinToNext();
      else if (gestureState.dx > 30) spinToPrevious();
    },
  });

  const handleCardPlay = (cardTitle: string) => {
    console.log(`Card played from CardWheel: ${cardTitle}`);
    if (onCardPlay) {
      onCardPlay(cardTitle);
    }
  };

  return (
    <View style={styles.container} {...containerPanResponder.panHandlers}>
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
        {cards.map((card, displayIndex) => {
          const angle = displayIndex * anglePerCard;
          const x = RADIUS * Math.sin(angle);
          const y = -RADIUS * Math.cos(angle);
          const cardRotation = (angle * 180) / Math.PI;

          // zIndex: top card highest
          const zIndex = displayIndex === 0 ? 100 : 100 - displayIndex;

          return (
            <Animated.View
              key={`${displayIndex}`}
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
              <BarterCard 
                title={card.title} 
                photo={card.photo}
                onPlay={handleCardPlay}
              />
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
    paddingTop: 450,
    overflow: 'visible',
  },
  wheel: {
    position: 'relative',
    width: 800,
    height: 800,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  cardContainer: {
    position: 'absolute',
    overflow: 'visible',
  },
});

export default CardWheel;
