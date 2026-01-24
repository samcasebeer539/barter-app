// combine feed and barter pages?
//yeah this makes sense. pull the cards out from under the active trade 

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useRef } from 'react';
import CardWheel from '../components/CardWheel';
import ProfilePicture from '@/components/ProfilePicture';
import PostCard from '@/components/PostCard';




export default function BarterScreen() {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const [activeTradesExpanded, setActiveTradesExpanded] = useState(true);
  const [outgoingOffersExpanded, setOutgoingOffersExpanded] = useState(true);
  const [declinedExpiredExpanded, setDeclinedExpiredExpanded] = useState(false);

  // Reset CardWheel whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setResetKey(prev => prev + 1);
    }, [])
  );

  const handleBackPress = () => {
    router.push('/trades');
  };

    
  
  const inputRef = useRef<TextInput>(null);
    
  const [showInput, setShowInput] = useState(false);
  
  const handlePlay = () => {
    router.push('/barter');
    console.log('Play button pressed');
    // Add your offer logic here
  };

  const handleAnswer = () => {
    console.log('Answer button pressed');
    // Add your offer logic here
    setShowInput(prev => !prev);
    setTimeout(() => {
    inputRef.current?.focus();
  }, 0);}

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
    <ScrollView style={styles.container}>
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
      {/* <View style={styles.header}>
        <ProfilePicture size={50} avatarText="👤" />
        <Text style={styles.name}>Jay Wilson</Text>
      </View> */}

      <View style={styles.activeTradeaSection}>
        <TouchableOpacity 
          style={styles.tradeSectionHeader}
          onPress={() => setActiveTradesExpanded(!activeTradesExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.tradeSectionTitle}>Active Trades</Text>
          <MaterialIcons 
            name={activeTradesExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {activeTradesExpanded && (
          <>
  

            {/* 2nd Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                You sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books"{'\n'}
                Jay proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards"{'\n'}
                You proposed <Text style={styles.highlightPink}>COUNTEROFFER</Text>{'\n'}
                Jay asked <Text style={styles.highlightPurple}>QUESTION</Text>{'\n'}
                <Text style={styles.questionText}>       Is the Charizard in good condition?</Text>{'\n'}

              
              </Text>
              <View style={styles.questionButtonContainer} pointerEvents="auto">
                <TouchableOpacity 
                  style={styles.answerButton}
                  onPress={handleAnswer}
                >
                  <Text style={styles.buttonText}>ANSWER</Text>
                </TouchableOpacity>
              </View>
              {showInput && (
                <TextInput
                  ref={inputRef}
                  style={styles.textAnswerInput}
                  placeholder="Answer question to begin your turn!"
                  placeholderTextColor="#ffffff"
                />
              )}

              <View style={styles.playButtonContainer} pointerEvents="auto">
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={handlePlay}
                >
                  <Text style={styles.buttonText}>YOUR TURN</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3st Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                You sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books" {'\n'}
              
                Jay proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards" {'\n'}
        
                You <Text style={styles.highlightGreen}>ACCEPTED</Text> {'\n'}
            
                Jay <Text style={styles.highlightGreen}>ACCEPTED</Text> {'\n'}
              </Text>
              <View style={styles.playButtonContainer} pointerEvents="auto">
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={handlePlay}
                >
                  <Text style={styles.buttonText}>YOUR TURN</Text>
                </TouchableOpacity>
              </View>
              
            </View>

          </>
        )}
        {/* Card area */}
        <View style={styles.mainContent}>
          <View style={styles.leftArrowContainer}>
            <FontAwesome6 name="arrow-left-long" size={28} color="#fff" />
          </View>
          <View style={styles.rightArrowContainer}>
            <FontAwesome6 name="arrow-right-long" size={28} color="#fff" />
          </View>
          <View style={styles.cardsContainer}>
            {/* Left card - larger and higher */}
            
            <View style={styles.leftCard}>
              <PostCard 
                post={leftPost}
                cardWidth={180}
                scale={1}
              />
            </View>
            
            {/* Right card - smaller and lower */}
            <View style={styles.rightCard}>
              <PostCard 
                post={rightPost}
                cardWidth={180}
                scale={1}
              />
            </View>
          </View>
        </View>
      
      </View>
          
      

      

      {/* Card Wheel at bottom */}
      <View style={styles.cardWheelContainer}>
        <CardWheel cards={sampleCards} resetKey={resetKey} />
      </View>


      {/* Outgoing Offers Section */}
      <View style={styles.offersAndDeclinedSection}>
        <TouchableOpacity 
          style={styles.tradeSectionHeader}
          onPress={() => setOutgoingOffersExpanded(!outgoingOffersExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.tradeSectionTitle}>Outgoing Offers</Text>
          <MaterialIcons 
            name={outgoingOffersExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {outgoingOffersExpanded && (
          <>
            {/* Outgoing Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>
          </>
        )}
      
        <TouchableOpacity 
          style={styles.tradeSectionHeader}
          onPress={() => setDeclinedExpiredExpanded(!declinedExpiredExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.tradeSectionTitle}>Declined/Expired Offers</Text>
          <MaterialIcons 
            name={declinedExpiredExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {declinedExpiredExpanded && (
          <>
            {/* Declined Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                Jay <Text style={styles.highlightRed}>DECLINED</Text> your <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Expired Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                Your <Text style={styles.highlightBlue}>OFFER</Text> on "item" expired
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },

  //get rid of
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },

  //get rid of
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginLeft: 52,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
    marginTop: 26,
  },
  mainContent: {
    //trades goes in here
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  activeTradeaSection: {
    marginBottom: 30,
  },
  offersAndDeclinedSection: {
    marginBottom: 30,
  },
  tradeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  tradeSection: {
    gap: 4,
    marginBottom: 20,
  },
  activeTradesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 400,
  },
  
  
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 400,
  },
  
  


  leftCard: {
   
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 34,
    right: 0
  },
  rightCard: {

    justifyContent: 'center',
    alignItems: 'center',
    right: 0
  
  },
  leftArrowContainer: {

    justifyContent: 'center',
    alignItems: 'center',
    top: 56,
    left: 20
  
  },
  rightArrowContainer: {
    
    justifyContent: 'center',
    alignItems: 'center',
    
    top: 280,
    right: 20
  
  },
  cardWheelContainer: {
    position: 'absolute',
    bottom: -720,
    left: 0,
    right: 0,
    paddingBottom: 0,
  },
  tradeText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },
  yourTurnText: {
    fontSize: 16,
    color: '#e99700',
    fontWeight: '600',
    lineHeight: 24,
  },
  heavyChar: {
    fontWeight: '900',
    fontSize: 16,
  },
  arrow: {
    fontSize: 40,
    lineHeight: 10,
  },
  playButtonContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginTop: -20,
    marginLeft: 36,
  },
  questionButtonContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginTop: -20,
    marginLeft: 48,
  },
  playButton: {
    backgroundColor: '#e99700',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  answerButton: {
    backgroundColor: '#a73bff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  highlightBlue: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  highlightYellow: {
    color: '#FFA600',
    fontWeight: '600',
  },
  highlightPink: {
    color: '#FF3B81',
    fontWeight: '600',
  },
  highlightPurple: {
    color: '#a73bff',
    fontWeight: '600',
  },
  highlightRed: {
    color: '#ff3b3b',
    fontWeight: '600',
  },
  highlightGreen: {
    color: '#00eb00',
    fontWeight: '600',
  },
  questionText: {
    color: '#ffffff',
    
  },
  answerText: {
    color: '#a73bff',
    
  },

  textAnswerInput: {
    color: '#fff',
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
  }


});
