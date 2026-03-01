import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck from './Deck';
import { globalFonts, colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import { TradeActionConfig } from '@/config/tradeConfig';

const { width } = Dimensions.get('window');

interface Post {
    type: 'good' | 'service';
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

const DECK_WIDTH = Math.min(width - 40, 600);

export default function OfferDeck({ posts, actions, onHorizontalGestureStart, onGestureEnd }: OfferDeckProps) {
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
    const [topPostIndex, setTopPostIndex] = useState<number | null>(null);

    const { goodCount, serviceCount } = useMemo(() => {
        const goodCount = posts.filter(post => post.type === 'good').length;
        const serviceCount = posts.filter(post => post.type === 'service').length;
        return { goodCount, serviceCount };
    }, [posts]);

    const handleActionSelected = (action: TradeAction) => {
        if (action.actionType === 'rescind' && action.subAction === 'write') {
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
        if (action.actionType === 'rescind' && action.subAction === 'select') {
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
                <View style={styles.goodServiceRow}>
                    <View style={styles.goodServiceButton}>
                        <Text style={styles.secondaryText}>0{goodCount}</Text>
                        <FontAwesome6 name="gifts" size={18} color={colors.ui.secondarydisabled} />
                        <Text style={styles.secondaryText}> 0{serviceCount}</Text>
                        <FontAwesome6 name="hand-sparkles" size={18} color={colors.ui.secondarydisabled} />
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
                        selectColor={colors.actions.rescind}
                    />
                </View>

                <View style={styles.actionRow}>
                    <TradeUI
                        actions={actions}
                        onActionSelected={handleActionSelected}
                        isSelectMode={isSelectMode}
                        selectedCount={selectedPosts.length}
                        topCardIsSelected={topCardIsSelected}
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
    goodServiceRow: {
        width: 334,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        zIndex: 0,
    },
    goodServiceButton: {
        height: 36,
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        borderTopRightRadius: 22,
        borderBottomRightRadius: 2,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 2,
        backgroundColor: colors.ui.secondary,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    actionRow: {
        width: 334,
        top: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryText: {
        color: colors.ui.secondarydisabled,
        fontSize: 20,
        fontFamily: globalFonts.bold,
    },
});