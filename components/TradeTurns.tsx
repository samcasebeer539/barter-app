import React, { useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native';
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
}

const TradeTurns: React.FC<TradeTurnsProps> = ({ turns }) => {
  const [queryAnswers, setQueryAnswers] = React.useState<Record<number, string>>({});
  const internalInputRefs = useRef<Record<number, TextInput | null>>({});

  const renderTurn = (turn: TradeTurn, index: number) => {
    const config = getTurnConfig(turn.type);
    if (!config) return null;

    let line = (turn.isUser ? config.templateUser : config.templatePartner)
      .replace('{user}', turn.user ?? '{user}')
      .replace('{item}', turn.item ?? '{item}')
      .replace('{question}', turn.question ?? '{question}');

    const parts = line.split('{action}');
    const hasAction = parts.length > 1;
    const isQuery = turn.type === 'turnQuery';
    const answerValue = queryAnswers[index] ?? '';

    return (
      <View key={index} style={styles.turnWrapper}>
        <View
          style={[
            turn.isUser ? styles.rowUser : styles.rowPartner,
            {
              backgroundColor: config.colorStyle.color,
              borderColor: config.colorStyle.color,
              shadowColor: config.colorStyle.color,
            },
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
            {isQuery && turn.question && (
              <>{'\n'}<Text style={styles.questionText}>       {turn.question}</Text></>
            )}
          </Text>
        </View>

        {isQuery && (
          <View style={styles.answerRow}>
            <TextInput
              ref={el => { internalInputRefs.current[index] = el; }}
              style={styles.answerInput}
              placeholder="Answer"
              placeholderTextColor={colors.actions.query}
              value={answerValue}
              onChangeText={text => setQueryAnswers(prev => ({ ...prev, [index]: text }))}
              multiline
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit
            />
            <TouchableOpacity onPress={() => Keyboard.dismiss()}>
              <FontAwesome6 name="arrow-right-to-bracket" size={26} color={colors.actions.query} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {turns.map(renderTurn)}
    </View>
  );
};

const rowBase: object = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 6,
  width: '100%',
  paddingHorizontal: 10,
  paddingBottom: 10,
  minHeight: 30,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 4,
  },
  turnWrapper: {
    width: '100%',
    flexDirection: 'column',
    gap: 4,
  },
  rowUser: {
    ...rowBase,
    borderTopLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 25,
  },
  rowPartner: {
    ...rowBase,
    justifyContent: 'center',
    borderTopLeftRadius: 25,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 3,
    borderColor: colors.actions.query,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 25,
    borderTopRightRadius: 2,
    paddingHorizontal: 12,
    paddingBottom: 2,
  },
  answerInput: {
    flex: 1,
    fontSize: 16,
    bottom: 3,
    color: colors.actions.query,
    lineHeight: 20,
    fontFamily: globalFonts.bold,
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
});

export default TradeTurns;