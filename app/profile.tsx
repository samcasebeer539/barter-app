import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import DecksProfile from '../components/DecksProfile';
import { colors } from '../styles/globalStyles';

export default function ProfileDeck() {
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);

  // Primary deck posts (user's posts)
  const primaryPosts = [
    {
    type: 'good' as const,
    name: 'Fantasy Books',
    description:
      'Includes LOTR, ASOIAF, Earthsea, Narnia',
    photos: [
      'https://picsum.photos/seed/book/800/400',
      'https://picsum.photos/seed/portrait1/400/600',
      'https://picsum.photos/seed/square1/500/500',
    ],
  },
  {
    type: 'service' as const,
    name: 'Bike Repair',
    description:
      'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
    photos: [
      'https://picsum.photos/seed/camera1/600/400',
      'https://picsum.photos/seed/camera2/500/700',
      'https://picsum.photos/seed/camera3/600/600',
    ],
  },
    {
      type: 'good' as const,
      name: 'Skateboard',
      description: 'Well-used skateboard, still rides great',
      photos: ['https://picsum.photos/seed/skate1/600/600']
    },
    {
      type: 'service' as const,
      name: 'Guitar Lessons',
      description: 'Beginner to intermediate guitar instruction',
      photos: ['https://picsum.photos/seed/guitar1/600/600']
    },
    {
      type: 'good' as const,
      name: 'Books Collection',
      description: 'Set of sci-fi novels',
      photos: ['https://picsum.photos/seed/books1/600/600']
    }
  ];

  // Secondary deck posts (other user's posts or additional content)
  const secondaryPosts = [
    {
      type: 'service' as const,
      name: 'Web Design',
      description: 'Professional website design services',
      photos: ['https://picsum.photos/seed/web1/600/600']
    },
    {
      type: 'good' as const,
      name: 'Laptop Stand',
      description: 'Adjustable aluminum laptop stand',
      photos: ['https://picsum.photos/seed/stand1/600/600']
    },
    {
      type: 'service' as const,
      name: 'Tutoring',
      description: 'Math and science tutoring for high school',
      photos: ['https://picsum.photos/seed/tutor1/600/600']
    },
    {
      type: 'good' as const,
      name: 'Bicycle',
      description: 'Mountain bike, lightly used',
      photos: ['https://picsum.photos/seed/bike1/600/600']
    }
  ];

  const handleToggleReveal = () => {
    setIsDeckRevealed(!isDeckRevealed);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <DecksProfile 
          posts={primaryPosts}
          secondaryPosts={primaryPosts}
          onToggleReveal={handleToggleReveal}
          toggleEnabled={true}
          isDeckRevealed={isDeckRevealed}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: 690,
  },
});