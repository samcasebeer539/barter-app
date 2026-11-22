import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import TradeTurns, { TradeTurn } from './TradeTurns';
import TradeUI, { TradeAction } from './TradeActions';
import { getActionConfig, TradeActionType } from '../config/tradeConfig';
import { useTradeAction } from '../hooks/useTradeAction';
import { answerQuery } from '@/services/tradeService';

const ANSWER_ACTION = getActionConfig('answer');

interface QueryAnswerProps {
    /** The question, as it appears in the turn log. */
    questionTurn: TradeTurn;
    /** The query's id (its trade doc), passed to answerQuery. */
    queryId: string;
    placeholder?: string;
    /** Fired after the answer is saved, so the screen can refetch. */
    onAnswered?: () => void;
    /** Fired if the server refuses the answer. */
    onFailed?: (err: unknown) => void;
}

// A question with the ANSWER wheel under it. Works like QUERY: tap the icon
// to open the text box, type, then tap the arrow. Used in the profile deck's
// query drawer and under a pending question in the trade deck's log.
export default function QueryAnswer({
    questionTurn,
    queryId,
    placeholder = 'Write your answer…',
    onAnswered,
    onFailed,
}: QueryAnswerProps) {
    const trade = useTradeAction();
    const [answerText, setAnswerText] = useState('');
    const [scrolledActionType, setScrolledActionType] = useState<TradeActionType | null>('answer');

    const actions = useMemo(() => (ANSWER_ACTION ? [ANSWER_ACTION] : []), []);
    const turns = useMemo(() => [questionTurn], [questionTurn]);

    const isAnswerActive =
        trade.activeAction === 'answer' &&
        scrolledActionType === 'answer' &&
        trade.phase !== 'idle' &&
        trade.phase !== 'confirmed';

    const isReady = trade.activeAction === 'answer' && answerText.trim().length > 0;

    const handleConfirm = async () => {
        const answer = answerText.trim();
        if (!answer) return;
        // Let the arrow's press-out settle first (see TradeDeck).
        await new Promise(resolve => setTimeout(resolve, 0));
        try {
            await answerQuery(queryId, answer);
            onAnswered?.();
        } catch (err) {
            console.error('Answer failed:', err);
            onFailed?.(err);
        }
        trade.reset();
        setAnswerText('');
    };

    const handleActionSelected = (action: TradeAction) => {
        if (action.subAction === 'select' && trade.activeAction === action.actionType) {
            handleConfirm();
            return;
        }
        trade.selectAction(action.actionType);
    };

    return (
        <View style={styles.container}>
            <View style={styles.questionRow}>
                <TradeTurns turns={turns} />
            </View>
            {/* Same structure as TradeDeck's queryRow: the box only takes
                space (and its 4px gap) while it's open. */}
            <View style={{ marginBottom: isAnswerActive ? 4 : 0 }}>
                <TradeTurns
                    turns={[]}
                    isQueryOpen={isAnswerActive}
                    onQueryTextChange={setAnswerText}
                    queryPlaceholder={placeholder}
                />
            </View>
            <View style={styles.actionRow}>
                <TradeUI
                    actions={actions}
                    onActionSelected={handleActionSelected}
                    activeActionType={trade.activeAction}
                    isReady={isReady}
                    selectedCount={0}
                    topCardIsSelected={false}
                    isQueryMode={false}
                    queryPostSelected={false}
                    onQueryPostSelect={() => {}}
                    onQueryPostDeselect={() => {}}
                    onActionChange={setScrolledActionType}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%' },
    questionRow: { marginBottom: 4 },
    // The wheel's 46px window leaves 6px of empty space under its 40px
    // buttons; -6 cancels it so the card ends at the button's edge and the
    // surrounding gaps are exact.
    actionRow: { marginBottom: -6 },
});
