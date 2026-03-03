import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity} from 'react-native';
import DecksProfile from '@/components/DeckProfile';
import { colors } from '@/styles/globalStyles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome6 } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';

export default function ProfileDeck() {
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const router = useRouter();

  // Primary deck posts (user's posts)
  const primaryPosts = [
    {
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
      name: 'Skateboard',
      description: 'Well-used skateboard, still rides great',
      photos: ['https://picsum.photos/seed/skate1/600/600']
    },
    {
      name: 'Guitar Lessons',
      description: 'Beginner to intermediate guitar instruction',
      photos: ['https://picsum.photos/seed/guitar1/600/600']
    },
    {
      name: 'Books Collection',
      description: 'Set of sci-fi novels',
      photos: ['https://picsum.photos/seed/books1/600/600']
    }
  ];

  // Secondary deck posts (other user's posts or additional content)
  const secondaryPosts = [
    {
      name: 'Web Design',
      description: 'Professional website design services',
      photos: ['https://picsum.photos/seed/web1/600/600']
    },
    {
      name: 'Laptop Stand',
      description: 'Adjustable aluminum laptop stand',
      photos: ['https://picsum.photos/seed/stand1/600/600']
    },
    {
      name: 'Tutoring',
      description: 'Math and science tutoring for high school',
      photos: ['https://picsum.photos/seed/tutor1/600/600']
    },
    {
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={{ flex: 1 }}
        >
            <View style={styles.content}>
                <DecksProfile
                    posts={primaryPosts}
                    secondaryPosts={secondaryPosts}
                    onToggleReveal={handleToggleReveal}
                    toggleEnabled={true}
                    isDeckRevealed={isDeckRevealed}
                />
            </View>
        </KeyboardAvoidingView>
        <View style={styles.settingsButtonRow}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <FontAwesome6 name="gear" size={22} color={colors.ui.secondarydisabled} />
          </TouchableOpacity>
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
    top: 82,
  },
  settingsButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 46,
    paddingHorizontal: 12,
  },
  settingsButton: {
    width: 116,
    height: 36,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
});