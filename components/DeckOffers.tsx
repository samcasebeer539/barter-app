import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn }from './TradeTurns';
import { TradeActionConfig } from '@/config/tradeConfig';

const { width } = Dimensions.get('window');

interface Post {
    name: string;
    description: string;
    photos: string[];
}

interface OfferDeckProps {
    posts: Post[];
    actions: TradeActionConfig[];
    onHorizontalGestureStart?: () => void;
    onGestureEnd?: () => void;
}

const trade1Turns: TradeTurn[] = [
  { type: 'turnQuery', isUser: true },
];

const DECK_WIDTH = Math.min(width - 40, 600);

export default function OfferDeck({ posts, actions, onHorizontalGestureStart, onGestureEnd }: OfferDeckProps) {
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
    const [topPostIndex, setTopPostIndex] = useState<number | null>(null);
    const [isQueryOpen, setIsQueryOpen] = useState(false);

    const { itemCount } = useMemo(() => {
        const itemCount = posts.length;
        return { itemCount };
    }, [posts]);

    // Use the color of the first action that has buttons as the select color
    const selectColor = useMemo(() => {
        return actions.find(a => a.hasButtons)?.color ?? colors.actions.offer;
    }, [actions]);

    const handleActionSelected = (action: TradeAction) => {
        if (action.subAction === 'write') {
            if (!isSelectMode) {
                setIsSelectMode(true);
                if (topPostIndex !== null) {
                    setSelectedPosts([topPostIndex]);
                }
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

    const handleTopCardChange = (postIndex: number | null) => {
        setTopPostIndex(postIndex);
    };

    const topCardIsSelected = topPostIndex !== null && selectedPosts.includes(topPostIndex);

    return (
        <View style={styles.modalContent} pointerEvents="box-none">
            <View style={styles.column}>
                <View style={styles.itemCountRow}>
                    <View style={styles.itemCountButton}>
                        <Text style={styles.secondaryText}>0{itemCount}</Text>
                        <FontAwesome6 name='arrows-rotate' size={22} color={colors.ui.secondarydisabled} />
                    </View>
                </View>

                <View style={styles.deckWrapper}>
                    <Deck
                        posts={posts}
                        cardWidth={DECK_WIDTH}
                        enabled={true}
                        onHorizontalGestureStart={onHorizontalGestureStart}
                        onGestureEnd={onGestureEnd}
                        isSelectMode={isSelectMode}
                        selectedPosts={selectedPosts}
                        onTopCardChange={handleTopCardChange}
                        selectColor={selectColor}
                    />
                </View>

                <View style={styles.actionRow}>
                    <TradeUI
                        actions={actions}
                        onActionSelected={handleActionSelected}
                        onQueryToggle={setIsQueryOpen}
                        isSelectMode={isSelectMode}
                        selectedCount={selectedPosts.length}
                        topCardIsSelected={topCardIsSelected}
                    />
                </View>

                <View style={styles.turnsRow}>
                    <TradeTurns
                        turns={trade1Turns}
                        isQueryOpen={isQueryOpen}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
        position: 'relative',
        alignItems: 'center',
        bottom: 600,
    },
    column: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    deckWrapper: {
        left: -12,
    },
    itemCountRow: {
        width: 334,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 4,
        zIndex: 0,
    },
    itemCountButton: {
        height: 36,
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        borderTopRightRadius: 22,
        borderBottomRightRadius: 2,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    actionRow: {
        width: 334,
        top: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    turnsRow: {
        width: 334,
        marginTop: -10,
    },
    secondaryText: {
        color: colors.ui.secondarydisabled,
        fontSize: 20,
        fontFamily: globalFonts.bold,
    },
});