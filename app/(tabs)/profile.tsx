import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import DecksProfile from '@/components/DeckProfile';
import { colors } from '@/styles/globalStyles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Post, User } from '@/types/index';
import { getCurrentUser, updateUser } from '@/services/userService';
import { getUserPosts } from '@/services/postService';

const TOP_PADDING = 0;
const BOTTOM_PADDING = 20;

const SECONDARY_USER: User = {
  first_name: 'Jay',
  last_name: 'Wilson',
  pronouns: '(she/he/they)',
  email: 'jathwils@ucsc.edu',
  phone: '916123456',
  bio: 'Pro Smasher',
  profileImageUrl: 'https://picsum.photos/seed/bird/800/800',
  email_visible: false,
  phone_visible: false,
};

const SECONDARY_POSTS: Post[] = [
  {
    name: 'Web Design',
    description: 'Professional website design services',
    photos: ['https://picsum.photos/seed/web1/600/600'],
    date_posted: '',
  },
  {
    name: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand',
    photos: ['https://picsum.photos/seed/stand1/600/600'],
    date_posted: '',
  },
  {
    name: 'Tutoring',
    description: 'Math and science tutoring for high school',
    photos: ['https://picsum.photos/seed/tutor1/600/600'],
    date_posted: '',
  },
  {
    name: 'Bicycle',
    description: 'Mountain bike, lightly used',
    photos: ['https://picsum.photos/seed/bike1/600/600'],
    date_posted: '',
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [isDeckRevealed, setIsDeckRevealed] = useState(false);
  const [primaryUser, setPrimaryUser] = useState<User | null>(null);
  const [primaryPosts, setPrimaryPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getCurrentUser(), getUserPosts()])
      .then(([user, posts]) => {
        setPrimaryUser(user);
        setPrimaryPosts(posts);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        setError(err.message ?? 'Unknown error');
      });
  }, []);

  const handleSaveUser = async (updated: User) => {
    try {
      await updateUser(updated);
      setPrimaryUser(updated);
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  };

  // Only updates local state — persistence happens in DeckProfile.handleSavePost
  const handlePostsChange = (updated: Post[]) => {
    setPrimaryPosts(updated);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      const kbHeight = e.endCoordinates.height;
      setKeyboardHeight(kbHeight);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollY.current + kbHeight,
          animated: true,
        });
      }, 50);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (error) return (
    <SafeAreaView style={styles.container}>
      <Text style={{ color: 'red', padding: 20 }}>Error: {error}</Text>
    </SafeAreaView>
  );

  if (!primaryUser) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconContainer}>
        <FontAwesome6 name="arrows-rotate" size={24} color={colors.actions.trade} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: keyboardHeight > 0 ? BOTTOM_PADDING + keyboardHeight : 0 },
        ]}
        keyboardShouldPersistTaps="handled"
        onScroll={e => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.topSpacer} />

        <View style={styles.deckWrapper}>
          <DecksProfile
            posts={primaryPosts}
            primaryUser={primaryUser}
            secondaryPosts={SECONDARY_POSTS}
            secondaryUser={SECONDARY_USER}
            onToggleReveal={() => setIsDeckRevealed(prev => !prev)}
            toggleEnabled={true}
            isDeckRevealed={isDeckRevealed}
            onSaveUser={handleSaveUser}
            onPostsChange={handlePostsChange}
          />
        </View>
      </ScrollView>

      <View style={styles.settingsButtonRow}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ui.background,
  },
  loadingIconContainer: {
    height: 44,
    width: 44,
    borderRadius: 36,
    backgroundColor: colors.ui.secondary,
  
    alignItems: 'center',
    justifyContent: 'center'
  },
  scroll: {
    flex: 1,
    marginBottom: -8,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 0,
  },
  topSpacer: {
    height: TOP_PADDING,
  },
  deckWrapper: {
    alignItems: 'center',
  },
  settingsButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 38,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: colors.ui.background,
  },
  settingsButton: {
    flex: 1,
    height: 36,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: colors.ui.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});