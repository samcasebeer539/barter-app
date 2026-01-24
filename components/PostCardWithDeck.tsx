//note: there should just be one postcard component which can have or not have a deck
//always use postcard without deck as an item within Deck

import React, { useRef, useMemo } from 'react';
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
}

const PostCardWithDeck: React.FC<PostCardWithDeckProps> = ({ 
  post, 
  deckPosts,
  cardWidth,
  scale = 1,
  onRevealChange,
  revealProgress,
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

  // Animated card width for the deck
  const animatedDeckCardWidth = useMemo(() => {
    if (!revealProgress) return finalCardWidth;
    
    return revealProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [finalCardWidth, finalCardWidth * 1.4],
    });
  }, [revealProgress, finalCardWidth]);

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

  // Move deck upward
  const deckExpandY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -580], // Move up 580px when revealed
  }) || 0;

  // Animate TRADE button opacity
  const tradeButtonOpacity = revealProgress?.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1], // Fade in when revealed
  }) || 0;

  // Animate button vertical position based on deck size change
  const buttonTranslateY = revealProgress?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (cardHeight * 1.4 * 0.87) - (cardHeight * 0.87)],
  }) || 0;

  // Static button top position
  const buttonTopBase = (cardHeight * 0.87) + 20;

  return (
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
          {/* Deck component peeking out from behind */}
          <Animated.View 
            style={[
              styles.deckPeek, 
              { 
                top: -peekAmount - 190,
                transform: [
                  { translateY: deckExpandY },
                ],
              }
            ]} 
            pointerEvents="box-none"
          >
            {/* Create a wrapper to handle the animated width */}
            <Animated.View style={{ width: animatedDeckCardWidth }}>
              <DeckWrapper 
                posts={deckPosts} 
                cardWidth={animatedDeckCardWidth}
              />
            </Animated.View>

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

// Wrapper component to re-render Deck when cardWidth changes
const DeckWrapper: React.FC<{ posts: Post[], cardWidth: Animated.AnimatedInterpolation<number> }> = ({ posts, cardWidth }) => {
  // We can't pass animated values directly to non-animated components
  // So we'll use a static width and let the parent Animated.View handle scaling
  const [width, setWidth] = React.useState(0);
  
  React.useEffect(() => {
    const listener = cardWidth.addListener(({ value }) => {
      setWidth(value);
    });
    
    return () => {
      cardWidth.removeListener(listener);
    };
  }, [cardWidth]);
  
  if (width === 0) return null;
  
  return <Deck posts={posts} cardWidth={width} />;
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
