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
import { buildQueryTurns, buildOfferTurns, buildTradeTurns, sendOffer, sendQuery, rescindOffer } from '@/services/tradeService';
import { useTradeAction } from '../hooks/useTradeAction';
import { useStableCallback } from '../hooks/useStableCallback';
import { showError } from '@/lib/errors';
import { pad2 } from '@/lib/format';

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
    // Optional: let the screen control open/closed (e.g. one deck open at a time).
    expanded?: boolean;
    onToggleExpanded?: () => void;
}

const DECK_LABELS: Record<OfferDeckType, { text: string; color: string }> = {
    queries: { text: 'MY QUERIES', color: colors.actions.query },
    offers: { text: 'MY OFFERS', color: colors.actions.offer },
    declined: { text: 'DECLINED OFFERS', color: colors.actions.decline },
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
    expanded,
    onToggleExpanded,
}: OfferDeckProps) {
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isExpanded = expanded ?? internalExpanded;
    const toggleExpanded = () => (onToggleExpanded ? onToggleExpanded() : setInternalExpanded(prev => !prev));
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

    // A question here is always about the post on top (the server needs a
    // post): it follows the deck as you swipe, and QUERY is greyed out while
    // a user or location card is on top.
    const queryPostIndex = isQueryActive ? topPostIndex : null;
    // Swiping to a user or location card turns QUERY off (closing the box):
    // there's no post to ask about.
    useEffect(() => {
      if (trade.activeAction === 'query' && topPostIndex === null) trade.reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topPostIndex]);
    const effectiveIsReady =
        trade.activeAction === 'query'
            ? topPostIndex !== null && queryText.trim().length > 0
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

    // Stable callbacks for the (memoized) deck.
    const handleQueryPostTap = useStableCallback((postIndex: number) => trade.setSubflowData(postIndex));
    const handleSelectPost = useStableCallback((postIndex: number) => {
        if (trade.activeAction !== 'offer') {
            trade.selectAction('offer', postIndex);
        } else {
            trade.togglePost(postIndex);
        }
    });

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

        // A question needs a post on top (closing an open box still works).
        if (actionType === 'query' && trade.activeAction !== 'query' && topPostIndex === null) return;

        trade.selectAction(actionType);
    };

    const handleConfirm = async () => {
        if (!effectiveIsReady || !trade.activeAction) return;

        await new Promise(resolve => setTimeout(resolve, 0));

        switch (trade.activeAction) {
            case 'offer': {
                if (trade.selectedPosts.length === 0 || isSubmittingOffer) break;
                const selectedItem = itemsWithPost[trade.selectedPosts[0]];
                if (!selectedItem?.post._id) break;

                setIsSubmittingOffer(true);
                try {
                    await sendOffer(selectedItem.post._id);
                    onActionComplete?.('offer');
                } catch (err) {
                    showError("Your offer didn't go through", err);
                } finally {
                    setIsSubmittingOffer(false);
                }
                break;
            }

            case 'query': {
                if (topPostIndex === null || !queryText.trim() || isSubmittingQuery) break;
                const targetItem = itemsWithPost[topPostIndex];
                if (!targetItem?.post._id) break;

                setIsSubmittingQuery(true);
                try {
                    await sendQuery(targetItem.post._id, queryText);
                    onActionComplete?.('query');
                } catch (err) {
                    showError("Your question didn't go through", err);
                    setIsSubmittingQuery(false);
                    return; // keep the box open with your text
                }
                setIsSubmittingQuery(false);
                break;
            }

            case 'rescind': {
                if (trade.selectedPosts.length === 0 || isSubmittingRescind) break;
                const selectedItem = itemsWithPost[trade.selectedPosts[0]];
                if (!selectedItem?.post._id) break;

                setIsSubmittingRescind(true);
                try {
                    await rescindOffer(selectedItem.post._id);
                    onActionComplete?.('rescind');
                } catch (err) {
                    showError("Couldn't take back your offer", err);
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
        // Declined offers: the whole game's history, read-only.
        if (deckType === 'declined') {
            return buildTradeTurns(
                topItem.rawTurns ?? [],
                topItem.myId ?? '',
                topItem.partnerName ?? '',
                topItem.post ? [topItem.post] : [],
            );
        }
        return [];
    }, [isQueryDeck, isOffersDeck, deckType, topPostIndex, itemsWithPost]);

    return (
        <View style={styles.modalContent} pointerEvents="box-none">
            <View style={deckStyles.column}>
                <View style={deckStyles.itemCountRow}>
                    <View style={styles.statusBar}>
                        <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color: label.color }]}>
                            {label.text}
                        </Text>
                        <View style={deckStyles.cardLineup}>
                            <Text style={deckStyles.countText}>{pad2(itemCount)}</Text>
                            <FontAwesome6 name='arrows-rotate' size={24} color={colors.ui.secondarydisabled} />
                        </View>
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
                            querySelectedPostIndex={queryPostIndex}
                            onQueryPostTap={handleQueryPostTap}
                            onSelectPost={handleSelectPost}
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
                                    queryPostSelected={queryPostIndex !== null}
                                    onQueryPostSelect={() => {}}
                                    onQueryPostDeselect={() => {}}
                                    queryBlocked={topPostIndex === null}
                                    blockedActionTypes={topPostIndex === null ? ['offer', 'rescind'] : []}
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
                    onPress={toggleExpanded}
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