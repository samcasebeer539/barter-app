//note: there should just be one postcard component which can have or not have a deck
//always use postcard without deck as an item within Deck

import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, Text } from 'react-native';
import { PanGestureHandler, TapGestureHandler, State } from 'react-native-gesture-handler';
import PostCard from './PostCard';
import Deck from './Deck';
import { FontAwesome6 } from '@expo/vector-icons';

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
  revealProgress?: Animated.Value; // Shared animated value from parent
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
  
  // Calculate deck dimensions based on PostCard size
  const peekAmount = 20; // How much the deck peeks out from the top
  const revealThreshold = 100; // How far down to swipe to trigger reveal
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const defaultCardWidth = Math.min(screenWidth - 110, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);

  // Render deck at its final large size
  const deckCardWidthLarge = finalCardWidth * 1.4;

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
          damping: 20,
          stiffness: 200,
        }).start();
      }
      
      if (onRevealChange) {
        onRevealChange(false);
      }
    }
  };

  const handleTradePress = () => {
    console.log('Trade button pressed');
    // Add your trade logic here
  };
  const handlePlusPress = () => {
    console.log('Plus button pressed');
    // Add your trade logic here
  };
  const handleMinusPress = () => {
    console.log('Minus button pressed');
    // Add your trade logic here
  };

  // Scale from small (1/1.4) to large (1) - deck renders at large size, scales down when collapsed
  const deckScale = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [1 / 1.4, 1],
  }) || 1;

  // Move deck upward
  const deckExpandY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -580],
  }) || 0;

  // Animate TRADE button opacity
  const tradeButtonOpacity = revealProgress?.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  }) || 0;

  // Animate button vertical position
  const buttonTranslateY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (cardHeight * 1.4 * 0.87) - (cardHeight * 0.87)],
  }) || 0;

  // Static button top position (based on small size)
  const buttonTopBase = (cardHeight * 0.87) + 20;

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
          {/* Deck component peeking out from behind */}
          <Animated.View 
            style={[
              styles.deckPeek, 
              { 
                top: -peekAmount - 190,
                transform: [
                  { translateY: deckExpandY },
                  { scale: deckScale },
                ],
              }
            ]} 
            pointerEvents="box-none"
          >
            {/* Render deck at large size - will be scaled down when collapsed */}
            <Deck posts={deckPosts} cardWidth={deckCardWidthLarge} enabled={deckRevealed} />

            {/* TRADE Button - positioned below the deck */}
            <Animated.View 
              style={[
                styles.tradeButtonWrapper,
                { 
                  top: buttonTopBase,
                  opacity: tradeButtonOpacity,
                  transform: [{ translateY: buttonTranslateY }],
                }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity 
                style={styles.tradeButton}
                onPress={handleTradePress}
                activeOpacity={0.7}
              >
                <Text style={styles.tradeButtonText}>TRADE</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* plus Button - positioned below the deck */}
            <Animated.View 
              style={[
                styles.plusButtonWrapper,
                { 
                  top: buttonTopBase,
                  opacity: tradeButtonOpacity,
                  transform: [{ translateY: buttonTranslateY }],
                }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity 
                style={styles.plusButton}
                onPress={handlePlusPress}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="plus" size={14} color='#FFFFFF' />
              </TouchableOpacity>
            </Animated.View>

            {/* minus Button - positioned below the deck */}
            <Animated.View 
              style={[
                styles.minusButtonWrapper,
                { 
                  top: buttonTopBase,
                  opacity: tradeButtonOpacity,
                  transform: [{ translateY: buttonTranslateY }],
                }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity 
                style={styles.minusButton}
                onPress={handleMinusPress}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="minus" size={14} color='#FFFFFF' />
              </TouchableOpacity>
            </Animated.View>
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
  tradeButtonWrapper: {
    position: 'absolute',
    width: '85%',
    alignItems: 'center',
    zIndex: 4,
  },
  tradeButton: {
    backgroundColor: '#FFA600',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  plusButtonWrapper: {
    position: 'absolute',
    width: '85%',
    alignItems: 'flex-start',
    marginLeft: 56,
    zIndex: 4,
  },
  plusButton: {
    backgroundColor: '#292929',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  minusButtonWrapper: {
    position: 'absolute',
    width: '85%',
    alignItems: 'flex-end',
    marginRight: 56,
    zIndex: 4,
  },
  minusButton: {
    backgroundColor: '#292929',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  plusMinusButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PostCardWithDeck;
