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
  const TOTAL_CARDS = cards.length; // always show up to 5 cards
  const anglePerCard = (2 * Math.PI) / 12

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

  return (
    <View style={styles.container}>
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

          // Only top card has PanResponder
          const panResponder =
            displayIndex === 0
              ? PanResponder.create({
                  onStartShouldSetPanResponder: () => true,
                  onMoveShouldSetPanResponder: () => true,
                  onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx < -30) spinToNext();
                    else if (gestureState.dx > 30) spinToPrevious();
                  },
                })
              : null;

          return (
            <Animated.View
              key={`${displayIndex}`}
              {...(panResponder ? panResponder.panHandlers : {})}
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
