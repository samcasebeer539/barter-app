import { View, StyleSheet, ScrollView } from 'react-native';
import { useCallback, useState } from 'react';
// import ActiveTrade, { TradeTurn } from '../components/ActiveTrade';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/globalStyles';
import OffersSection from '../components/OffersSection';
import TradeDeck from '../components/TradeDeck';
import TradeTurns, { TradeTurn, TradeTurnType } from '../components/TradeTurns';


const POSTS = [
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

const trade1Turns: TradeTurn[] = [
  { type: 'turnOffer', item: 'Fantasy Books', isUser: true  },
  { type: 'turnTrade', user: 'Jay Wilson', item: 'Bike Repair', isUser: false  },
  { type: 'turnCounter', isUser: true  },
  { type: 'turnAccept', user: 'Jay Wilson', isUser: false  },
];

const trade2Turns: TradeTurn[] = [
  { type: 'turnOffer', item: 'Guitar Lessons', isUser: true  },
  { type: 'turnTrade', user: 'Sarah', item: 'Bike Repair', isUser: false  },
  { type: 'turnAccept', isUser: true},
];

const trade3Turns: TradeTurn[] = [
  { type: 'turnOffer', item: 'Camera Equipment', isUser: true  },
  { type: 'turnTrade', user: 'Mike', item: 'Photography Course', isUser: false  },
  { type: 'turnQuery', user: 'Jay', question: 'Is the Charizard in good condition?', isUser: false  },
];

// Sent offers data
const sentOfferTurns: TradeTurn[] = [
  { type: 'turnOffer', item: 'Vintage Books', isUser: true  },
  { type: 'turnOffer', item: 'Pokemon Cards', isUser: true  },
  { type: 'turnOffer', item: 'Rare Stamps', isUser: true  },
];

// Declined/Expired offers data
const declinedExpiredTurns: TradeTurn[] = [
  { type: 'turnDecline', user: 'Jay', item: 'Mountain Bike', isUser: false  },
  { type: 'turnDecline', user: 'Jay', item: 'Art Supplies', isUser: false  },
];

const activeTrades = [
  {
    id: 1,
    playercards: POSTS.slice(0, 2),
    partnercards: POSTS.slice(1, 3),
    turns: trade1Turns,
  },
  {
    id: 2,
    playercards: POSTS.slice(0, 3),
    partnercards: POSTS.slice(0, 1),
    turns: trade2Turns,
  },
  {
    id: 3,
    playercards: POSTS.slice(1, 2),
    partnercards: POSTS.slice(2, 3),
    turns: trade3Turns,
  },
];

export default function ActiveTradesTestScreen() {
  const [resetKey, setResetKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >

      
      {/* {activeTrades.map((trade) => (
        <ActiveTrade
          key={trade.id}
          playercards={trade.playercards}
          partnercards={trade.partnercards}
          turns={trade.turns}
        />
      ))} */}
      <View style={styles.middleSpacer} />
      <TradeDeck
        posts={POSTS}
     
      />

      

      {/* Sent Offers Section */}
      <OffersSection
        title="Sent OFFERS"
        turns={sentOfferTurns}
        defaultExpanded={true}
      />
      
      {/* Declined/Expired Section */}
      <OffersSection
        title="DECLINED / EXPIRED"
        turns={declinedExpiredTurns}
        defaultExpanded={false}
      />
     
      
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  contentContainer: {
    marginTop: 20,
  },
  bottomSpacer: {
    height: 500,
  },
  middleSpacer: {
    height: 670, 
  }
});
