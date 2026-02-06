//todo
// swipe down to trigger deck
// header with edit button for deck-less cards 
import ProfileDeck from './ProfileDeck';
import React, { useState, useCallback, useRef } from 'react';
import { View, Dimensions, StyleSheet, Animated, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import PostCard from '@/components/PostCard';
import CreateCard from '@/components/CreateCard';
import { colors } from '@/styles/globalStyles';

interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
  hasDeck: boolean;
}

interface CarouselProps {
  posts: Post[];
  showCreateCard?: boolean;
  revealProgress: Animated.Value;
  isDeckRevealed: boolean;
  onToggleReveal: () => void;
  deckPosts: Post[];
}

const CARD_SLIDE_DOWN = 300;
const DECK_SLIDE_UP = 242;
const SIDE_CARD_SCALE = 0.9; // Scale for non-centered cards
const SIDE_CARD_OFFSET = 20; // Vertical offset for non-centered cards

const Carousel: React.FC<CarouselProps> = ({
  posts,
  deckPosts,
  showCreateCard = true,
  revealProgress,
  isDeckRevealed,
  onToggleReveal,
}) => {
  const [centeredIndex, setCenteredIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const cardWidth = Math.min(screenWidth - 100, 400);
  const cardSpacing = -4;
  const sidePadding = (screenWidth - cardWidth) / 2;

  const cardTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CARD_SLIDE_DOWN],
  });

  const activeDeckTranslateY = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -DECK_SLIDE_UP],
  });

  const inactiveDeckTranslateY = cardTranslateY;
  const backdropTranslateY = cardTranslateY;

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollXValue = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollXValue / (cardWidth + cardSpacing));
    setCenteredIndex(index);
  }, [cardWidth, cardSpacing]);

  const carouselItems: ({ type: 'create' } | Post)[] = [
    ...(showCreateCard ? [{ type: 'create' as const }] : []),
    ...posts,
  ];

  const getCardScale = (index: number) => {
    const inputRange = [
      (index - 1) * (cardWidth + cardSpacing),
      index * (cardWidth + cardSpacing),
      (index + 1) * (cardWidth + cardSpacing),
    ];

    return scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
      extrapolate: 'clamp',
    });
  };

  const getCardVerticalOffset = (index: number) => {
    const inputRange = [
      (index - 1) * (cardWidth + cardSpacing),
      index * (cardWidth + cardSpacing),
      (index + 1) * (cardWidth + cardSpacing),
    ];

    return scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_OFFSET, 0, SIDE_CARD_OFFSET],
      extrapolate: 'clamp',
    });
  };

  const getDeckTranslateY = (index: number, isCentered: boolean) => {
    const baseTranslateY = isCentered ? activeDeckTranslateY : inactiveDeckTranslateY;
    const verticalOffset = getCardVerticalOffset(index);
    return Animated.add(baseTranslateY, verticalOffset);
  };

  return (
    <View style={styles.cardsWrapper}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + cardSpacing}
        decelerationRate="fast"
        scrollEnabled={!isDeckRevealed}
        style={{ overflow: 'visible' }}
        contentContainerStyle={{
          paddingHorizontal: sidePadding,
          paddingBottom: 50,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {carouselItems.map((item, index) => {
          const isCreate = item.type === 'create';
          const showDeck = !isCreate && item.hasDeck;
          const isCentered = index === centeredIndex;
          const animatedScale = getCardScale(index);
          const animatedVerticalOffset = getCardVerticalOffset(index);

          return (
            <View
              key={index}
              style={{
                width: cardWidth,
                marginRight: index < carouselItems.length - 1 ? cardSpacing : 0,
                overflow: 'visible',
              }}
            >
              {/* Layer 1: ProfileDeck — centered goes up, rest go down and scale */}
              {showDeck && (
                <Animated.View
                  style={[
                    styles.deckLayer,
                    {
                      transform: [
                        { translateY: getDeckTranslateY(index, isCentered) },
                        { scale: animatedScale },
                      ],
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  <ProfileDeck
                    posts={deckPosts}
                    onToggleReveal={isCentered ? onToggleReveal : undefined}
                    toggleEnabled={isCentered}
                    isDeckRevealed={isDeckRevealed}
                  />
                </Animated.View>
              )}

              {/* Layer 2: per-card backdrop — animates down with the card and scales */}
              {showDeck && (
                <Animated.View
                  style={[
                    styles.perCardBackdrop,
                    { 
                      height: screenHeight, 
                      transform: [
                        { translateY: Animated.add(backdropTranslateY, animatedVerticalOffset) },
                        { scale: animatedScale },
                      ],
                    },
                  ]}
                  pointerEvents="none"
                />
              )}

              {/* Layer 3: the actual card — animates down and scales */}
              <Animated.View 
                style={[
                  styles.cardLayer, 
                  { 
                    transform: [
                      { translateY: Animated.add(cardTranslateY, animatedVerticalOffset) },
                      { scale: animatedScale },
                    ],
                  }
                ]}
              >
                {isCreate ? (
                  <CreateCard scale={1} cardWidth={cardWidth} />
                ) : (
                  <PostCard post={item} scale={1} cardWidth={cardWidth} />
                )}
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardsWrapper: {
    overflow: 'visible',
  },
  deckLayer: {
    position: 'absolute',
    top: 574,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  perCardBackdrop: {
    position: 'absolute',
    top: -8,
    left: -28,
    right: -32,
    bottom: 0,
    backgroundColor: colors.ui.background,
    zIndex: 2,
  },
  cardLayer: {
    position: 'relative',
    zIndex: 3,
  },
});

export default Carousel;