import React, { useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import PostCard from '../components/PostCard';

const POSTS = [
  {
    type: 'service' as const,
    name: 'Bike Repair service will pay for job this is an issue',
    description: 'Professional bike repair and maintenance services. Will trade for houseplants, art, or cooking lessons. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
    photos: [
      'https://picsum.photos/seed/landscape1/800/400',
      'https://picsum.photos/seed/portrait1/400/600',
      'https://picsum.photos/seed/square1/500/500'
    ]
  },
  {
    type: 'good' as const,
    name: 'Vintage Camera Collection',
    description: 'Beautiful vintage cameras from the 1960s-1980s. Perfect working condition. Looking to trade for vintage watches or vinyl records.',
    photos: [
      'https://picsum.photos/seed/camera1/600/400',
      'https://picsum.photos/seed/camera2/500/700',
      'https://picsum.photos/seed/camera3/600/600'
    ]
  },
  {
    type: 'service' as const,
    name: 'Guitar Lessons',
    description: 'Experienced guitar teacher offering beginner to intermediate lessons. Will trade for cooking lessons, fresh produce, or handmade crafts.',
    photos: [
      'https://picsum.photos/seed/guitar1/700/500',
      'https://picsum.photos/seed/guitar2/400/600',
      'https://picsum.photos/seed/guitar3/500/500'
    ]
  }
];

export default function ProfileScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.min(screenWidth - 64, 400);
  const cardSpacing = 32; // Space between cards
  const peekAmount = 40; // How much of the next card is visible
  const sidePadding = (screenWidth - cardWidth) / 2 - peekAmount;
  const snapInterval = cardWidth + cardSpacing;
  const snapOffsets = POSTS.map((_, index) => index * snapInterval + sidePadding);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>Sam Casebeer</Text>
        
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, styles.tagPink]}>
            <Text style={styles.tagtextPink}>Community Builder</Text>
          </View>
          <View style={[styles.tag, styles.tagGreen]}>
            <Text style={styles.tagtextGreen}>Eco-Friendly</Text>
          </View>
          <View style={[styles.tag, styles.tagPurple]}>
            <Text style={styles.tagtextPurple}>Master Barterer</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardsWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          snapToOffsets={snapOffsets}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.cardsScrollContent,
            { paddingHorizontal: sidePadding }
          ]}
        >
          {POSTS.map((post, index) => (
            <View 
              key={index} 
              style={[
                styles.cardContainer,
                { 
                  width: cardWidth,
                  marginRight: index < POSTS.length - 1 ? cardSpacing : 0
                }
              ]}
            >
              <PostCard post={post} />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagPink: {
    backgroundColor: '#FFE5F0',
  },
  tagtextPink: {
    color: '#FF3B81',
    fontSize: 12,
    fontWeight: '500',
  },
  tagGreen: {
    backgroundColor: '#E5F5E5',
  },
  tagtextGreen: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '500',
  },
  tagPurple: {
    backgroundColor: '#F0E5FF',
  },
  tagtextPurple: {
    color: '#9747FF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardsWrapper: {
    marginTop: 20,
  },
  cardsScrollContent: {
    alignItems: 'center',
  },
  cardContainer: {
    // Card size is set dynamically
  },
});