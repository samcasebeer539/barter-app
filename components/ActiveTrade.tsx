//will contain text turn lines, two stacks of cards with plus and minus buttons, play button, action button
//header should collapse the whole section when not in play mode (pass boolean)
//put timer in header

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import PostCard from '@/components/PostCard';

import { TRADE_LINES } from '../content/tradelines';
import { TRADE_STYLES } from '../content/tradelinestyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TradeCardData {
  type: 'good' | 'service';
  name: string;
  description: string;
  photos: string[];
}

export interface TradeTurn {
  type: 'sentOffer' | 'receivedTrade' | 'sentCounteroffer' | 'receivedQuestion' | 'youAccepted' | 'theyAccepted';
  user?: string;
  item?: string;
  question?: string;
}

interface ActiveTradeProps {
  playercards: TradeCardData[];
  partnercards: TradeCardData[];
  turns: TradeTurn[];
  isPlaying: boolean;
  onPlayPress: () => void;
  onPlayCardPress: () => void;
}

const ActiveTrade: React.FC<ActiveTradeProps> = ({ playercards, partnercards, turns, isPlaying, onPlayPress, onPlayCardPress }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showInput, setShowInput] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Animated values
    const headerPosition = useRef(new Animated.Value(0)).current;
    const contentPosition = useRef(new Animated.Value(0)).current;

    const isPlayerTurn = turns.length > 0 && 
      ['receivedTrade', 'receivedQuestion', 'theyAccepted'].includes(turns[turns.length - 1].type);

    // Animate header and content when isPlaying changes
    useEffect(() => {
      if (isPlaying) {
        setIsExpanded(false); // Auto-collapse when playing
        // Slide header to top
        Animated.spring(headerPosition, {
          toValue: -50, // Move header up (adjust based on your layout)
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start();

        // Slide content so cards bottom is at screen center
        // Adjust this value based on your card heights and layout
        Animated.spring(contentPosition, {
          toValue: -(SCREEN_HEIGHT / 2 - 380), // Position cards at center
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start();
      } else {
        // Reset to original positions
        Animated.spring(headerPosition, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start();

        Animated.spring(contentPosition, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 100,
        }).start();
      }
    }, [isPlaying]);

    const handleAnswer = () => {
      setShowInput(prev => !prev);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    };

    const getArrowForTurn = (turn: TradeTurn) => {
      const sentTypes = ['sentOffer', 'sentCounteroffer', 'youAccepted'];
      return sentTypes.includes(turn.type) ? 'arrow-left-long' : 'arrow-right-long';
    };

    const renderLine = (turn: TradeTurn, index: number) => {
        const template = TRADE_LINES.activeTrades[turn.type];
        let line = template;
        if (turn.user) line = line.replace('{user}', turn.user);
        if (turn.item) line = line.replace('{item}', turn.item);
        if (turn.question) line = line.replace('{question}', turn.question);
        
        const actionMap = {
        sentOffer: { text: 'OFFER', style: TRADE_STYLES.actions.offer },
        receivedTrade: { text: 'TRADE', style: TRADE_STYLES.actions.trade },
        sentCounteroffer: { text: 'COUNTEROFFER', style: TRADE_STYLES.actions.counteroffer },
        receivedQuestion: { text: 'QUESTION', style: TRADE_STYLES.actions.question },
        youAccepted: { text: 'ACCEPTED', style: TRADE_STYLES.actions.accepted },
        theyAccepted: { text: 'ACCEPTED', style: TRADE_STYLES.actions.accepted },
        };

        const action = actionMap[turn.type];
        const parts = line.split('{action}');
        const arrowIcon = getArrowForTurn(turn);

        return (
        <>
          <View style={styles.turnRow}>
            <FontAwesome6 name={arrowIcon} size={18} color="#E0E0E0" style={styles.arrow} />
            <Text style={styles.tradeText}>
              {parts[0]}
              <Text style={action.style}>{action.text}</Text>
              {parts[1]}
              {turn.type === 'receivedQuestion' && turn.question && (
              <>
                  {'\n'}
                  <Text style={TRADE_STYLES.text.question}>       {turn.question}</Text>
              </>
              )}
            </Text>
          </View>

          {turn.type === 'receivedQuestion' && (
            <>
              <View style={styles.questionButtonContainer}>
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
                  placeholderTextColor="#888"
                />
              )}
            </>
          )}
        </>
        );
    };

    return (
    <View style={[styles.container, isPlaying && styles.containerPlaying]}>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerPosition }],
          },
        ]}
      >
        <TouchableOpacity 
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          {/* pass text up, should say like Trade with {user} */}
          <Text style={styles.headerTitle}>Trade with [user]</Text>  
          <MaterialIcons 
            name={isExpanded ? "expand-less" : "expand-more"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={[
          styles.animatedContent,
          {
            transform: [{ translateY: contentPosition }],
          },
        ]}
      >
        {/* Trade turns section - only show when expanded */}
        {isExpanded && (
          !isPlaying ? (
            <View style={styles.expandedContent}>
              <View style={styles.tradeSection}>
                {turns.map((turn, index) => (
                  <React.Fragment key={index}>
                    {renderLine(turn, index)}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.tradeSection}>
                {turns.map((turn, index) => (
                  <React.Fragment key={index}>
                    {renderLine(turn, index)}
                  </React.Fragment>
                ))}
              </View>
            </ScrollView>
          )
        )}

        {/* Cards section - always visible */}
        {/* outer container should flex row */}
        <View style={styles.cardsAndButtonsSection}>
          <View style={styles.playButtonsContainer}>
              {/* Play Button - visible in both states */}
              <TouchableOpacity 
                  style={[styles.playButton, !isPlayerTurn && styles.playButtonDisabled]}
                  onPress={onPlayPress}
                  //disabled={!isPlayerTurn || isPlaying}
              >
                  <FontAwesome6  name='arrow-right-long' size={22} color='#FFFFFF' />
                  <Text style={styles.playButtonText}>
                  {isPlayerTurn ? 'PLAY' : 'WAITING'}
                  </Text>
              </TouchableOpacity>

              {/* this goes in with cardwheel */}
              
          </View>
          <View style={styles.tradeCardsSection}>
            {/* then two flex column containers */}
            
            <View style={styles.cardsContainer}>
              <View style={styles.leftCard}>
                <PostCard 
                  post={playercards[0] || { type: 'service', name: 'Your Item', description: '', photos: [] }}
                  cardWidth={180}
                  scale={1}
                />
              </View>

              <View style={styles.rightArrowContainer}>
                    <FontAwesome6 name="arrow-right-long" size={28} color="#fff" />
              </View>
            </View>

            <View style={styles.cardsContainer}>
              <View style={styles.leftArrowContainer}>
                    <FontAwesome6 name="arrow-left-long" size={28} color="#fff" />
              </View>
              <View style={styles.rightCard}>
                <PostCard 
                  post={partnercards[0] || { type: 'good', name: 'Their Item', description: '', photos: [] }}
                  cardWidth={180}
                  scale={1}
                />
              </View> 
            </View>
            
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 0,
    backgroundColor: '#121212',
  },
  containerPlaying: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContainer: {

    backgroundColor: '#121212',
    marginTop: 10,
    marginBottom: -10,
    zIndex: 20,
    elevation: 20, // For Android
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  animatedContent: {
    backgroundColor: '#121212',
    zIndex: 10
  },
  expandedContent: {
    padding: 12,
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    padding: 12,
  },
  tradeSection: {
    gap: -4,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 0,
  },
  arrow: {
    marginTop: 4,
  },
  tradeText: {
    flex: 1,
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 22,
  },
  questionButtonContainer: {
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 24,
  },
  answerButton: {
    backgroundColor: '#a73bff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
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
  textAnswerInput: {
    color: '#fff',
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#1f1f1f',
  },
  cardsAndButtonsSection: {
    flexDirection: 'column',
    marginTop: 4,
    gap: 4,
  },
  tradeCardsSection: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
 leftArrowContainer: {
    right: 70,
  },
  rightArrowContainer: {
    left: 70,
  },
  cardsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  leftCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: "100%",
    gap: 12,
  },

  playButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#e99700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
 
  playButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});


export default ActiveTrade;