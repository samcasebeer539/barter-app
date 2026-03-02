import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, KeyboardEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/globalStyles';
import TradeDeck from '../../components/DeckTrade';
import OfferDeck from '../../components/DeckOffers';
import OffersTradesDealsBar from '../../components/BarOffersTradesDeals';
import { TRADE_ACTIONS } from '../../config/tradeConfig';

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

export default function ActiveTradesTestScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const [resetKey, setResetKey] = useState(0);
  const [tab, setTab] = useState<'offers' | 'trades' | 'deals' | 'queries'>('offers');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const queriesActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
    []
  );
  const offersActions = useMemo(
    () => TRADE_ACTIONS.filter(a => ['rescind'].includes(a.actionType)),
    []
  );
  const tradesActions = useMemo(
    () => TRADE_ACTIONS.filter(a =>
      ['query', 'counter', 'stall', 'verify', 'accept', 'decline', 'wait', 'play', 'cancel'].includes(a.actionType)
    ),
    []
  );
  const dealsActions = useMemo(
    () => TRADE_ACTIONS.filter(a =>
      ['accept', 'decline', 'where', 'when', 'wait', 'play', 'cancel'].includes(a.actionType)
    ),
    []
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollViewRef.current?.scrollTo({
        y: scrollY.current + e.endCoordinates.height * 0.8,
        animated: true,
      });
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  return (
    <View style={styles.container}>
      <OffersTradesDealsBar
        onQueriesPress={() => setTab('queries')}
        onOffersPress={() => setTab('offers')}
        onTradesPress={() => setTab('trades')}
        onDealsPress={() => setTab('deals')}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <View style={styles.topSpacer} />
        {tab === 'queries' && (
          <View>
            <View style={{ height: 598 }} />
            <OfferDeck
              posts={POSTS}
              onHorizontalGestureStart={() => setScrollEnabled(false)}
              onGestureEnd={() => setScrollEnabled(true)}
              actions={queriesActions}
            />
          </View>
        )}
        {tab === 'offers' && (
          <View>
            <View style={{ height: 598 }} />
            <OfferDeck
              posts={POSTS}
              onHorizontalGestureStart={() => setScrollEnabled(false)}
              onGestureEnd={() => setScrollEnabled(true)}
              actions={offersActions}
            />
          </View>
        )}

        {tab === 'trades' && (
          <View>
            <View style={{ height: 398 }} />
            <TradeDeck
              posts={POSTS}
              actions={tradesActions}
            />
            <View style={{ height: 6 }} />
            <TradeDeck
              posts={POSTS}
              actions={tradesActions}
            />
          </View>
        )}

        {tab === 'deals' && (
          <View>
            <View style={{ height: 398 }} />
            <TradeDeck
              posts={POSTS}
              actions={dealsActions}
            />
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
  topSpacer: {
    height: 110,
  },
  bottomSpacer: {
    height: 0,
  },
});