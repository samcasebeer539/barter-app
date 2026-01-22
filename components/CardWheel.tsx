import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BarterCard from './BarterCard';

interface CardData {
  title: string;
  photo: string;
}

interface CardWheelProps {
  cards: CardData[];
  resetKey?: number; // Optional prop to force reset
}

const CardWheel: React.FC<CardWheelProps> = ({ cards, resetKey }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  const RADIUS = 700;
  const TOTAL_CARDS = cards.length; // always show up to 5 cards
  const anglePerCard = (2 * Math.PI) / 22

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

  return (
    <View style={styles.container} {...containerPanResponder.panHandlers}>
      {/* Static Wireframe around top card position */}
      <View style={styles.staticWireframe} pointerEvents="none" />
      
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
    paddingTop: 450,
    overflow: 'visible',
  },
  staticWireframe: {
    position: 'absolute',
    width: 216,
    height: 296,
    borderWidth: 3,
    borderColor: '#FFA600',
    borderRadius: 14,
    borderStyle: 'solid',
    top: '50%',
    left: '50%',
    marginLeft: -108, // Half of width
    marginTop: -148 - 250, // Half of height + offset to match top card position
    zIndex: 50,
    shadowColor: '#FFA600',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
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
