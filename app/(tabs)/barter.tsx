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
// While you're waiting on the other player, the barter/close lists recheck
// the server: every 5s right after something changes (when a reply is most
// likely), doubling each time nothing has, up to once a minute.
const POLL_MIN_MS = 5000;
const POLL_MAX_MS = 60000;

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
    // Only one deck open at a time across the whole screen. Opening one
    // closes whichever was open; tapping the open one closes it.
    const [openDeckKey, setOpenDeckKey] = useState<string | null>(null);
    const deckExpansion = (key: string) => ({
        expanded: openDeckKey === key,
        onToggleExpanded: () => setOpenDeckKey(prev => (prev === key ? null : key)),
    });
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

    // Current poll delay. Any change to a list (the partner's move, or your
    // own) resets it to the fastest rate.
    const pollDelay = useRef(POLL_MIN_MS);
    const lastBarterJson = useRef('');
    const lastCloseJson = useRef('');

    // Resolves true if the list changed.
    const refreshBarterGames = useCallback(() => {
        return getBarterGames()
            .then(games => {
                const json = JSON.stringify(games);
                const changed = json !== lastBarterJson.current;
                lastBarterJson.current = json;
                if (changed) pollDelay.current = POLL_MIN_MS;
                setBarterGames(keepIfSame(games));
                return changed;
            })
            .catch(err => { console.error('Failed to load barter games:', err); return false; });
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
        return getCloseGames()
            .then(games => {
                if (closeGameCount.current !== null && games.length < closeGameCount.current) {
                    refreshDeclined();
                }
                closeGameCount.current = games.length;
                const json = JSON.stringify(games);
                const changed = json !== lastCloseJson.current;
                lastCloseJson.current = json;
                if (changed) pollDelay.current = POLL_MIN_MS;
                setCloseGames(keepIfSame(games));
                return changed;
            })
            .catch(err => { console.error('Failed to load close games:', err); return false; });
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
    // comes back into view. After that, check only while you're waiting on
    // the other player in at least one game: on your own turn they can't
    // move, so nothing can change. (Your own moves refresh the list
    // directly.) Checks back off while nothing changes; see POLL_MIN_MS.
    // The declined list loads with the close tab and again only when a
    // close game drops out.
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
        pollDelay.current = POLL_MIN_MS;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        const tick = async () => {
            const games = tab === 'barter' ? barterGamesRef.current : closeGamesRef.current;
            // Agreed deals have no turns left to wait for.
            if (games.some(g => !g.myTurn && g.phase !== 'agreed')) {
                const changed = await (tab === 'barter' ? refreshBarterGames() : refreshCloseGames());
                if (!changed) pollDelay.current = Math.min(pollDelay.current * 2, POLL_MAX_MS);
            }
            if (!cancelled) timer = setTimeout(tick, pollDelay.current);
        };
        timer = setTimeout(tick, pollDelay.current);
        return () => { cancelled = true; clearTimeout(timer); };
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
                            {...deckExpansion('queries')}
                            actions={queriesActions}
                            onHorizontalGestureStart={() => setScrollEnabled(false)}
                            onGestureEnd={() => setScrollEnabled(true)}
                            onActionComplete={handleActionComplete}
                        />
                        <OfferDeck
                            posts={trades}
                            deckType="offers"
                            {...deckExpansion('offers')}
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
                                {...deckExpansion(`game:${game.gameId}`)}
                                gameId={game.gameId}
                                isMyTurn={game.myTurn}
                                turnDeadline={game.turnDeadline}
                                pendingQuery={game.pendingQuery}
                                rawTurns={game.turns}
                                phase={game.phase}
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
                                {...deckExpansion(`game:${game.gameId}`)}
                                gameId={game.gameId}
                                isMyTurn={game.myTurn}
                                turnDeadline={game.turnDeadline}
                                pendingQuery={game.pendingQuery}
                                rawTurns={game.turns}
                                phase={game.phase}
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
                            {...deckExpansion('deals')}
                        />
                        <OfferDeck
                            posts={declined}
                            deckType="declined"
                            {...deckExpansion('declined')}
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