import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useCallback, useState } from 'react';
import ActiveTrade, { TradeTurn } from '../components/ActiveTrade';
import { useFocusEffect } from '@react-navigation/native';
import CardWheel from '../components/CardWheel';
import { BARTER_CARDS } from '../components/BarterCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';


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

const trade1Turns: TradeTurn[] = [
  { type: 'sentOffer', item: 'Vintage Books' },
  { type: 'receivedTrade', user: 'Jay', item: 'Pokemon Cards' },
  { type: 'sentCounteroffer' },
  { type: 'receivedTrade', user: 'Jay', item: 'Pokemon Cards' },
];

const trade2Turns: TradeTurn[] = [
  { type: 'sentOffer', item: 'Guitar Lessons' },
  { type: 'receivedTrade', user: 'Sarah', item: 'Bike Repair' },
  { type: 'youAccepted' },
];

const trade3Turns: TradeTurn[] = [
  { type: 'sentOffer', item: 'Camera Equipment' },
  { type: 'receivedTrade', user: 'Mike', item: 'Photography Course' },
  { type: 'receivedQuestion', user: 'Jay', question: 'Is the Charizard in good condition?' },
];

const activeTrades = [
  {
    id: 1,
    playercards: POSTS.slice(0, 1),
    partnercards: POSTS.slice(1, 2),
    turns: trade1Turns,
  },
  {
    id: 2,
    playercards: POSTS.slice(2, 3),
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
  const [playingTradeId, setPlayingTradeId] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const screenWidth = Dimensions.get('window').width;

    const wheelRotate = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (playingTradeId !== null) {
            
            wheelRotate.setValue(1);
            
            
            Animated.spring(wheelRotate, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 130,
            }).start();
        }
    }, [playingTradeId]);


   // Reset CardWheel whenever this screen comes into focus
    useFocusEffect(
      useCallback(() => {
        setResetKey(prev => prev + 1);
      }, [])
    );

  return (
    <View style={styles.container}>
      {playingTradeId === null ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {activeTrades.map((trade) => (
            <ActiveTrade 
              key={trade.id}
              playercards={trade.playercards} 
              partnercards={trade.partnercards} 
              turns={trade.turns} 
              isPlaying={false}
              onPlayPress={() => setPlayingTradeId(trade.id)}
              onPlayCardPress={() => setPlayingTradeId(trade.id)}

            />
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
            
            <View style={{ flex: 1 }}>
                <ActiveTrade 
                    playercards={activeTrades.find(t => t.id === playingTradeId)!.playercards} 
                    partnercards={activeTrades.find(t => t.id === playingTradeId)!.partnercards} 
                    turns={activeTrades.find(t => t.id === playingTradeId)!.turns} 
                    isPlaying={true}
                    onPlayPress={() => setPlayingTradeId(null)}
                    onPlayCardPress={() => setPlayingTradeId(null)}
                />
            </View>
            
            {/* Card Wheel */}
            <View style={styles.cardWheelContainer}>
                <Animated.View
                    style={{
                        transform: [
                            
                            {
                            rotate: wheelRotate.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '30deg'],
                            }),
                            },
                        ],
                    }}
                >
                    <CardWheel cards={BARTER_CARDS} resetKey={resetKey} />
                </Animated.View>
            </View>

            <LinearGradient
                colors={['rgba(12, 12, 12, 0)', 'rgba(12, 12, 12, 0.9)', '#121212']}
                locations={[0, 0.5, 1]}
                style={styles.cardWheelGradient}
                pointerEvents="none"
            />

        </View>
      )}

      
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollView: {
        flex: 1,
        
    },
    contentContainer: {
        marginTop: 20,
        marginBottom: 50,
        
    },
    cardWheelContainer: {
        position: 'absolute',
        alignItems: 'center',
        top: 660,
        right: 0,
        left: 0,
        zIndex: 20
    },
    

    cardWheelGradient: {

        height: 400,
        zIndex: 15
    },

    bottomSpacer: {
        height: 100,
    },
});
