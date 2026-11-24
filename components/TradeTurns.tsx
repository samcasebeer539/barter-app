import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard } from 'react-native';
import { colors, globalFonts } from '../styles/globalStyles';
import { TradeTurnType, getTurnConfig } from '../config/tradeConfig';
import { useKeyboardLiftField } from '@/hooks/useKeyboardLift';

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
  /** Fires on every keystroke in the active "ask a question" input while isQueryOpen is true */
  onQueryTextChange?: (text: string) => void;
  /** Placeholder for that input, e.g. "Answer to begin your turn" when answering. */
  queryPlaceholder?: string;
  /** Color of that input's border and text (defaults to the query color). */
  queryColor?: string;
}

const TradeTurns: React.FC<TradeTurnsProps> = ({
  turns,
  isQueryOpen = false,
  onQueryTextChange,
  queryPlaceholder = 'Ask a question…',
  queryColor = colors.actions.query,
}) => {
  const [activeQueryText, setActiveQueryText] = useState('');
  const activeQueryInputRef = useRef<TextInput | null>(null);

  // Auto-focus the top query input when it opens
  useEffect(() => {
    if (isQueryOpen) {
      setTimeout(() => activeQueryInputRef.current?.focus(), 100);
    } else {
      setActiveQueryText('');
      setDoneKey(false);
    }
  }, [isQueryOpen]);

  // Keeps the box above the keyboard while you type.
  const kbField = useKeyboardLiftField();

  // These fields focus themselves as they appear, and iOS then shows a plain
  // "return" key. Switching the key to "done" once focused makes iOS redraw
  // the keyboard with the check mark, like the fields you tap into.
  const [doneKey, setDoneKey] = useState(false);

  const handleActiveQueryChange = (text: string) => {
    setActiveQueryText(text);
    onQueryTextChange?.(text);
    kbField.requestLift();
  };

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
    // Answers sit under their question as an outlined box rather than a
    // filled row: bottom-right corner rounded for your own answer,
    // bottom-left for the other player's.
    const isAnswer = turn.type === 'turnAnswer';

    return (
      <View key={index} style={styles.turnWrapper}>
        <View
          style={[
            isAnswer
              ? (turn.isUser ? styles.answerBoxUser : styles.answerBoxPartner)
              : turn.isUser ? styles.rowUser : styles.rowPartner,
            isAnswer
              ? { borderColor: config.colorStyle.color }
              : {
                  backgroundColor: config.colorStyle.color,
                  borderColor: config.colorStyle.color,
                  shadowColor: config.colorStyle.color,
                },
          ]}
        >
          <Text style={[styles.text, isAnswer && { color: config.colorStyle.color }]}>
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

      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isQueryOpen && (
        <View style={[styles.activeQueryRow, { borderColor: queryColor }]}>
          <TextInput
            ref={activeQueryInputRef}
            style={[styles.answerInput, { color: queryColor }]}
            placeholder={queryPlaceholder}
            placeholderTextColor={queryColor}
            value={activeQueryText}
            onFocus={() => { kbField.onFocus(); setDoneKey(true); }}
            onChangeText={handleActiveQueryChange}
            onContentSizeChange={kbField.requestLift}
            multiline
            returnKeyType={doneKey ? 'done' : 'default'}
            onSubmitEditing={() => Keyboard.dismiss()}
            submitBehavior="blurAndSubmit"
            keyboardAppearance="dark" 
          />
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
  answerBoxUser: {
    ...rowBase,
    borderWidth: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 25,
    minHeight: 32,
  },
  answerBoxPartner: {
    ...rowBase,
    borderWidth: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 2,
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
    borderBottomRightRadius: 25,
    borderTopRightRadius: 2,
    paddingHorizontal: 10,
    paddingBottom: 2,
    minHeight: 32,
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
    minHeight: 32,
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
    minHeight: 32,
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