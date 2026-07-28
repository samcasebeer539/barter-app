import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck, { DeckGroup } from './Deck';
import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig } from '@/config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post } from '@/types/index';
import { OpenTradeItem } from '@/types'
import { buildQueryTurns, buildOfferTurns } from '@/services/tradeService';
import { useTradeAction } from '../hooks/useTradeAction';
import { getAuth } from 'firebase/auth';

const { width } = Dimensions.get('window');

export type OfferDeckType = 'queries' | 'offers' | 'declined' | 'deals';
type CompletedActionType = 'offer' | 'query' | 'rescind';

interface OfferDeckProps {
    posts: OpenTradeItem[];
    deckType: OfferDeckType;
    actions?: TradeActionConfig[];
    onHorizontalGestureStart?: () => void;
    onGestureEnd?: () => void;
    onActionComplete?: (actionType: CompletedActionType) => void;
}

const DECK_LABELS: Record<OfferDeckType, { text: string; color: string }> = {
    queries: { text: 'MY QUERIES', color: colors.actions.query },
    offers: { text: 'MY OFFERS', color: colors.actions.offer },
    declined: { text: 'DECLINED', color: colors.actions.decline },
    deals: { text: 'ACCEPTED', color: colors.actions.accept },
};

const HAS_ACTIONS: Record<OfferDeckType, boolean> = {
    queries: true,
    offers: true,
    declined: false,
    deals: false,
};

export default function OfferDeck({
    posts,
    deckType,
    actions = [],
    onHorizontalGestureStart,
    onGestureEnd,
    onActionComplete,
}: OfferDeckProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
    const label = DECK_LABELS[deckType];
    const hasActions = HAS_ACTIONS[deckType];
    const isQueryDeck = deckType === 'queries';
    const isOffersDeck = deckType === 'offers';

    const trade = useTradeAction();
    const [queryText, setQueryText] = useState('');
    const [scrolledActionType, setScrolledActionType] = useState(actions[0]?.actionType ?? null);
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
    const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);
    const [isSubmittingRescind, setIsSubmittingRescind] = useState(false);

    const isOfferActive =
        trade.activeAction === 'offer' &&
        scrolledActionType === 'offer' &&
        trade.phase !== 'confirmed';

    const isQueryActive =
        trade.activeAction === 'query' &&
        scrolledActionType === 'query' &&
        trade.phase !== 'idle' &&
        trade.phase !== 'confirmed';

    const effectiveIsReady =
        trade.activeAction === 'query'
            ? trade.isReady || queryText.trim().length > 0
            : trade.isReady;

    useEffect(() => {
        if (!isQueryActive) setQueryText('');
    }, [isQueryActive]);

    useEffect(() => {
        if (!isExpanded) {
            trade.reset();
            setQueryText('');
            setScrolledActionType(actions[0]?.actionType ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded]);

    

    

    const itemsWithPost = useMemo(
        () => posts.filter((item): item is OpenTradeItem & { post: Post } => item.post !== null),
        [posts]
    );
    const itemCount = itemsWithPost.length;

    useEffect(() => {
    setTopPostIndex(prev => {
        if (itemCount === 0) return null;
        if (prev === null || prev >= itemCount) return 0;
        return prev;
    });
}, [itemCount]);

    const handleActionSelected = (action: TradeAction) => {
        const { actionType, subAction } = action;

        if (subAction === 'select' && trade.activeAction === actionType) {
            handleConfirm();
            return;
        }

        if (actionType === 'offer' || actionType === 'rescind') {
            trade.selectAction(actionType, topPostIndex);
            return;
        }

        trade.selectAction(actionType);
    };

    async function getAuthHeader() {
        const token = await getAuth().currentUser?.getIdToken();
        return { Authorization: `Bearer ${token}` };
    }

    const handleConfirm = async () => {
        if (!effectiveIsReady || !trade.activeAction) return;

        await new Promise(resolve => setTimeout(resolve, 0));

        switch (trade.activeAction) {
            case 'offer': {
                if (trade.selectedPosts.length === 0 || isSubmittingOffer) break;
                const selectedItem = itemsWithPost[trade.selectedPosts[0]];
                if (!selectedItem) break;

                setIsSubmittingOffer(true);
                try {
                    const headers = await getAuthHeader();
                    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/offer`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetPostId: selectedItem.post._id,
                        }),
                    });
                    onActionComplete?.('offer');
                } catch (err) {
                    console.error('Offer failed:', err);
                } finally {
                    setIsSubmittingOffer(false);
                }
                break;
            }

            case 'query': {
                if (typeof trade.subflowData !== 'number' || !queryText.trim() || isSubmittingQuery) break;
                const targetItem = itemsWithPost[trade.subflowData];
                if (!targetItem) break;

                setIsSubmittingQuery(true);
                try {
                    const headers = await getAuthHeader();
                    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/query`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetPostId: targetItem.post._id,
                            message: queryText,
                        }),
                    });
                    onActionComplete?.('query');
                } catch (err) {
                    console.error('Query failed:', err);
                } finally {
                    setIsSubmittingQuery(false);
                }
                break;
            }

            case 'rescind': {
                if (trade.selectedPosts.length === 0 || isSubmittingRescind) break;
                const selectedItem = itemsWithPost[trade.selectedPosts[0]];
                if (!selectedItem) break;

                setIsSubmittingRescind(true);
                try {
                    const headers = await getAuthHeader();
                    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/dev/trades/rescind`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            targetPostId: selectedItem.post._id,
                        }),
                        
                    });
                    onActionComplete?.('rescind');
                } catch (err) {
                    console.error('Rescind failed:', err);
                } finally {
                    setIsSubmittingRescind(false);
                }
                break;
            }

            default:
                break;
        }

        trade.confirm();
        trade.reset();
    };

    const topCardIsSelected = topPostIndex !== null && trade.selectedPosts.includes(topPostIndex);

    const cardPosts: Post[] = useMemo(
        () => itemsWithPost.map(item => item.post),
        [itemsWithPost]
    );

    const groups: DeckGroup[] = useMemo(
        () => [{ posts: cardPosts }],
        [cardPosts]
    );

    const topTurns: TradeTurn[] = useMemo(() => {
        if (topPostIndex === null) return [];
        const topItem = itemsWithPost[topPostIndex];
        if (!topItem) return [];
        if (isQueryDeck) return buildQueryTurns(topItem);
        if (isOffersDeck) return buildOfferTurns(topItem);
        return [];
    }, [isQueryDeck, isOffersDeck, topPostIndex, itemsWithPost]);

    return (
        <View style={styles.modalContent} pointerEvents="box-none">
            <View style={deckStyles.column}>
                <View style={deckStyles.itemCountRow}>
                    <View style={styles.statusBar}>
                        <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: label.color }]}>
                            {label.text}
                        </Text>
                        <Text style={deckStyles.countText}>0{itemCount}</Text>
                        <FontAwesome6 name='arrows-rotate' size={24} color={colors.ui.secondarydisabled} />
                    </View>
                </View>

                {isExpanded && (
                    <View style={deckStyles.deckWrapper}>
                        <Deck
                            groups={groups}
                            cardWidth={Math.min(width - 36, 400)}
                            enabled={true}
                            onHorizontalGestureStart={onHorizontalGestureStart}
                            onGestureEnd={onGestureEnd}
                            isSelectMode={isOfferActive}
                            selectedPosts={trade.selectedPosts}
                            onTopCardChange={setTopPostIndex}
                            selectColor={colors.actions.offer}
                            isQueryMode={isQueryActive}
                            querySelectedPostIndex={
                                isQueryActive && typeof trade.subflowData === 'number' ? trade.subflowData : null
                            }
                            onQueryPostTap={(postIndex) => trade.setSubflowData(postIndex)}
                            onSelectPost={(postIndex) => {
                                if (trade.activeAction !== 'offer') {
                                    trade.selectAction('offer', postIndex);
                                } else {
                                    trade.togglePost(postIndex);
                                }
                            }}
                            showUser={false}
                            showLocation={false}
                        />
                    </View>
                )}

                {isExpanded && (
                    <View style={styles.turnsAndButtonColumn}>
                        <View style={[styles.queryRow, { marginBottom: isQueryActive ? 4 : 0 }]}>
                            <TradeTurns turns={[]} isQueryOpen={isQueryActive} onQueryTextChange={setQueryText} />
                        </View>
                        {hasActions && (
                            <View style={styles.actionRow}>
                                <TradeUI
                                    actions={actions}
                                    onActionSelected={handleActionSelected}
                                    activeActionType={trade.activeAction}
                                    isReady={effectiveIsReady}
                                    selectedCount={trade.selectedPosts.length}
                                    topCardIsSelected={topCardIsSelected}
                                    isQueryMode={isQueryActive}
                                    queryPostSelected={isQueryActive && trade.subflowData != null}
                                    onQueryPostSelect={() => trade.setSubflowData(topPostIndex)}
                                    onQueryPostDeselect={() => trade.setSubflowData(null)}
                                    onActionChange={setScrolledActionType}
                                />
                            </View>
                        )}
                        <View style={styles.turnsRow}>
                            <TradeTurns turns={topTurns} />
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.collapseBar}
                    onPress={() => setIsExpanded(prev => !prev)}
                    disabled={itemCount === 0}
                >
                    <FontAwesome6
                        name={isExpanded ? 'angle-up' : 'angle-down'}
                        size={26}
                        color={itemCount === 0 ? colors.ui.secondarydisabled : '#fff'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modalContent: { width: '100%', position: 'relative', alignItems: 'center' },
    statusBar: { ...makeCountBar('pill', 'flex-end') },
    turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH, },
    queryRow: {},
    actionRow: { marginBottom: -2 },
    turnsRow: {},
    collapseBar: {
        width: DECK_BAR_WIDTH,
        height: 44,
        ...barRadius.bottomCap,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        zIndex: 10,
        marginBottom: 6,
    },
});