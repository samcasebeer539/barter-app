import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import BarterCard from './BarterCard';

interface CardData {
  title: string;
  photo: string;
}

interface CardWheelProps {
  cards: CardData[];
  radius?: number; // radius of the circle
}

const CardWheel: React.FC<CardWheelProps> = ({ cards, radius = 350 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');

  // Calculate the angle between each card
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
        {cards.map((card, index) => {
          // Calculate position for each card in a circle
          const angle = index * anglePerCard;
          const x = radius * Math.sin(angle);
          const y = -radius * Math.cos(angle);

          // Calculate rotation so card top points outward
          const cardRotation = (angle * 180) / Math.PI;

          return (
            <Animated.View
              key={index}
              style={[
                styles.cardContainer,
                {
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
