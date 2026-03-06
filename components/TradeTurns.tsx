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
  isQueryOpen?: boolean;
}

const TradeTurns: React.FC<TradeTurnsProps> = ({ turns, isQueryOpen = false, }) => {
  const [queryAnswers, setQueryAnswers] = React.useState<Record<number, string>>({});
  const [activeQueryText, setActiveQueryText] = React.useState('');
  const internalInputRefs = useRef<Record<number, TextInput | null>>({});
  const activeQueryInputRef = useRef<TextInput | null>(null);

  // Auto-focus the top query input when it opens
  React.useEffect(() => {
    if (isQueryOpen) {
      setTimeout(() => activeQueryInputRef.current?.focus(), 100);
    } else {
      setActiveQueryText('');
    }
  }, [isQueryOpen]);

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

        {isQuery && !turn.isUser && (
          <View style={styles.answerRowUser}>
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
              <FontAwesome6 name="arrow-left-long" size={26} color={colors.actions.query} />
            </TouchableOpacity>
          </View>
        )}

        {isQuery && turn.isUser && (
          <View style={styles.answerRowPartner}>
            <TextInput
              ref={el => { internalInputRefs.current[index] = el; }}
              style={styles.answerInput}
              placeholder="..."
              placeholderTextColor={colors.actions.query}
              value={answerValue}
              onChangeText={text => setQueryAnswers(prev => ({ ...prev, [index]: text }))}
              multiline
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit
            />
     
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isQueryOpen && (
        <View style={styles.activeQueryRow}>
          <TextInput
            ref={activeQueryInputRef}
            style={styles.answerInput}
            placeholder="Ask a question…"
            placeholderTextColor={colors.actions.query}
            value={activeQueryText}
            onChangeText={setActiveQueryText}
            multiline
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            blurOnSubmit
          />
          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <FontAwesome6 name="check" size={26} color={colors.actions.query} />
          </TouchableOpacity>
        </View>
      )}
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
    minHeight: 32,
  },
  rowPartner: {
    ...rowBase,
    justifyContent: 'center',
    borderTopLeftRadius: 25,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 32,
  },
  activeQueryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 3,
    borderColor: colors.actions.query,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 25,
    paddingHorizontal: 10,
    paddingBottom: 2,
  },
  answerRowUser: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 3,
    borderColor: colors.actions.query,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 25,
    borderTopRightRadius: 2,
    paddingHorizontal: 10,
    paddingBottom: 2,
  },
  answerRowPartner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 3,
    borderColor: colors.actions.query,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
    paddingHorizontal: 10,
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