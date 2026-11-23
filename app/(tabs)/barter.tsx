import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Keyboard, KeyboardEvent, Alert } from 'react-native';
import { colors } from '../../styles/globalStyles';
import TradeDeck from '../../components/DeckTrade';
import OfferDeck from '../../components/DeckOffers';
import OffersTradesDealsBar from '../../components/BarBarter';
import { TRADE_ACTIONS } from '../../config/tradeConfig';
import TradeTurns, { TradeTurn } from '../../components/TradeTurns';
import { getOpenTrade, getQuery, getBarterGames, getCloseGames, getDeclinedTrades, BarterGame, buildTradeTurns } from '@/services/tradeService';
import { OpenTradeItem } from '@/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const TOP_PADDING = 0;
const BOTTOM_PADDING = 110;
const DECK_GAP = 16;
// How often the barter/close lists recheck the server for the other
// player's moves while you're looking at them.
const POLL_MS = 5000;

// Only swap in fresh data when something changed, so polling doesn't
// re-render every deck (and reset its swipe position) every few seconds.
function keepIfSame<T>(next: T) {
    return (prev: T) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next);
}

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
    const [closeGames, setCloseGames] = useState<BarterGame[]>([]);
    const [declined, setDeclined] = useState<OpenTradeItem[]>([]);
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
            ['query', 'add', 'subtract', 'stall', 'accept', 'decline', 'wait', 'play'].includes(a.actionType)
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

    useEffect(() => {
        const unsubscribe = () => {
            setResetKey(prev => prev + 1);
        };

        return unsubscribe;
    }, []);

    // Centralized so both the initial load and post-action refreshes go
    // through the same functions — avoids the two getting out of sync.
    const refreshTrades = useCallback(() => {
        getOpenTrade().then(setTrades).catch(err => console.error('Failed to load open trades:', err));
    }, []);

    const refreshQueries = useCallback(() => {
        getQuery().then(setQueries).catch(err => console.error('Failed to load queries:', err));
    }, []);

    // Fired by OfferDeck after a successful submit. An 'offer' submission
    // changes the trades list; a 'query' submission changes the queries
    // list — either deck can fire either one, so both decks pass this same
    // handler and it dispatches based on actionType.
    const handleActionComplete = useCallback((actionType: 'offer' | 'query' | 'rescind') => {
        if (actionType === 'offer') refreshTrades();
        if (actionType === 'query') refreshQueries();
        if (actionType === 'rescind') refreshTrades();
    }, [refreshTrades, refreshQueries]);

    useEffect(() => {
        refreshTrades();
    }, [refreshTrades]);

    useEffect(() => {
        refreshQueries();
    }, [refreshQueries]);

    const refreshBarterGames = useCallback(() => {
        getBarterGames()
            .then(games => setBarterGames(keepIfSame(games)))
            .catch(err => console.error('Failed to load barter games:', err));
    }, []);

    const refreshDeclined = useCallback(() => {
        getDeclinedTrades()
            .then(items => setDeclined(keepIfSame(items)))
            .catch(err => console.error('Failed to load declined trades:', err));
    }, []);

    // A close game that drops out of the list was declined (or timed out),
    // which is the only time the declined list changes, so reload it then.
    const closeGameCount = useRef<number | null>(null);
    const refreshCloseGames = useCallback(() => {
        getCloseGames()
            .then(games => {
                if (closeGameCount.current !== null && games.length < closeGameCount.current) {
                    refreshDeclined();
                }
                closeGameCount.current = games.length;
                setCloseGames(keepIfSame(games));
            })
            .catch(err => console.error('Failed to load close games:', err));
    }, [refreshDeclined]);

    // Stable, so the decks' turn-timer effects don't restart on every render.
    const handleCloseTurnExpired = useCallback(() => {
        refreshCloseGames();
        refreshDeclined();
    }, [refreshCloseGames, refreshDeclined]);

    // A refused move means this screen was out of date (or the move was
    // invalid): say why, then reload so the wheel matches the server.
    const handleActionFailed = useCallback((refresh: () => void) => (_action: unknown, err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        Alert.alert("That move didn't go through", message);
        refresh();
    }, []);

    // Whether this screen is the visible app tab. Tabs stay mounted when you
    // leave them, so without this the lists would only reload on a sub-tab
    // switch and would miss the other player's moves.
    const [isFocused, setIsFocused] = useState(false);
    useFocusEffect(useCallback(() => {
        setIsFocused(true);
        return () => setIsFocused(false);
    }, []));

    // Latest lists, readable from the poll timer without restarting it.
    const barterGamesRef = useRef(barterGames);
    barterGamesRef.current = barterGames;
    const closeGamesRef = useRef(closeGames);
    closeGamesRef.current = closeGames;

    // Load the barter/close lists when their sub-tab opens or the screen
    // comes back into view. After that, poll only while you're waiting on
    // the other player in at least one game: on your own turn nothing they
    // do can change the list, so there's nothing to check for. (Your own
    // moves refresh the list directly.) The declined list loads with the
    // close tab and again only when a close game drops out.
    useEffect(() => {
        if (!isFocused) return;
        if (tab === 'barter') {
            refreshBarterGames();
        } else if (tab === 'close') {
            refreshCloseGames();
            refreshDeclined();
        } else {
            return;
        }
        const poll = setInterval(() => {
            const games = tab === 'barter' ? barterGamesRef.current : closeGamesRef.current;
            if (!games.some(g => !g.myTurn)) return;
            if (tab === 'barter') refreshBarterGames();
            else refreshCloseGames();
        }, POLL_MS);
        return () => clearInterval(poll);
    }, [isFocused, tab, resetKey, refreshBarterGames, refreshCloseGames, refreshDeclined]);

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
                            onActionComplete={handleActionComplete}
                        />
                        <OfferDeck
                            posts={trades}
                            deckType="offers"
                            actions={offersActions}
                            onHorizontalGestureStart={() => setScrollEnabled(false)}
                            onGestureEnd={() => setScrollEnabled(true)}
                            onActionComplete={handleActionComplete}
                        />
                    </View>
                )}

                {tab === 'barter' && (
                    <View style={styles.deckList}>
                        {barterGames.map(game => (
                            <TradeDeck
                                key={game.gameId}
                                gameId={game.gameId}
                                isMyTurn={game.myTurn}
                                turnDeadline={game.turnDeadline}
                                pendingQuery={game.pendingQuery}
                                onActionComplete={refreshBarterGames}
                                onActionFailed={handleActionFailed(refreshBarterGames)}
                                onTurnExpired={refreshBarterGames}
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
                        {closeGames.map(game => (
                            <TradeDeck
                                key={game.gameId}
                                gameId={game.gameId}
                                isMyTurn={game.myTurn}
                                turnDeadline={game.turnDeadline}
                                pendingQuery={game.pendingQuery}
                                onActionComplete={refreshCloseGames}
                                onActionFailed={handleActionFailed(refreshCloseGames)}
                                onTurnExpired={handleCloseTurnExpired}
                                partnerUser={game.partner.user}
                                partnerPosts={game.partner.posts}
                                playerUser={game.player.user}
                                playerPosts={game.player.posts}
                                actions={dealsActions}
                                showDateTime={true}
                                showLocation={true}
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
                        <OfferDeck
                            posts={[]}
                            deckType="deals"
                        />
                        <OfferDeck
                            posts={declined}
                            deckType="declined"
                            onHorizontalGestureStart={() => setScrollEnabled(false)}
                            onGestureEnd={() => setScrollEnabled(true)}
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