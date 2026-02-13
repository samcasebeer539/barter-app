import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { defaultTextStyle, globalFonts } from '../styles/globalStyles';
import { TradeTurnType, getTurnConfig } from '../config/tradeConfig';

// Export the TradeTurn interface so other components can import it from here
export interface TradeTurn {
  type: TradeTurnType;
  user?: string;
  item?: string;
  question?: string;
}

// Re-export TradeTurnType for convenience
export type { TradeTurnType };

interface TradeTurnsProps {
  turns: TradeTurn[];
  showAnswerInput?: boolean;
  answerText?: string;
  onAnswerTextChange?: (text: string) => void;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

const TradeTurns: React.FC<TradeTurnsProps> = ({
  turns,
  showAnswerInput = false,
  answerText = '',
  onAnswerTextChange,
  onSubmitEditing,
  inputRef,
}) => {
  const renderLine = (turn: TradeTurn, index: number) => {
    const config = getTurnConfig(turn.type);
    console.log('Turn:', turn.type, 'Config:', config);
    if (!config) return null;
    
    let line = config.template;
    if (turn.user) line = line.replace('{user}', turn.user);
    if (turn.item) line = line.replace('{item}', turn.item);
    if (turn.question) line = line.replace('{question}', turn.question);
    
    const parts = line.split('{action}');
    const arrowIcon = config.isSent ? 'arrow-right-long' : 'arrow-left-long';

    return (
      <View style={[styles.turnRow, styles.wireframe]} key={index}>
        <FontAwesome6 name={arrowIcon} size={18} color="#E0E0E0" style={styles.arrow} />
        <Text style={styles.tradeText}>
          {parts[0]}
          <Text style={config.colorStyle}>{config.actionText}</Text>
          {parts[1]}
          {turn.type === 'receivedQuestion' && turn.question && (
            <>
              {'\n'}
              <Text style={{ color: '#ffffff', fontFamily: globalFonts.regular }}>       {turn.question}</Text>
            </>
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.tradeSection, styles.wireframe]}>
      {turns.map((turn, index) => (
        <React.Fragment key={index}>
          {renderLine(turn, index)}
        </React.Fragment>
      ))}
      
      {/* Show answer input line when answering */}
      {showAnswerInput && (
        <View style={[styles.turnRow, styles.wireframe]}>
          <FontAwesome6 name="arrow-right-long" size={18} color="#E0E0E0" style={styles.arrow} />
          <TextInput
            ref={inputRef}
            style={styles.answerTextInput}
            placeholder="A: Type your answer here..."
            placeholderTextColor="#888"
            value={answerText}
            onChangeText={onAnswerTextChange}
            multiline
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: '#ffffff',
    lineHeight: 22,
    ...defaultTextStyle
  },
  answerTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    ...defaultTextStyle,
    minHeight: 24,
  },
  wireframe: {
    borderWidth: 2,
    borderColor: '#FF0000',
    borderStyle: 'solid',
  },
});

export default TradeTurns;