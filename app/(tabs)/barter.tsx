import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { deckStyles, makeCountBar } from '../../styles/deckStyles';
import { colors } from '../../styles/globalStyles';
import TradeDeck from '../../components/DeckTrade';
import OfferDeck from '../../components/DeckOffers';
import OffersTradesDealsBar from '../../components/BarBarter';
import { TRADE_ACTIONS } from '../../config/tradeConfig';
import TradeTurns, { TradeTurn } from '../../components/TradeTurns';
import { getOpenTab, getCloseTab, getCloseGamesIfChanged, getBarterGamesIfChanged, BarterGame, buildTradeTurns } from '@/services/tradeService';
import { OpenTradeItem } from '@/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useKeyboardLift, KeyboardLiftContext } from '@/hooks/useKeyboardLift';

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

    // Keeps the field you're typing in visible above the keyboard (shared
    // with the profile and feed deck; see hooks/useKeyboardLift).
    const keyboardLift = useKeyboardLift(scrollViewRef, scrollY, insets.top);
    const keyboardHeight = keyboardLift.keyboardHeight;

    useEffect(() => {
        const unsubscribe = () => {
            setResetKey(prev => prev + 1);
        };

        return unsubscribe;
    }, []);

    // Stable, so the (memoized) decks don't redraw when this screen does.
    const disableScroll = useCallback(() => setScrollEnabled(false), []);
    const enableScroll = useCallback(() => setScrollEnabled(true), []);

    // OPEN tab: QUERIES, OFFERS and DECLINED OFFERS, all from one request.
    // Used for the tab's load, pull to refresh, and after your own moves.
    const refreshOpenTab = useCallback(() => {
        return getOpenTab()
            .then(data => {
                setQueries(keepIfSame(data.queries));
                setTrades(keepIfSame(data.offers));
                setDeclined(keepIfSame(data.declined));
            })
            .catch(err => console.error('Failed to load open tab:', err));
    }, []);

    // Fired by OfferDeck after a successful offer, query or rescind.
    const handleActionComplete = useCallback(
        (_actionType: 'offer' | 'query' | 'rescind') => { refreshOpenTab(); },
        [refreshOpenTab]
    );

    // Current poll delay. Any change to a list (the partner's move, or your
    // own) resets it to the fastest rate.
    const pollDelay = useRef(POLL_MIN_MS);
    // Version of the barter list we have; the server answers 204 if unchanged.
    const barterVersion = useRef('');

    // Resolves true if the list changed.
    // Whether the barter list has loaded at least once (so "no active trades"
    // doesn't flash before it arrives).
    const [hasLoadedBarter, setHasLoadedBarter] = useState(false);
    const refreshBarterGames = useCallback(() => {
        return getBarterGamesIfChanged(barterVersion.current)
            .then(result => {
                setHasLoadedBarter(true);
                if (!result.changed) return false;
                barterVersion.current = result.version;
                pollDelay.current = POLL_MIN_MS;
                setBarterGames(keepIfSame(result.data));
                return true;
            })
            .catch(err => { console.error('Failed to load barter games:', err); return false; });
    }, []);


    // Close tab history: finished trades, as read-only trade decks.
    const [acceptedTrades, setAcceptedTrades] = useState<BarterGame[]>([]);
    const [declinedTrades, setDeclinedTrades] = useState<BarterGame[]>([]);
    const [isAcceptedOpen, setIsAcceptedOpen] = useState(false);
    const [isDeclinedOpen, setIsDeclinedOpen] = useState(false);
    // History counts for the dropdown bars, sent with every close-tab load.
    // The lists themselves load the first time either dropdown is opened,
    // and are kept fresh with every close-tab load after that.
    const [historyCounts, setHistoryCounts] = useState({ completed: 0, declined: 0 });
    const historyLoaded = useRef(false);

    // CLOSE tab: close games plus history counts (and the history lists once
    // opened), all from one request. Resolves true if the close games changed.
    const closeVersion = useRef('');
    const closeGameCount = useRef<number | null>(null);
    const refreshCloseTab = useCallback(() => {
        return getCloseTab(historyLoaded.current)
            .then(data => {
                const changed = data.closeVersion !== closeVersion.current;
                closeVersion.current = data.closeVersion;
                closeGameCount.current = data.close.length;
                if (changed) pollDelay.current = POLL_MIN_MS;
                setCloseGames(keepIfSame(data.close));
                setHistoryCounts(keepIfSame(data.counts));
                if (data.completed) setAcceptedTrades(keepIfSame(data.completed));
                if (data.declined) setDeclinedTrades(keepIfSame(data.declined));
                return changed;
            })
            .catch(err => { console.error('Failed to load close tab:', err); return false; });
    }, []);

    // First open of either history dropdown: load the whole history.
    const toggleHistory = useCallback((setOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => {
        if (!historyLoaded.current) {
            historyLoaded.current = true;
            refreshCloseTab();
        }
        setOpen(o => !o);
    }, [refreshCloseTab]);

    // The close tab's background check: just the close games, and nothing
    // at all (204) if they haven't changed. The history counts only change
    // when a game leaves the list (declined, timed out or completed), so
    // only then does it reload the whole tab.
    const pollCloseGames = useCallback(async () => {
        try {
            const result = await getCloseGamesIfChanged(closeVersion.current);
            if (!result.changed) return false;
            if (closeGameCount.current !== null && result.data.length < closeGameCount.current) {
                await refreshCloseTab();
                return true;
            }
            closeVersion.current = result.version;
            closeGameCount.current = result.data.length;
            pollDelay.current = POLL_MIN_MS;
            setCloseGames(keepIfSame(result.data));
            return true;
        } catch (err) {
            console.error('Failed to check close games:', err);
            return false;
        }
    }, [refreshCloseTab]);

    // Stable, so the decks' turn-timer effects don't restart on every render.
    const handleCloseTurnExpired = useCallback(() => {
        refreshCloseTab();
    }, [refreshCloseTab]);

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
    // Each tab loads with one request: the open tab's three decks, or the
    // close tab's games plus history. The close-tab poll checks only the
    // close games (see pollCloseGames).
    useEffect(() => {
        if (!isFocused) return;
        if (tab === 'open') {
            refreshOpenTab();
            return;
        }
        if (tab === 'barter') {
            refreshBarterGames();
        } else if (tab === 'close') {
            refreshCloseTab();
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
                const changed = await (tab === 'barter' ? refreshBarterGames() : pollCloseGames());
                if (!changed) pollDelay.current = Math.min(pollDelay.current * 2, POLL_MAX_MS);
            }
            if (!cancelled) timer = setTimeout(tick, pollDelay.current);
        };
        timer = setTimeout(tick, pollDelay.current);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isFocused, tab, resetKey, refreshBarterGames, refreshCloseTab, pollCloseGames, refreshOpenTab]);

    // Pull to refresh, like the feed: reload every list on the current tab.
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            if (tab === 'open') await refreshOpenTab();
            else if (tab === 'barter') await refreshBarterGames();
            else await refreshCloseTab();
        } finally {
            setRefreshing(false);
        }
    }, [tab, refreshOpenTab, refreshBarterGames, refreshCloseTab]);

    // A finished trade as a read-only trade deck (log and decks, no wheel).
    const renderHistoryDeck = (game: BarterGame) => (
        <TradeDeck
            key={game.gameId}
            {...deckExpansion(`game:${game.gameId}`)}
            gameId={game.gameId}
            isMyTurn={false}
            phase={game.phase}
            rawTurns={game.turns}
            partnerUser={game.partner.user}
            partnerPosts={game.partner.posts}
            playerUser={game.player.user}
            playerPosts={game.player.posts}
            actions={[]}
            showDateTime={true}
            showLocation={true}
            turns={buildTradeTurns(
                game.turns,
                game.player.user._id ?? '',
                game.partner.user.first_name,
                [...game.player.posts, ...game.partner.posts]
            )}
            onHorizontalGestureStart={disableScroll}
            onGestureEnd={enableScroll}
        />
    );

    // A dropdown bar (label, count, arrow) and, when open, its trade decks.
    const renderHistorySection = (
        label: string, color: string, count: number, games: BarterGame[], isOpen: boolean, onToggle: () => void,
    ) => (
        // count comes from the server, so the bar is right before the list
        // itself has been loaded (on first open).
        <View style={styles.historySection}>
            {/* Same row + pill bar as the decks' headers. */}
            <View style={[deckStyles.itemCountRow, styles.historyBarRow]}>
                <TouchableOpacity
                    style={styles.historyBar}
                    onPress={onToggle}
                    disabled={count === 0}
                    activeOpacity={0.8}
                >
                    <Text style={[deckStyles.actionButtonText, { marginRight: 'auto', color }]}>{label}</Text>
                    <Text style={deckStyles.countText}>{String(count).padStart(2, '0')}</Text>
                    <FontAwesome6
                        name={isOpen ? 'angle-up' : 'angle-down'}
                        size={26}
                        color={count === 0 ? colors.ui.secondarydisabled : '#fff'}
                    />
                </TouchableOpacity>
            </View>
            {isOpen && games.map(renderHistoryDeck)}
        </View>
    );

    return (
        <KeyboardLiftContext.Provider value={keyboardLift.context}>
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
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
                scrollEnabled={scrollEnabled}
                onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
                onContentSizeChange={keyboardLift.onContentSizeChange}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.ui.secondarydisabled}
                        progressViewOffset={insets.top}
                    />
                }
            >
                <View style={styles.topSpacer} />

                {tab === 'open' && (
                    <View style={styles.deckList}>
                        <OfferDeck
                            posts={queries}
                            deckType="queries"
                            {...deckExpansion('queries')}
                            actions={queriesActions}
                            onHorizontalGestureStart={disableScroll}
                            onGestureEnd={enableScroll}
                            onActionComplete={handleActionComplete}
                        />
                        <OfferDeck
                            posts={trades}
                            deckType="offers"
                            {...deckExpansion('offers')}
                            actions={offersActions}
                            onHorizontalGestureStart={disableScroll}
                            onGestureEnd={enableScroll}
                            onActionComplete={handleActionComplete}
                        />
                        <OfferDeck
                            posts={declined}
                            deckType="declined"
                            {...deckExpansion('declined')}
                            onHorizontalGestureStart={disableScroll}
                            onGestureEnd={enableScroll}
                        />
                    </View>
                )}

                {tab === 'barter' && (
                    <View style={styles.deckList}>
                        {hasLoadedBarter && barterGames.length === 0 && (
                            // Same shape as the ACCEPTED / DECLINED TRADES bars.
                            <View style={styles.historySection}>
                                <View style={[deckStyles.itemCountRow, styles.historyBarRow]}>
                                    <View style={[styles.historyBar, styles.emptyBar]}>
                                        <Text style={[deckStyles.actionButtonText, styles.emptyBarText]}>
                                            NO ACTIVE TRADES
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
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
                                onHorizontalGestureStart={disableScroll}
                                onGestureEnd={enableScroll}
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
                                onActionComplete={refreshCloseTab}
                                onActionFailed={handleActionFailed(refreshCloseTab)}
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
                                onHorizontalGestureStart={disableScroll}
                                onGestureEnd={enableScroll}
                            />
                        ))}
                        {renderHistorySection(
                            'ACCEPTED TRADES', colors.actions.accept, historyCounts.completed,
                            acceptedTrades, isAcceptedOpen, toggleHistory(setIsAcceptedOpen),
                        )}
                        {renderHistorySection(
                            'DECLINED TRADES', colors.actions.decline, historyCounts.declined,
                            declinedTrades, isDeclinedOpen, toggleHistory(setIsDeclinedOpen),
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
        </KeyboardLiftContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.ui.background },
    scroll: { flex: 1},
    contentContainer: { flexGrow: 1, paddingTop: 0 },
    topSpacer: { height: TOP_PADDING },
    deckList: { gap: DECK_GAP },
    historySection: { alignItems: 'center', gap: DECK_GAP },
    // Same height and bottom margin as the arrow bars under the decks, so
    // every gap in the tab is DECK_GAP + 6.
    historyBarRow: { marginBottom: 6 },
    historyBar: { ...makeCountBar('pill1', 'flex-end'), height: 44 },
    emptyBar: { justifyContent: 'center' },
    emptyBarText: { color: colors.ui.secondarydisabled, textAlign: 'center' },
});