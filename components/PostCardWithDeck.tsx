import React from 'react';
import { View, StyleSheet } from 'react-native';
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
}

const PostCardWithDeck: React.FC<PostCardWithDeckProps> = ({ 
  post, 
  cardWidth,
  scale = 1 
}) => {
  // Calculate deck dimensions based on PostCard size
  const peekAmount = 20; // How much the deck peeks out from the top
  
  return (
    <View style={styles.container}>
      {/* Deck peeking out from behind */}
      <View style={[styles.deckPeek, { top: -peekAmount }]}>
        <View style={styles.deckCard} />
        <View style={[styles.deckCard, styles.deckCardSecond]} />
      </View>
      
      {/* Main PostCard */}
      <PostCard post={post} scale={scale} cardWidth={cardWidth} />
    </View>
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
