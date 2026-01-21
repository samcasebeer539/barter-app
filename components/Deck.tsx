import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PostCard from './PostCard';

//everything in here will be replaced. 
//usage: in profile, deck should always load in with UserCard on top
//       in feed, deck should always load with clicked on PostCard first and UserCard second


interface Post {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

interface DeckProps {
  post: Post;
  cardWidth?: number;
}

const Deck: React.FC<DeckProps> = ({ post, cardWidth }) => {
  const screenWidth = Dimensions.get('window').width;
  const defaultCardWidth = Math.min(screenWidth - 64, 400);
  const finalCardWidth = cardWidth ?? defaultCardWidth;
  const cardHeight = finalCardWidth * (3.5 / 2.5);
  
  const scaledWidth = finalCardWidth * 0.85;
  const scaledHeight = cardHeight * 0.85;
  
  const offset = 6; // offset for the backing cards

  return (
    <View style={styles.deckContainer}>
      {/* Second backing card (furthest back) */}
      <View
        style={[
          styles.backingCard,
          {
            width: scaledWidth,
            height: scaledHeight,
            bottom: offset * 2,
            right: offset * 2,
          },
        ]}
      />
      
      {/* First backing card (middle) */}
      <View
        style={[
          styles.backingCard,
          {
            width: scaledWidth,
            height: scaledHeight,
            bottom: offset,
            right: offset,
          },
        ]}
      />
      
      {/* Main PostCard (front) - positioned with same offset */}
      <View style={[styles.frontCard, { bottom: -15, right: -5 }]}>
        <PostCard post={post} scale={0.85} cardWidth={finalCardWidth} />
      </View>
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
  },
});

export default Deck;
