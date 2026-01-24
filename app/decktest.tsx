
import { View, StyleSheet } from 'react-native';
import Deck from '@/components/Deck';

const POSTS = [
  {
    type: 'service' as const,
    name: 'Bike Repair service',
    description:
      'Professional bike repair and maintenance services. I have over 10 years of experience fixing all types of bikes from mountain bikes to road bikes.',
    photos: [
      'https://picsum.photos/seed/landscape1/800/400',
      'https://picsum.photos/seed/portrait1/400/600',
      'https://picsum.photos/seed/square1/500/500',
    ],
  },
  {
    type: 'good' as const,
    name: 'Vintage Camera Collection',
    description:
      'Beautiful vintage cameras from the 1960s-1980s. Perfect working condition.',
    photos: [
      'https://picsum.photos/seed/camera1/600/400',
      'https://picsum.photos/seed/camera2/500/700',
      'https://picsum.photos/seed/camera3/600/600',
    ],
  },
  {
    type: 'service' as const,
    name: 'Guitar Lessons',
    description:
      'Experienced guitar teacher offering beginner to intermediate lessons. ',
    photos: [
      'https://picsum.photos/seed/guitar1/700/500',
      'https://picsum.photos/seed/guitar2/400/600',
      'https://picsum.photos/seed/guitar3/500/500',
    ],
  },
];
export default function DeckTestScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}><Deck posts={POSTS} cardWidth={375} /></View>
      
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },

  deckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 150,
    marginLeft: -24,
  },
});
