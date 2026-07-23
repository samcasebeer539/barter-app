import { useMemo, useState } from 'react';
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

const { width } = Dimensions.get('window');

export type OfferDeckType = 'queries' | 'offers' | 'declined' | 'deals';

interface OfferDeckProps {
    posts: OpenTradeItem[];
    deckType: OfferDeckType;
    actions?: TradeActionConfig[];
    onHorizontalGestureStart?: () => void;
    onGestureEnd?: () => void;
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
}: OfferDeckProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
    const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
    const [isQueryOpen, setIsQueryOpen] = useState(false);
    const [querySelectedPost, setQuerySelectedPost] = useState<number | null>(null);
    const label = DECK_LABELS[deckType];
    const hasActions = HAS_ACTIONS[deckType];
    const isQueryDeck = deckType === 'queries';
    const isOffersDeck = deckType === 'offers';

    // Filter once so that `itemsWithPost`, `cardPosts`, and the turns lookup
    // all share the exact same indices as what Deck reports via
    // onTopCardChange. Filtering `cardPosts` independently of `posts` could
    // desync topPostIndex from the source item whenever a null post existed
    // anywhere but the end of the array.
    const itemsWithPost = useMemo(
        () => posts.filter((item): item is OpenTradeItem & { post: Post } => item.post !== null),
        [posts]
    );
    const itemCount = itemsWithPost.length;

    const selectColor = useMemo(
        () => actions.find(a => a.hasButtons)?.color ?? colors.actions.offer,
        [actions]
    );

    const handleActionSelected = (action: TradeAction) => {
        if (action.subAction === 'write') {
            if (!isSelectMode) {
                setIsSelectMode(true);
                if (topPostIndex !== null) setSelectedPosts([topPostIndex]);
            } else {
                if (topPostIndex !== null) {
                    setSelectedPosts(prev =>
                        prev.includes(topPostIndex)
                            ? prev.filter(i => i !== topPostIndex)
                            : [...prev, topPostIndex]
                    );
                }
            }
        }
        if (action.subAction === 'select') {
            setIsSelectMode(false);
            setSelectedPosts([]);
        }
    };

    const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

    const cardPosts: Post[] = useMemo(
        () => itemsWithPost.map(item => item.post),
        [itemsWithPost]
    );

    const groups: DeckGroup[] = useMemo(
        () => [{ posts: cardPosts }],
        [cardPosts]
    );

    // Live thread/turn for whichever card is currently on top. Queries get
    // a full merged thread (buildQueryTurns); offers get a single
    // turnOffer entry since duplicate offers aren't allowed and offer
    // documents carry no message thread. Other deck types keep an empty
    // turns row, same as before.
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
                            isSelectMode={isSelectMode}
                            selectedPosts={selectedPosts}
                            onTopCardChange={setTopPostIndex}
                            selectColor={selectColor}
                            isQueryMode={isQueryDeck}
                            querySelectedPostIndex={querySelectedPost}
                            showUser={false}
                            showLocation={false}
                        />
                    </View>
                )}

                {isExpanded && (
                    <View style={styles.turnsAndButtonColumn}>
                        <View style={[styles.queryRow, { marginBottom: isQueryOpen ? 4 : 0 }]}>
                            <TradeTurns turns={[]} isQueryOpen={isQueryOpen} />
                        </View>
                        {hasActions && (
                            <View style={styles.actionRow}>
                                <TradeUI
                                    actions={actions}
                                    onActionSelected={handleActionSelected}
                                    onQueryToggle={setIsQueryOpen}
                                    isSelectMode={isSelectMode}
                                    selectedCount={selectedPosts.length}
                                    topCardIsSelected={topCardIsSelected}
                                    isQueryMode={isQueryDeck}
                                    queryPostSelected={querySelectedPost !== null}
                                    onQueryPostSelect={() => setQuerySelectedPost(topPostIndex)}
                                    onQueryPostDeselect={() => setQuerySelectedPost(null)}
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