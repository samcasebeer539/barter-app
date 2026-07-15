import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, KeyboardEvent } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../styles/globalStyles';
import TradeDeck from '../../components/DeckTrade';
import OfferDeck from '../../components/DeckOffers';
import OffersTradesDealsBar from '../../components/BarBarter';
import { TRADE_ACTIONS } from '../../config/tradeConfig';
import TradeTurns, { TradeTurn } from '../../components/TradeTurns';
import { getOpenTrade, getQuery, getBarterGames, BarterGame, buildTradeTurns } from '@/services/tradeService';
import { OpenTradeItem, Post } from '@/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const deal1Turns: TradeTurn[] = [
    { type: 'turnAccept', user: 'Jay Wilson', isUser: false },
    { type: 'turnAccept', isUser: true },
    { type: 'turnQuery', user: 'Jay Wilson', item: 'Fantasy Books', isUser: false },
    { type: 'turnCounter', isUser: true },
    { type: 'turnBarter', user: 'Jay Wilson', item: 'Bike Repair', isUser: false },
    { type: 'turnOffer', item: 'Fantasy Books', isUser: true },
];

const TOP_PADDING = 0;
const BOTTOM_PADDING = 110;
const DECK_GAP = 16;

const mockPosts: Post[] = [
    {
        _id: 'mock1',
        name: 'Fantasy Books',
        description: 'Includes LOTR, ASOIAF, Earthsea, Narnia',
        photos: [
            'https://picsum.photos/seed/book/800/400',
            'https://picsum.photos/seed/portrait1/400/600',
            'https://picsum.photos/seed/square1/500/500',
        ],
        date_posted: '11/17/24',
    },
];

export default function ActiveTradesTestScreen() {
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollY = useRef(0);
    const [resetKey, setResetKey] = useState(0);
    const [tab, setTab] = useState<'open' | 'barter' | 'close'>('open');
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [trades, setTrades] = useState<OpenTradeItem[]>([]);
    const [queries, setQueries] = useState<OpenTradeItem[]>([]);
    const [barterGames, setBarterGames] = useState<BarterGame[]>([]);
    const insets = useSafeAreaInsets();

    const queriesActions = useMemo(
        () => TRADE_ACTIONS.filter(a => ['offer', 'query'].includes(a.actionType)),
        []
    );
    const offersActions = useMemo(
        () => TRADE_ACTIONS.filter(a => ['query', 'rescind'].includes(a.actionType)),
        []
    );
    const tradesActions = useMemo(
        () => TRADE_ACTIONS.filter(a =>
            ['query', 'counter', 'stall', 'verify', 'accept', 'decline', 'wait', 'play'].includes(a.actionType)
        ),
        []
    );
    const dealsActions = useMemo(
        () => TRADE_ACTIONS.filter(a =>
            ['where', 'when', 'query', 'acceptFinal', 'decline', 'wait', 'play'].includes(a.actionType)
        ),
        []
    );

    useEffect(() => {
        const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
            setKeyboardHeight(e.endCoordinates.height);
            scrollViewRef.current?.scrollTo({
                y: scrollY.current + e.endCoordinates.height * 0.8,
                animated: true,
            });
        });
        const hide = Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            setResetKey(prev => prev + 1);
        }, [])
    );

    useEffect(() => {
        getOpenTrade().then(setTrades).catch(err => console.error('Failed to load open trades:', err));
    }, []);

    useEffect(() => {
        getQuery().then(setQueries).catch(err => console.error('Failed to load queries:', err));
    }, []);

    useEffect(() => {
        if (tab !== 'barter') return;
        getBarterGames()
            .then(setBarterGames)
            .catch(err => console.error('Failed to load barter games:', err));
    }, [tab, resetKey]);

    return (
        <View style={styles.container}>
            <OffersTradesDealsBar
                onOffersPress={() => setTab('open')}
                onTradesPress={() => setTab('barter')}
                onDealsPress={() => setTab('close')}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scroll}
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingTop: insets.top, paddingBottom: BOTTOM_PADDING + keyboardHeight },
                ]}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={scrollEnabled}
                onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
            >
                <View style={styles.topSpacer} />

                {tab === 'open' && (
                    <View style={styles.deckList}>
                        <OfferDeck
                            posts={queries}
                            deckType="queries"
                            actions={queriesActions}
                            onHorizontalGestureStart={() => setScrollEnabled(false)}
                            onGestureEnd={() => setScrollEnabled(true)}
                        />
                        <OfferDeck
                            posts={trades}
                            deckType="offers"
                            actions={offersActions}
                            onHorizontalGestureStart={() => setScrollEnabled(false)}
                            onGestureEnd={() => setScrollEnabled(true)}
                        />
                    </View>
                )}

                {tab === 'barter' && (
                    <View style={styles.deckList}>
                        {barterGames.map(game => (
                            <TradeDeck
                                key={game.gameId}
                                gameId={game.gameId}
                                partnerUser={game.partner.user}
                                partnerPosts={game.partner.posts}
                                playerUser={game.player.user}
                                playerPosts={game.player.posts}
                                actions={tradesActions}
                                turns={buildTradeTurns(
                                    game.turns,
                                    game.player.user._id ?? '',
                                    game.partner.user.first_name,
                                    [...game.player.posts, ...game.partner.posts]
                                )}
                                onHorizontalGestureStart={() => setScrollEnabled(false)}
                                onGestureEnd={() => setScrollEnabled(true)}
                            />
                        ))}
                    </View>
                )}

                {tab === 'close' && (
                    <View style={styles.deckList}>
                        <TradeDeck
                            partnerUser={{} as any}
                            partnerPosts={mockPosts}
                            playerUser={{} as any}
                            playerPosts={mockPosts}
                            actions={dealsActions}
                            showDateTime={true}
                            showLocation={true}
                            turns={deal1Turns}
                        />
                        <OfferDeck
                            posts={[]}
                            deckType="deals"
                        />
                        <OfferDeck
                            posts={[]}
                            deckType="declined"
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ui.background },
    scroll: { flex: 1},
    contentContainer: { flexGrow: 1, paddingTop: 0 },
    topSpacer: { height: TOP_PADDING },
    deckList: { gap: DECK_GAP },
});