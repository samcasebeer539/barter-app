import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import PostCard from '../components/PostCard';

export default function ProfileScreen() {
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

      <View style={styles.cardWrapper}>
        <PostCard
          post={{
            type: 'service',
            name: 'Bike Repair service will pay for job this is an issue',
            description: 'Professional bike repair and maintenance services. Will trade for houseplants, art, or cooking lessons. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
            photos: [
              'https://picsum.photos/seed/bike1/400/600',
              'https://picsum.photos/seed/bike2/400/600',
              'https://picsum.photos/seed/bike3/400/600'
            ]
          }}
        />
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
  cardWrapper: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
});