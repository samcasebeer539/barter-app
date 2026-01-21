import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import PostCard from './PostCard';
import UserCard from './UserCard';

interface DeckCardData {
  id: string;
  type: 'user' | 'post';
  post?: {
    type: 'good' | 'service';
    name: string;
    description: string;
    photos: string[];
  };
}

interface DeckTestProps {
  cardWidth?: number;
}

const STACK = [
  { scale: 1, translateY: 0 },
  { scale: 0.92, translateY: 40 },
  { scale: 0.84, translateY: 80 },
];

const sampleCards: DeckCardData[] = [
  { type: 'user', id: 'user-1' },
  {
    type: 'post',
    id: 'post-1',
    post: {
      type: 'good',
      name: 'Vintage Camera',
      description: 'Beautiful vintage camera from the 1970s in perfect working condition.',
      photos: ['https://picsum.photos/seed/camera1/600/400', 'https://picsum.photos/seed/camera2/500/700'],
    },
  },
  {
    type: 'post',
    id: 'post-2',
    post: {
      type: 'service',
      name: 'Guitar Lessons',
      description: 'Professional guitar instruction for beginners and intermediate players.',
      photos: ['https://picsum.photos/seed/guitar1/700/500', 'https://picsum.photos/seed/guitar2/400/600'],
    },
  },
  {
    type: 'post',
    id: 'post-3',
    post: {
      type: 'good',
      name: 'Mountain Bike',
      description: 'High-quality mountain bike, great for trails and outdoor adventures.',
      photos: ['https://picsum.photos/seed/bike1/800/400', 'https://picsum.photos/seed/bike2/600/600'],
    },
  },
];

const DeckTest: React.FC<DeckTestProps> = ({ cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;

  const [cards, setCards] = useState<DeckCardData[]>(sampleCards);
  const [exitingCard, setExitingCard] = useState<DeckCardData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const slots = useRef(
    STACK.map(s => ({
      scale: new Animated.Value(s.scale),
      translateY: new Animated.Value(s.translateY),
    }))
  ).current;

  const exitX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !isAnimating && Math.abs(g.dx) > 5,
      onPanResponderRelease: (_, g) => {
        if (isAnimating) return;
        if (Math.abs(g.dx) > 30) swipe(g.dx < 0 ? -1 : 1);
      },
    })
  ).current;

  const swipe = (dir: -1 | 1) => {
    if (cards.length === 0) return;
    setIsAnimating(true);
    setExitingCard(cards[0]);

    Animated.parallel([
      Animated.timing(exitX, {
        toValue: dir * screenWidth,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slots[1].scale, {
        toValue: STACK[0].scale,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slots[1].translateY, {
        toValue: STACK[0].translateY,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slots[2].scale, {
        toValue: STACK[1].scale,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slots[2].translateY, {
        toValue: STACK[1].translateY,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCards(prev => {
        const next = [...prev];
        const first = next.shift();
        if (first) next.push(first);
        return next;
      });

      slots[0].scale.setValue(STACK[0].scale);
      slots[0].translateY.setValue(STACK[0].translateY);
      slots[1].scale.setValue(STACK[1].scale);
      slots[1].translateY.setValue(STACK[1].translateY);
      slots[2].scale.setValue(STACK[2].scale);
      slots[2].translateY.setValue(STACK[2].translateY);

      exitX.setValue(0);
      setExitingCard(null);
      setIsAnimating(false);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {cards?.slice(0, 3).map((card, i) => {
          if (i === 0 && exitingCard) return null;

          return (
            <Animated.View
              key={card.id}
              style={[
                styles.cardWrapper,
                {
                  transform: [
                    { scale: slots[i].scale },
                    { translateY: slots[i].translateY },
                  ],
                  zIndex: 3 - i,
                },
              ]}
              {...(i === 0 ? { ...panResponder.panHandlers } : {})}
            >
              {card.type === 'user' ? (
                <UserCard cardWidth={finalCardWidth} />
              ) : (
                <PostCard post={card.post!} cardWidth={finalCardWidth} />
              )}
            </Animated.View>
          );
        })}

        {exitingCard && (
          <Animated.View
            style={[
              styles.cardWrapper,
              { transform: [{ translateX: exitX }], zIndex: 10 },
            ]}
          >
            {exitingCard.type === 'user' ? (
              <UserCard cardWidth={finalCardWidth} />
            ) : (
              <PostCard post={exitingCard.post!} cardWidth={finalCardWidth} />
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deckContainer: { position: 'relative', width: '100%', alignItems: 'center' },
  cardWrapper: { position: 'absolute' },
});

export default DeckTest;
