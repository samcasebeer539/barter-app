import React from 'react';
import { View, Text, StyleSheet, TextInput, ImageBackgroundComponent } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { colors, defaultTextStyle, globalFonts } from '../styles/globalStyles';
import { TradeTurnType, getTurnConfig } from '../config/tradeConfig';

// Export the TradeTurn interface so other components can import it from here
export interface TradeTurn {
  type: TradeTurnType;
  user?: string;
  item?: string;
  question?: string;
  isUser?: boolean;
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
    
    if (!config) {
      console.error('No config found for turn type:', turn.type);
      return null; // Return null instead of error message for cleaner UI
    }
    
    // Choose the correct template based on whether it's the user's turn or partner's
    let line = turn.isUser ? config.templateUser : config.templatePartner;
    
    // Only replace placeholders if they exist in the template
    if (turn.user && line.includes('{user}')) {
      line = line.replace('{user}', turn.user);
    }
    if (turn.item && line.includes('{item}')) {
      line = line.replace('{item}', turn.item);
    }
    if (turn.question && line.includes('{question}')) {
      line = line.replace('{question}', turn.question);
    }
    
    const arrowIcon = turn.isUser ? 'arrow-left-long' : 'arrow-right-long';
    const hasActionPlaceholder = line.includes('{action}');
    const turnRowStyle = turn.isUser ? styles.turnRowUser : styles.turnRowPartner;
    
    const textContent = (
      <Text style={[config.colorStyle, styles.tradeText, turn.isUser && styles.textAlignRight]}>
        {hasActionPlaceholder ? (
          (() => {
            const parts = line.split('{action}');
            return (
              <>
                {parts[0]}
                <Text style={config.colorStyle}>{config.actionText}</Text>
                {parts[1] || ''}
              </>
            );
          })()
        ) : (
          line
        )}
        {turn.type === 'turnQuery' && turn.question && (
          <>
            {'\n'}
            <Text style={styles.questionText}>       {turn.question}</Text>
          </>
        )}
      </Text>
    );
    
    const arrowElement = (
      <FontAwesome6 name={arrowIcon} size={26} color={config.colorStyle.color} style={styles.arrow} />
    );
    
    return (
      <View 
        style={[
          turnRowStyle,
          { 
            borderColor: config.colorStyle.color,
            shadowColor: config.colorStyle.color,
            backgroundColor: colors.ui.secondary
          }
        ]} 
        key={index}
      >
        {turn.isUser ? (
          <>
            {textContent}
            {arrowElement}
          </>
        ) : (
          <>
            {arrowElement}
            {textContent}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.tradeSection}>
      {turns.map((turn, index) => renderLine(turn, index))}
      
      {showAnswerInput && (
        <View style={styles.turnRowUser}>
          <TextInput
            ref={inputRef}
            style={styles.answerTextInput}
            placeholder="Type your answer..."
            placeholderTextColor="#888"
            value={answerText}
            onChangeText={onAnswerTextChange}
            multiline
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={true}
          />
          <FontAwesome6 name="arrow-left-long" size={18} color='#000' style={styles.arrow} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tradeSection: {
    gap: -4,
    width: '100%',
  },
  turnRowUser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
    paddingHorizontal: 10,
    minHeight: 30, // Changed to minHeight for multiline support
    paddingVertical: 0,
    marginTop: 4,
    borderWidth: 0,
    borderTopLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 25,

    
  },
  turnRowPartner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingHorizontal: 10,
    minHeight: 30, // Changed to minHeight for multiline support
    paddingVertical: 0,
    marginTop: 4,

    borderTopLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,

  },
  arrow: {
    marginTop: 0
  
  },
  tradeText: {
    flex: 1,
    fontSize: 16,
    top: 5,
    fontFamily: globalFonts.bold
  },
  textAlignRight: {
    textAlign: 'right',
  },
  questionText: {
    color: '#ffffff',
    fontFamily: globalFonts.extrabold,
  },
  answerTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    ...defaultTextStyle,
    minHeight: 24,
    // textAlign: 'right', // Align answer input right like user messages
  },
});

export default TradeTurns;