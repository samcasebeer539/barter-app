import React, { useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
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
  const gestureState = useRef(new Animated.Value(State.UNDETERMINED)).current;
  
  // Calculate deck dimensions based on PostCard size
  const peekAmount = 20; // How much the deck peeks out from the top
  const revealThreshold = 100; // How far down to swipe to trigger reveal

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translationY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY: finalTranslationY } = event.nativeEvent;
      
      // Determine if we should reveal or collapse based on swipe distance
      const shouldReveal = finalTranslationY > revealThreshold;
      
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

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      activeOffsetY={10} // Only activate after 10px vertical movement
      failOffsetX={[-20, 20]} // Fail if horizontal movement exceeds 20px
    >
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateY: translationY }],
          },
        ]}
      >
        {/* Deck peeking out from behind */}
        <View style={[styles.deckPeek, { top: -peekAmount }]}>
          <View style={styles.deckCard} />
          <View style={[styles.deckCard, styles.deckCardSecond]} />
        </View>
        
        {/* Main PostCard */}
        <PostCard post={post} scale={scale} cardWidth={cardWidth} />
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deckPeek: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  deckCard: {
    width: '85%',
    height: 40,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d4d4d4',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
    position: 'absolute',
    top: 0,
  },
  deckCardSecond: {
    top: 6,
    width: '90%',
  },
});

export default PostCardWithDeck;
