import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import PostCard from '@/components/PostCard';
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';
import TradeUI from '../components/TradeUI';

import { TRADE_LINES } from '../content/tradelines';
import { TRADE_STYLES } from '../content/tradelinestyles';

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
}

const ActiveTrade: React.FC<ActiveTradeProps> = ({ playercards, partnercards, turns }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showInput, setShowInput] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const inputRef = useRef<TextInput>(null);
    
    const [playerCardIndex, setPlayerCardIndex] = useState(0);
    const [partnerCardIndex, setPartnerCardIndex] = useState(0);

    const isPlayerTurn = turns.length > 0 && 
      ['receivedTrade', 'receivedQuestion', 'theyAccepted'].includes(turns[turns.length - 1].type);

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

    const getPlayButtonContent = () => {
      if (isPlaying) {
        return { icon: 'arrow-left-long', text: 'BACK', disabled: false };
      } else if (isPlayerTurn) {
        return { icon: 'arrow-right-long', text: 'PLAY', disabled: false };
      } else {
        return { icon: 'arrow-left-long', text: 'WAIT', disabled: true };
      }
    };

    const playButtonContent = getPlayButtonContent();

    return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Trade turns - only show when expanded */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.tradeSection}>
            {turns.map((turn, index) => (
              <React.Fragment key={index}>
                {renderLine(turn, index)}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Cards + buttons */}
      <View style={styles.tradeCardsSection}>
        {/* Player side */}
        <View style={styles.cardsContainer}>
          <PostCard 
            post={playercards[playerCardIndex] || { type: 'service', name: 'Your Item', description: '', photos: [] }}
            cardWidth={180}
            scale={1}
          />
          <View style={styles.buttonRowContainer}>
            <TouchableOpacity 
              style={[
                styles.playButton, 
                playButtonContent.disabled && styles.playButtonDisabled,
                isPlaying && styles.playButtonBack
              ]}
              onPress={() => setIsPlaying(!isPlaying)}
              disabled={playButtonContent.disabled}
            >
              <FontAwesome6 name={playButtonContent.icon} size={22} color='#FFFFFF' />
              <Text style={styles.playButtonText}>{playButtonContent.text}</Text>
            </TouchableOpacity>

            <View style={styles.leftRightButton}>
              <TouchableOpacity 
                onPress={() => setPlayerCardIndex(i => i - 1)}
                disabled={playerCardIndex === 0}
              >
                <FontAwesome6 name="caret-left" size={30} color={playerCardIndex === 0 ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.playButtonText}>{playerCardIndex + 1}/{playercards.length}</Text>
              <TouchableOpacity 
                onPress={() => setPlayerCardIndex(i => i + 1)}
                disabled={playerCardIndex === playercards.length - 1}
              >
                <FontAwesome6 name="caret-right" size={30} color={playerCardIndex === playercards.length - 1 ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Partner side */}
        <View style={styles.cardsContainer}>
          <View style={styles.buttonRowContainer}>
            <View style={styles.leftRightButton}>
              <TouchableOpacity 
                onPress={() => setPartnerCardIndex(i => i - 1)}
                disabled={partnerCardIndex === 0}
              >
                <FontAwesome6 name="caret-left" size={30} color={partnerCardIndex === 0 ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.playButtonText}>{partnerCardIndex + 1}/{partnercards.length}</Text>
              <TouchableOpacity 
                onPress={() => setPartnerCardIndex(i => i + 1)}
                disabled={partnerCardIndex === partnercards.length - 1}
              >
                <FontAwesome6 name="caret-right" size={30} color={partnerCardIndex === partnercards.length - 1 ? colors.ui.secondarydisabled : '#fff'} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeButton}>
              <Text style={styles.playButtonText}>11:49</Text>
            </View>
          </View>

          <PostCard 
            post={partnercards[partnerCardIndex] || { type: 'good', name: 'Their Item', description: '', photos: [] }}
            cardWidth={180}
            scale={1}
          />
        </View>
      </View>

      {/* TradeUI — just in the flow, toggled by play */}
      {isPlaying && <TradeUI />}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.ui.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 2,
    marginTop: 12,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: globalFonts.bold
  },
  expandedContent: {
    padding: 12,
    marginTop: -8,
    marginBottom: -12
  },
  tradeSection: {
    gap: -4,
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
  tradeCardsSection: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  buttonRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    width: 180,
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
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 2,
  },
  playButtonDisabled: {
    backgroundColor: colors.ui.secondary,
  },
  playButtonBack: {
    backgroundColor: colors.ui.secondary,
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
    borderRadius: 2,
    minHeight: 40,
    paddingVertical: 2,
    paddingHorizontal: 10,
    backgroundColor: colors.ui.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeButton: {
    flex: 1,
    gap: 8,
    borderRadius: 2,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.ui.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveTrade;