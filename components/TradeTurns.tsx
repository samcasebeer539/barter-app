import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors, defaultTextStyle, globalFonts } from '../styles/globalStyles';
import { TradeTurnType, getTurnConfig } from '../config/tradeConfig';

export interface TradeTurn {
  type: TradeTurnType;
  user?: string;
  item?: string;
  question?: string;
  isUser?: boolean;
}

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
  const renderTurn = (turn: TradeTurn, index: number) => {
    const config = getTurnConfig(turn.type);
    if (!config) return null;

    let line = (turn.isUser ? config.templateUser : config.templatePartner)
      .replace('{user}', turn.user ?? '{user}')
      .replace('{item}', turn.item ?? '{item}')
      .replace('{question}', turn.question ?? '{question}');

    const parts = line.split('{action}');
    const hasAction = parts.length > 1;

    return (
      <View
        key={index}
        style={[
          turn.isUser ? styles.rowUser : styles.rowPartner,
          { backgroundColor: config.colorStyle.color, borderColor: config.colorStyle.color, shadowColor: config.colorStyle.color },
        ]}
      >
        <Text style={styles.text}>
          {hasAction ? (
            <>
              {parts[0]}
              <Text style={config.colorStyle}>{config.actionText}</Text>
              {parts[1]}
            </>
          ) : line}
          {turn.type === 'turnQuery' && turn.question && (
            <>{'\n'}<Text style={styles.questionText}>       {turn.question}</Text></>
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {turns.map(renderTurn)}

      {showAnswerInput && (
        <View style={styles.rowUser}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your answer..."
            placeholderTextColor="#888"
            value={answerText}
            onChangeText={onAnswerTextChange}
            multiline
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit
          />
          <FontAwesome6 name="arrow-left-long" size={18} color="#000" style={styles.arrow} />
        </View>
      )}
    </View>
  );
};

const rowBase: object = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 6,
  width: '100%',
  paddingHorizontal: 10,
  minHeight: 30,
  marginTop: 4,
};

const styles = StyleSheet.create({
  container: {
    gap: -4,
    width: '100%',
  },
  rowUser: {
    ...rowBase,
    borderTopLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  rowPartner: {
    ...rowBase,
    justifyContent: 'center',
    borderTopLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  text: {
    flex: 1,
    fontSize: 16,
    top: 5,
    fontFamily: globalFonts.bold,
  },
  questionText: {
    color: '#ffffff',
    fontFamily: globalFonts.extrabold,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    minHeight: 24,
    ...defaultTextStyle,
  },
  arrow: {},
});

export default TradeTurns;