import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import PostCard from './PostCard';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface PostCardWithDeckProps {
  post: Post;
  cardWidth?: number;
  scale?: number;
  onRevealChange?: (revealed: boolean) => void;
  revealProgress?: Animated.Value; // Shared animated value from parent
}

const PostCardWithDeck: React.FC<PostCardWithDeckProps> = ({ 
  post, 
  cardWidth,
  scale = 1,
  onRevealChange,
  revealProgress,
}) => {
  const translationY = useRef(new Animated.Value(0)).current;
  const isRevealed = useRef(false); // Track if currently revealed
  
  // Calculate deck dimensions based on PostCard size
  const peekAmount = 20; // How much the deck peeks out from the top
  const revealThreshold = 100; // How far down to swipe to trigger reveal
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const defaultCardWidth = Math.min(screenWidth - 110, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translationY } }],
    { useNativeDriver: true }
  );

  const handlePanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: finalTranslationY } = event.nativeEvent;
      
      // Determine if we should reveal or collapse based on swipe distance
      const shouldReveal = finalTranslationY > revealThreshold && !isRevealed.current;
      
      // Update revealed state
      isRevealed.current = shouldReveal;
      
      // Animate reveal progress (0 = collapsed, 1 = revealed)
      if (revealProgress) {
        Animated.spring(revealProgress, {
          toValue: shouldReveal ? 1 : 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      }
      
      // Reset translation
      Animated.spring(translationY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      
      // Notify parent of reveal state change
      if (onRevealChange) {
        onRevealChange(shouldReveal);
      }
    }
  };

  const handleTap = (event: any) => {
    if (event.nativeEvent.state === State.END && isRevealed.current) {
      // Collapse if currently revealed
      isRevealed.current = false;
      
      if (revealProgress) {
        Animated.spring(revealProgress, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      }
      
      if (onRevealChange) {
        onRevealChange(false);
      }
    }
  };

  // Animate deck scale and position when revealed
  const deckScale = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15], // Slightly larger when revealed
  }) || 1;

  // Move deck upward to screen center when revealed
  const deckExpandY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -((cardHeight / 2) - (screenHeight / 2) + peekAmount)], // Negative to move UP
  }) || 0;

  return (
    <TapGestureHandler
      onHandlerStateChange={handleTap}
    >
      <Animated.View style={{ flex: 1 }}>
        <PanGestureHandler
          onGestureEvent={handlePanGestureEvent}
          onHandlerStateChange={handlePanStateChange}
          activeOffsetY={10} // Only activate after 10px vertical movement
          failOffsetX={[-20, 20]} // Fail if horizontal movement exceeds 20px
        >
          <Animated.View 
            style={[
              styles.container,
            ]}
          >
            {/* Deck peeking out from behind - position absolute keeps it stationary during drag */}
            <Animated.View 
              style={[
                styles.deckPeek, 
                { 
                  top: -peekAmount,
                  transform: [
                    { translateY: deckExpandY },
                    { scale: deckScale },
                  ],
                }
              ]} 
              pointerEvents="none"
            >
              <View style={[styles.deckCard, { height: cardHeight * 0.85 }]} />
              <View style={[styles.deckCard, styles.deckCardSecond, { height: cardHeight * 0.85 }]} />
            </Animated.View>
            
            {/* Main PostCard - moves during drag */}
            <Animated.View 
              style={[
                styles.cardWrapper,
                {
                  transform: [{ translateY: translationY }],
                },
              ]}
            >
              <PostCard post={post} scale={scale} cardWidth={cardWidth} />
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cardWrapper: {
    zIndex: 10,
  },
  deckPeek: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  deckCard: {
    width: '85%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    position: 'absolute',
    top: 0,
  },
  deckCardSecond: {
    top: 6,
    width: '90%',
  },
});

export default PostCardWithDeck;
