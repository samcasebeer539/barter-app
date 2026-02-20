//todo: modify order of deck based on where its called
//     profile (implemented): usercard on top
//     feed (todo): clicked on post on top, usercard 2nd
//todo: handle multiple user's cards and usercards in profile

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import PostCard from './PostCard';
import UserCard from './UserCard';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface User {
  name: string;
  pronouns: string;
  location: string;
  bio: string;
  tags?: { text: string; color: string }[];
  avatarText?: string;
  goodsCount?: number;
  servicesCount?: number;
  profileImageUrl?: string;
}

interface DeckProps {
  posts: Post[];
  user?: User;
  cardWidth?: number;
  enabled?: boolean; // Whether the deck is interactive
}

type DeckItem =
  | { type: 'user' }
  | { type: 'post'; post: Post };


const Deck: React.FC<DeckProps> = ({ posts, user, cardWidth, enabled = true }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 38, 290);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const scaledWidth = finalCardWidth * 0.85;
  const scaledHeight = cardHeight * 0.85;
  const offset = 6;

  // Card position definitions
  const POSITIONS = {
    first: { x: 5, y: 15 },
    second: { x: 12, y: 22 },
    third: { x: 19, y: 29 },
  };

  const SWIPE_THRESHOLD = screenWidth * 0.06;
  const GESTURE_THRESHOLD = 10; // Minimum horizontal movement before capturing gesture

  //if user only has single item, duplicate usercard and postcard in array
  const shouldRepeat = posts.length < 2;
  const baseItems: DeckItem[] = [
    { type: 'user' },
    ...posts.map((post): DeckItem => ({ type: 'post', post })),
  ];
  const [cards, setCards] = useState<DeckItem[]>(
    shouldRepeat
      ? [...baseItems, ...baseItems] // add both elements again
      : baseItems
  );


  // Create animated values for each card in the deck
  const cardAnimations = useRef(
    cards.map((_, index) => ({
      position: new Animated.ValueXY(
        index === 0 ? POSITIONS.first :
        index === 1 ? POSITIONS.second :
        index === 2 ? POSITIONS.third :
        { x: -22, y: -32 } // Cards beyond third start at third position
      ),
      swipeX: new Animated.Value(0),
    }))
  ).current;

  // Track which card indices are currently visible
  const [visibleIndices, setVisibleIndices] = useState({
    first: 0,
    second: 1,
    third: 2,
  });

  // Use a ref to track the current visible indices immediately
  const visibleIndicesRef = useRef(visibleIndices);
  visibleIndicesRef.current = visibleIndices;

  // Track if we're currently animating a swipe
  const isAnimatingRef = useRef(false);
  
  // Track enabled state in a ref so PanResponder can access current value
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture on touch start
      onMoveShouldSetPanResponder: (_, g) => {
        // Only capture if:
        // 1. Deck is enabled
        // 2. Not currently animating
        // 3. Horizontal movement is dominant AND exceeds threshold
        // This prevents interfering with photo ScrollView
        return enabledRef.current && 
               !isAnimatingRef.current && 
               Math.abs(g.dx) > GESTURE_THRESHOLD &&
               Math.abs(g.dx) > Math.abs(g.dy) * 2; // Require significantly more horizontal than vertical movement
      },

      onPanResponderGrant: () => {
        if (!enabledRef.current) return;
        // Ensure the front card's swipeX is at 0 when we start touching
        const firstCardIndex = visibleIndicesRef.current.first;
        cardAnimations[firstCardIndex].swipeX.setOffset(0);
        cardAnimations[firstCardIndex].swipeX.setValue(0);
      },

      onPanResponderMove: (_, gesture) => {
        if (!enabledRef.current) return;
        const firstCardIndex = visibleIndicesRef.current.first;
        cardAnimations[firstCardIndex].swipeX.setValue(gesture.dx);
      },

      onPanResponderRelease: (_, gesture) => {
        if (!enabledRef.current) return;
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOut(1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOut(-1);
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeOut = (direction: number) => {
    isAnimatingRef.current = true;
    
    const firstIndex = visibleIndicesRef.current.first;
    const secondIndex = visibleIndicesRef.current.second;
    const thirdIndex = visibleIndicesRef.current.third;
    
    // Calculate next card index (wrap around)
    const nextIndex = (thirdIndex + 1) % cards.length;

    Animated.parallel([
      // Swipe out the old first card
      Animated.timing(cardAnimations[firstIndex].swipeX, {
        toValue: direction * screenWidth,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move second card to first position
      Animated.timing(cardAnimations[secondIndex].position, {
        toValue: POSITIONS.first,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move third card to second position
      Animated.timing(cardAnimations[thirdIndex].position, {
        toValue: POSITIONS.second,
        duration: 250,
        useNativeDriver: true,
      }),
      // Move next card to third position
      Animated.timing(cardAnimations[nextIndex].position, {
        toValue: POSITIONS.third,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset the swipeX for the new front card (which is secondIndex)
      cardAnimations[secondIndex].swipeX.flattenOffset();
      cardAnimations[secondIndex].swipeX.setValue(0);
      
      // Update visible indices after reset
      const newIndices = {
        first: secondIndex,
        second: thirdIndex,
        third: nextIndex,
      };
      setVisibleIndices(newIndices);
      visibleIndicesRef.current = newIndices;
      
      isAnimatingRef.current = false;
    });
  };

  const resetPosition = () => {
    Animated.spring(cardAnimations[visibleIndicesRef.current.first].swipeX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // Default user data if none provided
  const defaultUser: User = {
    name: "Jay Wilson",
    pronouns: "(she/he/they)",
    location: "Santa Cruz, CA",
    bio: "pro smasher",
    profileImageUrl: 'https://picsum.photos/seed/cat/400/400'
  };

  const userToRender = user ?? defaultUser;

  const renderCard = (index: number, isFirst: boolean = false) => {
    const card = cards[index];
    if (!card) return null;

    const cardAnim = cardAnimations[index];

    // Create rotation interpolation for this specific card
    const rotate = cardAnim.swipeX.interpolate({
      inputRange: [-screenWidth, 0, screenWidth],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    // For the first card, we need to add swipeX to position.x
    const translateX = isFirst 
      ? Animated.add(cardAnim.position.x, cardAnim.swipeX)
      : cardAnim.position.x;

    return (
      <Animated.View
        key={index}
        style={[
          styles.frontCard,
          {
            transform: [
              { translateX },
              { translateY: cardAnim.position.y },
              ...(isFirst ? [{ rotate }] : [{ scale: 1.0 }])
            ],
          },
        ]}
      >
        {card.type === 'user' ? (
          <UserCard 
            user={userToRender}
            scale={1} 
            cardWidth={finalCardWidth} 
          />
        ) : (
          <PostCard
            post={card.post}
            scale={1}
            cardWidth={finalCardWidth}
          />
        )}
      </Animated.View>
    );
  };

  return (
    <View 
      style={styles.deckContainer} 
      {...(enabled ? panResponder.panHandlers : {})}
    >
      {/* Render all cards, but only visible ones will be seen */}
      {renderCard(visibleIndices.third)}
      {renderCard(visibleIndices.second)}
      {renderCard(visibleIndices.first, true)}
    </View>
  );
};

const styles = StyleSheet.create({
  deckContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  
  },
  backingCard: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d4d4d4',
    backgroundColor: 'transparent',
  },
  frontCard: {
  position: 'absolute',
  zIndex: 10,
  elevation: 8, // Android shadow
},
});

export default Deck;