// ... (keeping all imports and interfaces the same until the render section)

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
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';


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
    
    // Card navigation state
    const [playerCardIndex, setPlayerCardIndex] = useState(0);
    const [partnerCardIndex, setPartnerCardIndex] = useState(0);

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
          toValue: -(SCREEN_HEIGHT / 17), // Position cards at center
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
      return sentTypes.includes(turn.type) ? 'arrow-right-long' : 'arrow-left-long';
    };

    // Card navigation handlers
    const handlePlayerCardLeft = () => {
      if (playerCardIndex > 0) {
        setPlayerCardIndex(playerCardIndex - 1);
      }
    };

    const handlePlayerCardRight = () => {
      if (playerCardIndex < playercards.length - 1) {
        setPlayerCardIndex(playerCardIndex + 1);
      }
    };

    const handlePartnerCardLeft = () => {
      if (partnerCardIndex > 0) {
        setPartnerCardIndex(partnerCardIndex - 1);
      }
    };

    const handlePartnerCardRight = () => {
      if (partnerCardIndex < partnercards.length - 1) {
        setPartnerCardIndex(partnerCardIndex + 1);
      }
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
                  <Text style={styles.playButtonText}>ANSWER</Text>
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

    // Determine play button appearance
    const getPlayButtonContent = () => {
      if (isPlaying) {
        // Currently playing - show back button
        return {
          icon: 'arrow-left-long',
          text: 'BACK',
          disabled: false,
        };
      } else if (isPlayerTurn) {
        // Your turn but not playing - show right arrow
        return {
          icon: 'arrow-right-long',
          text: 'PLAY',
          disabled: false,
        };
      } else {
        // Not your turn - show left arrow
        return {
          icon: 'arrow-left-long',
          text: 'WAIT',
          disabled: true,
        };
      }
    };

    const playButtonContent = getPlayButtonContent();

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
          <Text style={styles.headerTitle}>TRADE with [user]</Text>  
          <FontAwesome6 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={22} 
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
            <View style={styles.expandedContent}>
              <View style={styles.tradeSection}>
                {turns.map((turn, index) => (
                  <React.Fragment key={index}>
                    {renderLine(turn, index)}
                  </React.Fragment>
                ))}
              </View>
            </View>
          )
        )}

        {/* Cards section - always visible */}
        {/* outer container should flex row */}
        <View style={styles.cardsAndButtonsSection}>
          
          <View style={styles.tradeCardsSection}>
            {/* then two flex column containers */}
            
            <View style={styles.cardsContainer}>
              <View style={styles.leftCard}>
                <PostCard 
                  post={playercards[playerCardIndex] || { type: 'service', name: 'Your Item', description: '', photos: [] }}
                  cardWidth={180}
                  scale={1}
                />
              </View>

              <View style={styles.buttonRowContainer}>
                    {/* <FontAwesome6 name="arrow-right-long" size={28} color="#fff" /> */}
                    <TouchableOpacity 
                        style={[
                          styles.playButton, 
                          playButtonContent.disabled && styles.playButtonDisabled
                        ]}
                        onPress={onPlayPress}
                        disabled={playButtonContent.disabled}
                    >
                        <FontAwesome6 name={playButtonContent.icon} size={22} color='#FFFFFF' />
                        <Text style={styles.playButtonText}>
                          {playButtonContent.text}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.leftRightButton}>
                      <TouchableOpacity 
                        onPress={handlePlayerCardLeft}
                        disabled={playerCardIndex === 0}
                        style={styles.caretButton}
                      >
                        <FontAwesome6 
                          name="caret-left" 
                          size={30} 
                          color={playerCardIndex === 0 ? '#7f7997' : '#fff'} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.playButtonText}>{playerCardIndex + 1}/{playercards.length}</Text>
                      <TouchableOpacity 
                        onPress={handlePlayerCardRight}
                        disabled={playerCardIndex === playercards.length - 1}
                        style={styles.caretButton}
                      >
                        <FontAwesome6 
                          name="caret-right" 
                          size={30} 
                          color={playerCardIndex === playercards.length - 1 ? '#7f7997' : '#fff'} 
                        />
                      </TouchableOpacity>
                    </View>
              </View>
            </View>

            <View style={styles.cardsContainer}>
              <View style={styles.buttonRowContainer}>
                    
                  
                    <View style={styles.leftRightButton}>
                      <TouchableOpacity 
                        onPress={handlePartnerCardLeft}
                        disabled={partnerCardIndex === 0}
                        style={styles.caretButton}
                      >
                        <FontAwesome6 
                          name="caret-left" 
                          size={30} 
                          color={partnerCardIndex === 0 ? '#7f7997' : '#fff'} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.playButtonText}>{partnerCardIndex + 1}/{partnercards.length}</Text>
                      <TouchableOpacity 
                        onPress={handlePartnerCardRight}
                        disabled={partnerCardIndex === partnercards.length - 1}
                        style={styles.caretButton}
                      >
                        <FontAwesome6 
                          name="caret-right" 
                          size={30} 
                          color={partnerCardIndex === partnercards.length - 1 ? '#7f7997' : '#fff'} 
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timeButton}>
                      
                      <Text style={styles.playButtonText}>11:49</Text>
                      
                    </View>
                    
              </View>
              <View style={styles.rightCard}>
                <PostCard 
                  post={partnercards[partnerCardIndex] || { type: 'good', name: 'Their Item', description: '', photos: [] }}
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
    marginTop: 16,
    marginBottom: -8,
    backgroundColor: colors.ui.background,
    paddingHorizontal: 12,
  },
  containerPlaying: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContainer: {
    justifyContent: 'center',
    backgroundColor: colors.ui.secondary,
    
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 4,
    marginTop: 12,
    marginBottom: -4,
    zIndex: 20,
    elevation: 20, // For Android
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: globalFonts.bold
  },
  animatedContent: {
    backgroundColor: colors.ui.background,
    zIndex: 10
  },
  expandedContent: {
    padding: 12,
    marginTop: -6,
    marginBottom: -12
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
    ...defaultTextStyle
  },
  questionButtonContainer: {
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 24,
  },
  answerButton: {
    backgroundColor: colors.actions.query,
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
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: colors.ui.background,
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
    gap: 4,
  },
 buttonRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    width: 180,
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

  playButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.actions.offer,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
 
  playButtonDisabled: {
    backgroundColor: '#5c5579',
    
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: globalFonts.bold
  },
  leftRightButton: {
    flex: 1,
    gap: 8,
    borderRadius: 4,
    minHeight: 40,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: '#5c5579',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caretButton: {
    padding: 0,
  },
  timeButton: {
    flex: 1,
    gap: 8,
    borderRadius: 4,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

});


export default ActiveTrade;
