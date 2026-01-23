import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import CardWheel from '../components/CardWheel';
import ProfilePicture from '@/components/ProfilePicture';
import PostCard from '@/components/PostCard';

export default function BarterScreen() {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);

  // Reset CardWheel whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  const handleBackPress = () => {
    router.push('/trades');
  };

  const sampleCards = [
    {
      title: 'Accept',
      photo: require('@/assets/barter-cards/accept.png'),
    },
    {
      title: 'Decline',
      photo: require('@/assets/barter-cards/decline.png'),
    },
    {
      title: 'Counter',
      photo: require('@/assets/barter-cards/counter.png'),
    },
    {
      title: 'Query',
      photo: require('@/assets/barter-cards/query.png'),
    },
  ];

  // Sample posts for the two cards
  const leftPost = {
    type: 'service' as const,
    name: 'Guitar Lessons',
    description: 'Professional guitar instruction for all skill levels. Learn music theory, techniques, and your favorite songs.',
    photos: [
      'https://picsum.photos/seed/guitar1/800/400',
      'https://picsum.photos/seed/guitar2/400/600',
    ],
  };

  const rightPost = {
    type: 'good' as const,
    name: 'Vintage Camera',
    description: 'Classic film camera in excellent condition. Perfect for photography enthusiasts.',
    photos: [
      'https://picsum.photos/seed/camera1/800/400',
      'https://picsum.photos/seed/camera2/400/600',
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <FontAwesome6 name="angle-left" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Header with profile photo and name - centered */}
      <View style={styles.header}>
        <ProfilePicture size={50} avatarText="👤" />
        <Text style={styles.name}>Jay Wilson</Text>
      </View>

      {/* Main content area with PostCards */}
      <View style={styles.mainContent}>
        <View style={styles.cardsContainer}>
          {/* Left card - larger and higher */}
          <View style={styles.leftCard}>
            <PostCard 
              post={leftPost}
              cardWidth={200}
              scale={1}
            />
          </View>
          
          {/* Right card - smaller and lower */}
          <View style={styles.rightCard}>
            <PostCard 
              post={rightPost}
              cardWidth={140}
              scale={1}
            />
          </View>
        </View>
      </View>

      {/* Card Wheel at bottom */}
      <View style={styles.cardWheelContainer}>
        <CardWheel cards={sampleCards} resetKey={resetKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginBottom: 400,
  },
  leftCard: {
    width: 200,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCard: {
    width: 140,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cardWheelContainer: {
    position: 'absolute',
    bottom: -870,
    left: 0,
    right: 0,
    paddingBottom: 0,
  },
});
