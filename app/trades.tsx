import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef } from 'react';


export default function TradesScreen() {
  const router = useRouter();
  const [activeTradesExpanded, setActiveTradesExpanded] = useState(true);
  const [outgoingOffersExpanded, setOutgoingOffersExpanded] = useState(true);
  const [declinedExpiredExpanded, setDeclinedExpiredExpanded] = useState(false);

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
  }, 0);

  };

  

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Active Trades Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setActiveTradesExpanded(!activeTradesExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Active Trades</Text>
          <MaterialIcons 
            name={activeTradesExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        {activeTradesExpanded && (
          <>
            {/* 1st Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> Jay sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> You proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay proposed <Text style={styles.highlightPink}>COUNTEROFFER</Text>
              </Text>
              <Text style={styles.yourTurnText}>
                  <Text style={styles.heavyChar}>└─</Text>
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

            {/* 2nd Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> You proposed <Text style={styles.highlightPink}>COUNTEROFFER</Text>
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay asked <Text style={styles.highlightPurple}>QUESTION</Text>
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>    ├─</Text> <Text style={styles.questionText}>Is the Charizard in good condition?</Text>
              </Text>
              <Text style={styles.answerText}>
                  <Text style={styles.heavyChar}>    └─</Text>
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
                  placeholder="Type your offer..."
                />
              )}
            </View>

            {/* 3st Active Trade */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "Vintage Books"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay proposed <Text style={styles.highlightYellow}>TRADE</Text> for "Pokemon Cards"
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> You <Text style={styles.highlightGreen}>ACCEPTED</Text>
              </Text>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>├─</Text> Jay <Text style={styles.highlightGreen}>ACCEPTED</Text>
              </Text>
              <Text style={styles.yourTurnText}>
                  <Text style={styles.heavyChar}>└─</Text>
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
      </View>

      {/* Outgoing Offers Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setOutgoingOffersExpanded(!outgoingOffersExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Outgoing Offers</Text>
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
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Outgoing Offer 2 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Outgoing Offer 3 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>┬─</Text> You sent <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Declined/Expired Offers Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setDeclinedExpiredExpanded(!declinedExpiredExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Declined/Expired Offers</Text>
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
                <Text style={styles.heavyChar}>─</Text> Jay <Text style={styles.highlightRed}>DECLINED</Text> your <Text style={styles.highlightBlue}>OFFER</Text> on "item"
              </Text>
            </View>

            {/* Expired Offer 1 */}
            <View style={styles.tradeSection}>
              <Text style={styles.tradeText}>
                <Text style={styles.heavyChar}>─</Text> Your <Text style={styles.highlightBlue}>OFFER</Text> on "item" expired
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
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  tradeSection: {
    gap: 4,
    marginBottom: 20,
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
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
  }
});
