//note: is there a way to scale cards width
//  through deck instead of scaling down whole deck?

//add button over deck peek

import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import PostCard from './PostCard';
import ProfileDeck from './ProfileDeck';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface PostCardWithDeckProps {
  post: Post;
  deckPosts: Post[]; // Posts to show in the deck
  cardWidth?: number;
  scale?: number;
  onRevealChange?: (revealed: boolean) => void; 
  revealProgress?: Animated.Value; // Shared animated value from parent, not necessary?
  deckRevealed?: boolean; // Whether the deck is currently revealed
}

const PostCardWithDeck: React.FC<PostCardWithDeckProps> = ({ 
  post, 
  deckPosts,
  cardWidth,
  scale = 1,
  onRevealChange,
  revealProgress,
  deckRevealed = false,
}) => {
  const translationY = useRef(new Animated.Value(0)).current;
  const isRevealed = useRef(false); // Track if currently revealed
  const postCardTapRef = useRef<TapGestureHandler>(null);
  
  const peekAmount = -198; // How much the deck peeks out from the top
  const revealThreshold = 100; // How far down to swipe to trigger reveal
  
 
 
  const defaultCardWidth = Math.min(screenWidth - 8, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // Render deck at its final large size
  const deckCardWidthLarge = defaultCardWidth;

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

  const handlePostCardTap = (event: any) => {
    if (event.nativeEvent.state === State.END && isRevealed.current) {
      // Collapse if currently revealed
      isRevealed.current = false;
      
      if (revealProgress) {
        Animated.spring(revealProgress, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 200,
        }).start();
      }
      
      if (onRevealChange) {
        onRevealChange(false);
      }
    }
  };

  const handleToggleReveal = () => {
    // Toggle the revealed state
    const newRevealedState = !isRevealed.current;
    isRevealed.current = newRevealedState;
    
    // Animate reveal progress
    if (revealProgress) {
      Animated.spring(revealProgress, {
        toValue: newRevealedState ? 1 : 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    }
    
    // Notify parent of reveal state change
    if (onRevealChange) {
      onRevealChange(newRevealedState);
    }
  };

  // Scale from small (1/1.4) to large (1) - deck renders at large size, scales down when collapsed
  const deckScale = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [1 / 1.4, 1],
  }) || 1;

  // Move deck upward
  const deckExpandY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -360],
  }) || 0;

  return (
    <Animated.View style={{ flex: 1 }}>
      <PanGestureHandler
        onGestureEvent={handlePanGestureEvent}
        onHandlerStateChange={handlePanStateChange}
        activeOffsetY={10}
        failOffsetX={[-20, 20]}
      >
        <Animated.View 
          style={[
            styles.container,
          ]}
        >
          {/* ProfileDeck component peeking out from behind */}
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
            pointerEvents="box-none"
          >
            {/* ProfileDeck includes the deck and buttons */}
            <ProfileDeck 
              posts={deckPosts}
              onToggleReveal={handleToggleReveal}
            />
          </Animated.View>
          
          {/* Main PostCard - moves during drag and tappable to collapse */}
          <TapGestureHandler
            ref={postCardTapRef}
            onHandlerStateChange={handlePostCardTap}
          >
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
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
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
});

export default PostCardWithDeck;
