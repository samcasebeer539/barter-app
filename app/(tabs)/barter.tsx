import { View, StyleSheet, ScrollView } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/globalStyles';
import TradeDeck from '../../components/TradeDeck';
import OfferDeck from '../../components/OfferDeck';
import TradeTurns, { TradeTurn } from '../../components/TradeTurns';
import OffersTradesDealsBar from '../../components/OffersTradesDealsBar';

// ---- MOCK DATA (unchanged) ----
const POSTS = [
  {
    type: 'good' as const,
    name: 'Fantasy Books',
    description: 'Includes LOTR, ASOIAF, Earthsea, Narnia',
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
    type: 'service' as const,
    name: 'Guitar Lessons',
    description: 'Experienced guitar teacher offering beginner to intermediate lessons.',
    photos: [
      'https://picsum.photos/seed/guitar1/700/500',
      'https://picsum.photos/seed/guitar2/400/600',
      'https://picsum.photos/seed/guitar3/500/500',
    ],
  },
];

// ---- SCREEN ----
export default function ActiveTradesTestScreen() {
  const [resetKey, setResetKey] = useState(0);
  const [tab, setTab] = useState<'offers' | 'trades' | 'deals'>('offers'); // default to offers

  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <OffersTradesDealsBar
        onOffersPress={() => setTab('offers')}
        onTradesPress={() => setTab('trades')}
        onDealsPress={() => setTab('deals')}
      />

      {/* CONTENT */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
      >
        {/* spacer for absolute top bar */}
        <View style={styles.topSpacer} />

        {/* OFFERS PAGE */}
        {tab === 'offers' && (
          <View>
            {/* TODO: OffersDeck */}
                      <View>
            <View style={{ height: 590 }} />
              <OfferDeck posts={POSTS} />
            </View>
          </View>
        )}

        {/* TRADES PAGE (TradeDeck lives here) */}
        {tab === 'trades' && (
          <View>
            <View style={{ height: 590 }} />
            <TradeDeck posts={POSTS} />
            <View style={{ height: 590 }} />
            <TradeDeck posts={POSTS} />
          </View>
          
          
        )}

        {/* DEALS PAGE */}
        {tab === 'deals' && (
          <View>
            <View style={{ height: 590 }} />
            <TradeDeck posts={POSTS} />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },

  scroll: {
    flex: 1,
  },

  contentContainer: {
    paddingTop: 0,
  },

  // space for absolute top bar
  topSpacer: {
    height: 110,
  },

  bottomSpacer: {
    height: 0,
  },
});
