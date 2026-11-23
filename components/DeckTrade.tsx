import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck, { DeckGroup } from './Deck';

import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import QueryAnswer from './QueryAnswer';
import FeedDeck from './DeckFeed';
import { getFeedProfile } from '@/services/feedService';
import { FeedProfile } from '@/types/index';
import { TradeActionConfig, TradeActionType, getActionConfig } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post, Locations, User } from '@/types/index';
import { acceptTrade, declineTrade, stallTrade, sendGameQuery, proposeLocation, subtractPost } from '@/services/tradeService';
import { useTradeAction } from '../hooks/useTradeAction';

const { width } = Dimensions.get('window');

interface TradeDeckProps {
  partnerUser: User;
  partnerPosts: Post[];
  playerUser: User;
  playerPosts: Post[];
  actions: TradeActionConfig[];
  turns: TradeTurn[];
  onHorizontalGestureStart?: () => void;
  onGestureEnd?: () => void;
  showDateTime?: boolean;
  showLocation?: boolean;
  // ── Confirmed-action payload callbacks ──────────────────────────────────
  // TradeDeck owns the one-tap game moves (accept/decline/stall).
  // Everything else hands its payload up to whatever screen embeds this deck.
  onBarterSubmit?: (postIndexes: number[]) => void;
  onQuerySubmit?: (payload: { postIndex: number | null; question: string }) => void;
  onLocationProposed?: (location: Locations) => void;
  // Fired after a move this deck sent succeeds, so the screen can refetch
  // the game (new turn owner, new phase, new turn in the log).
  onActionComplete?: (actionType: TradeActionType) => void;
  // Fired when the server refuses a move (e.g. the game moved on since this
  // screen last loaded), so the screen can refetch the real state.
  onActionFailed?: (actionType: TradeActionType, err: unknown) => void;
  gameId?: string;
  // Whose move it is. When false, the wheel shows only WAIT. Defaults to
  // true so decks without live game data (e.g. mock decks) stay usable.
  isMyTurn?: boolean;
  // ISO timestamp the active player's turn runs out. Shown on DECLINE / WAIT.
  turnDeadline?: string | null;
  // Fired once the deadline has passed. The server auto-declines overdue
  // games when they're next loaded, so the screen should refetch.
  onTurnExpired?: () => void;
  // A question the partner asked that the player must answer before their
  // turn begins. While set, the main wheel stays on WAIT and the ANSWER wheel
  // appears under the question in the log.
  pendingQuery?: { tradeId: string; message: string } | null;
}

// Wait this long past the deadline before refetching, so a phone clock
// running slightly fast doesn't ask the server before it agrees time is up.
const EXPIRY_GRACE_MS = 2000;

const DECK_WIDTH = Math.min(width - 36, 400);

const MULTI_SELECT_ACTIONS: TradeActionType[] = ['offer', 'barter', 'rescind', 'subtract'];

const WAIT_ACTION = getActionConfig('wait');

export default function TradeDeck({
  partnerUser,
  partnerPosts,
  playerUser,
  playerPosts,
  actions,
  turns,
  showDateTime = false,
  showLocation = false,
  onHorizontalGestureStart,
  onGestureEnd,
  onBarterSubmit,
  onQuerySubmit,
  onLocationProposed,
  onActionComplete,
  onActionFailed,
  gameId,
  isMyTurn = true,
  turnDeadline = null,
  onTurnExpired,
  pendingQuery = null,
}: TradeDeckProps) {
  const trade = useTradeAction();

  // Your turn begins once any question the partner asked is answered. Until
  // then (and whenever it's not your turn) the wheel shows WAIT only.
  const mustAnswer = isMyTurn && !!pendingQuery;
  const canPlay = isMyTurn && !mustAnswer;
  const visibleActions = useMemo(() => {
    if (canPlay) {
      return actions.filter(a =>
        a.actionType !== 'wait' &&
        a.actionType !== 'answer' &&
        // SUBTRACT only when you'd still have an item left in the trade.
        (a.actionType !== 'subtract' || playerPosts.length > 1)
      );
    }
    return WAIT_ACTION ? [WAIT_ACTION] : [];
  }, [actions, canPlay, playerPosts.length]);

  // Where the pending question sits in the log (newest first). Only the
  // player who has to answer gets the ANSWER wheel under it.
  const pendingTurnIndex = useMemo(
    () => (mustAnswer ? turns.findIndex(t => t.type === 'turnQuery' && !t.isUser) : -1),
    [mustAnswer, turns]
  );

  // ADD opens the partner's feed deck, where you pick one of their posts.
  // Like the feed screen, their posts load first and the deck slides up
  // already filled, so cards don't pop in mid-animation.
  const [isAddDeckOpen, setIsAddDeckOpen] = useState(false);
  const [addProfile, setAddProfile] = useState<FeedProfile | null>(null);
  const isLoadingAddProfile = useRef(false);
  // ADD's wheel button stays filled from the tap until the feed deck closes.
  const [isAddPressed, setIsAddPressed] = useState(false);
  const partnerPostIds = useMemo(
    () => partnerPosts.map(p => p._id).filter((id): id is string => !!id),
    [partnerPosts]
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [showingPlayer, setShowingPlayer] = useState(false);

  // Partner deck (left) — the other user's posts, query-selectable
  const [partnerTopPostIndex, setPartnerTopPostIndex] = useState<number | null>(null);
  // Player deck (right) — own posts, barter-selectable / location-selectable
  const [playerTopPostIndex, setPlayerTopPostIndex] = useState<number | null>(null);

  // The question text for an in-progress query lives here rather than in
  // trade.subflowData, since subflowData for 'query' holds the selected
  // partner post index (mirroring how 'where' holds the selected location).
  // This keeps useTradeAction's payload contract uniform — one slot per
  // action — without forcing every consumer to deal with composite shapes.
  const [queryText, setQueryText] = useState('');

  // What the action wheel is currently scrolled to — distinct from
  // trade.activeAction, which only changes on an icon tap. Subflow/select
  // UI (query's text box, where's location-select mode, barter's post-select
  // mode) should disappear as soon as the wheel scrolls away, not linger
  // until the next tap.
  const [scrolledActionType, setScrolledActionType] = useState<TradeActionType | null>(
    visibleActions[0]?.actionType ?? null
  );

  // Refetch once the turn deadline passes (checked each second rather than
  // one long setTimeout, which React Native warns about on Android).
  useEffect(() => {
    if (!turnDeadline || !onTurnExpired) return;
    const expiresAt = Date.parse(turnDeadline) + EXPIRY_GRACE_MS;
    if (Number.isNaN(expiresAt)) return;
    let fired = false;
    const check = () => {
      if (!fired && Date.now() >= expiresAt) {
        fired = true;
        onTurnExpired();
      }
    };
    check();
    const tick = setInterval(check, 1000);
    return () => clearInterval(tick);
  }, [turnDeadline, onTurnExpired]);

  // When the turn changes hands the wheel gets a different action list:
  // drop any half-built move and point at the new list's first action.
  // (TradeUI scrolls itself back to the top whenever its actions change.)
  useEffect(() => {
    trade.reset();
    setScrolledActionType(visibleActions[0]?.actionType ?? null);
  }, [visibleActions, trade.reset]);

  const slideAnim = useRef(new Animated.Value(-12)).current;

  // Each player's saved locations feed their deck's location card.
  const partnerGroups: DeckGroup[] = useMemo(
    () => [{ user: partnerUser, posts: partnerPosts, locations: partnerUser.locations ?? [] }],
    [partnerUser, partnerPosts]
  );
  const playerGroups: DeckGroup[] = useMemo(
    () => [{ user: playerUser, posts: playerPosts, locations: playerUser.locations ?? [] }],
    [playerUser, playerPosts]
  );

  const slideToDeck = (toPlayer: boolean) => {
    const toValue = toPlayer ? -(DECK_WIDTH) - 38 : -12;
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 60, friction: 10 }).start();
    setShowingPlayer(toPlayer);
  };
  const handleSwitchDecks = () => slideToDeck(!showingPlayer);

  // WHERE brings the player's location card to the top of their deck. Deck
  // order is user card, date card (if shown), location card, then posts.
  const playerLocationCardIndex = (playerUser ? 1 : 0) + (showDateTime ? 1 : 0);
  const [playerJumpToken, setPlayerJumpToken] = useState<number | undefined>(undefined);
  const showPlayerLocationCard = () => {
    if (!showingPlayer) slideToDeck(true);
    setPlayerJumpToken(t => (t ?? 0) + 1);
  };

  const topPostIndex = showingPlayer ? playerTopPostIndex : partnerTopPostIndex;
  const topCardIsSelected = topPostIndex !== null && trade.selectedPosts.includes(topPostIndex);

  const isBarterActive =
    trade.activeAction !== null &&
    MULTI_SELECT_ACTIONS.includes(trade.activeAction) &&
    scrolledActionType === trade.activeAction &&
    trade.phase !== 'confirmed';

  const isQueryActive =
    trade.activeAction === 'query' &&
    scrolledActionType === 'query' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';
  const isWhereActive =
    trade.activeAction === 'where' &&
    scrolledActionType === 'where' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';

  // A query needs a typed question (queryText, kept local — see note above).
  // Selecting a partner post is optional: it just tags what the question is
  // about. The hook only knows about the post selection, so this overrides it.
  const effectiveIsReady =
    trade.activeAction === 'query'
      ? queryText.trim().length > 0
      : trade.isReady;

  // Clear the locally-held question text whenever the query subflow ends,
  // so a stale draft doesn't leak into the next query attempt.
  useEffect(() => {
    if (!isQueryActive) setQueryText('');
  }, [isQueryActive]);

  const openAddDeck = async () => {
    const anyPartnerPostId = partnerPostIds[0];
    if (!anyPartnerPostId || isLoadingAddProfile.current) return;
    isLoadingAddProfile.current = true;
    setIsAddPressed(true);
    try {
      // Any of the partner's posts loads their profile and every post.
      setAddProfile(await getFeedProfile(anyPartnerPostId));
      setIsAddDeckOpen(true);
    } catch (err) {
      console.error('Loading partner posts failed:', err);
      setIsAddPressed(false);
      onActionFailed?.('add', err);
    } finally {
      isLoadingAddProfile.current = false;
    }
  };

  const handleActionSelected = (action: TradeAction) => {
    const { actionType, subAction } = action;

    // Off-turn the wheel only shows WAIT, which is display-only. This guard
    // backs that up in case anything else tries to arm a move.
    if (!canPlay) return;

    // Arrow / confirm tap always sends 'select' for the currently-active action.
    if (subAction === 'select' && trade.activeAction === actionType) {
      handleConfirm();
      return;
    }

    if (actionType === 'add') {
      // Played from the partner's feed deck, not this wheel.
      openAddDeck();
      return;
    }

    if (actionType === 'subtract') {
      // Picks from your own deck: show it, then toggle its top card.
      if (!showingPlayer) slideToDeck(true);
      trade.selectAction(actionType, playerTopPostIndex);
      return;
    }

    if (MULTI_SELECT_ACTIONS.includes(actionType)) {
      trade.selectAction(actionType, playerTopPostIndex);
      return;
    }

    if (actionType === 'where') {
      const wasArmed = trade.activeAction === 'where';
      trade.selectAction(actionType); // a second tap disarms
      if (!wasArmed) showPlayerLocationCard();
      return;
    }

    // Simple actions (accept, acceptFinal, add, subtract, decline, stall, wait, play)
    // and subflow actions (query, where, when) both just arm on icon tap.
    trade.selectAction(actionType);
  };

  const handleConfirm = async () => {
    if (!canPlay || !effectiveIsReady || !trade.activeAction) return;

    // Let the current touch's press-out / opacity-restore finish before
    // anything disables this same button — flipping `disabled` on a
    // TouchableOpacity within the same tick as its own press can leave it
    // stuck at its pressed-down opacity.
    await new Promise(resolve => setTimeout(resolve, 0));

    switch (trade.activeAction) {
      case 'accept':
      case 'acceptFinal':
        if (!gameId) break;
        try {
          await acceptTrade(gameId);
          onActionComplete?.(trade.activeAction);
        } catch (err) {
          console.error('Accept failed:', err);
          onActionFailed?.(trade.activeAction ?? 'accept', err);
        }
        break;

      case 'decline':
        if (!gameId) break;
        try {
          await declineTrade(gameId);
          onActionComplete?.('decline');
        } catch (err) {
          console.error('Decline failed:', err);
          onActionFailed?.('decline', err);
        }
        break;

      case 'stall':
        if (!gameId) break;
        try {
          await stallTrade(gameId);
          onActionComplete?.('stall');
        } catch (err) {
          console.error('Stall failed:', err);
          onActionFailed?.('stall', err);
        }
        break;

      case 'query': {
        const postIndex = typeof trade.subflowData === 'number' ? trade.subflowData : null;
        const question = queryText.trim();
        if (gameId) {
          if (!question) break;
          try {
            await sendGameQuery(gameId, question, postIndex !== null ? partnerPosts[postIndex]?._id : undefined);
            onActionComplete?.('query');
          } catch (err) {
            console.error('Query failed:', err);
          onActionFailed?.('query', err);
            break;
          }
        }
        onQuerySubmit?.({ postIndex, question });
        break;
      }

      case 'subtract': {
        const postId = playerPosts[trade.selectedPosts[0]]?._id;
        if (!gameId || !postId) break;
        try {
          await subtractPost(gameId, postId);
          onActionComplete?.('subtract');
        } catch (err) {
          console.error('Subtract failed:', err);
          onActionFailed?.('subtract', err);
        }
        break;
      }

      case 'where': {
        const location = trade.subflowData as Locations | null;
        if (!location) break;
        if (gameId) {
          try {
            await proposeLocation(gameId, location.id);
            onActionComplete?.('where');
          } catch (err) {
            console.error('Where failed:', err);
            onActionFailed?.('where', err);
            break;
          }
        }
        onLocationProposed?.(location);
        break;
      }

      case 'offer':
      case 'barter':
      case 'rescind':
        onBarterSubmit?.(trade.selectedPosts);
        break;

      default:
        break;
    }

    trade.confirm();
    trade.reset();
  };

  const sharedDeckProps = {
    cardWidth: DECK_WIDTH,
    enabled: true,
    onHorizontalGestureStart,
    onGestureEnd,
    showDateTime,
    showLocation,
    
  };

  return (
    <View style={styles.modalContent} pointerEvents="box-none">
      <View style={deckStyles.column}>
        {/* Partner / Player switcher bar */}
        <View style={deckStyles.itemCountRow}>
          <TouchableOpacity style={styles.partnerBar} onPress={handleSwitchDecks}>
            <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, !showingPlayer && styles.activeText]}>0{partnerPosts.length}</Text>
            <FontAwesome6 name="arrows-rotate" size={24} color={!showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playerBar} onPress={handleSwitchDecks}>
            <FontAwesome6 name="circle-user" size={24} color={colors.ui.secondarydisabled} />
            <Text style={[deckStyles.countText, showingPlayer && styles.activeText]}>0{playerPosts.length}</Text>
            <FontAwesome6 name="arrows-rotate" size={24} color={showingPlayer ? colors.actions.trade : colors.ui.secondarydisabled} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.deckClipWindow}>
            <Animated.View style={[styles.decksRow, { transform: [{ translateX: slideAnim }] }]}>
              {/* Partner deck — query select mode */}
              <View style={{ width: DECK_WIDTH }}>
                <Deck
                  groups={partnerGroups}
                  {...sharedDeckProps}
                  isUser={false}
                  onTopCardChange={setPartnerTopPostIndex}
                  isQueryMode={isQueryActive}
                  querySelectedPostIndex={
                    isQueryActive && typeof trade.subflowData === 'number' ? trade.subflowData : null
                  }
                  onQueryPostTap={(postIndex) => trade.setSubflowData(postIndex)}
                />
              </View>
              {/* Player deck — barter select / where select mode */}
              <View style={{ width: DECK_WIDTH }}>
                <Deck
                  groups={playerGroups}
                  {...sharedDeckProps}
                  isUser={true}
                  onTopCardChange={setPlayerTopPostIndex}
                  isSelectMode={isBarterActive}
                  selectedPosts={trade.selectedPosts}
                  selectColor={trade.activeAction === 'subtract' ? colors.actions.counter : colors.actions.trade}
                  isLocationSelectMode={isWhereActive}
                  jumpToken={playerJumpToken}
                  jumpToCardIndex={playerLocationCardIndex}
                  onProposeLocation={(location) => trade.setSubflowData(location)}
                />
              </View>
            </Animated.View>
          </View>
        )}

        {/* Actions + turns */}
        {isExpanded && (
          <View style={styles.turnsAndButtonColumn}>
            <View style={[styles.queryRow, { marginBottom: isQueryActive ? 4 : 0 }]}>
              <TradeTurns
                turns={[]}
                isQueryOpen={isQueryActive}
                onQueryTextChange={setQueryText}
              />
            </View>
            <View style={styles.actionRow}>
              <TradeUI
                actions={visibleActions}
                onActionSelected={handleActionSelected}
                activeActionType={trade.activeAction}
                isReady={effectiveIsReady}
                selectedCount={trade.selectedPosts.length}
                topCardIsSelected={topCardIsSelected}
                isQueryMode={isQueryActive}
                queryPostSelected={isQueryActive && trade.subflowData != null}
                onQueryPostSelect={() => trade.setSubflowData(partnerTopPostIndex)}
                onQueryPostDeselect={() => trade.setSubflowData(null)}
                onActionChange={setScrolledActionType}
                turnDeadline={turnDeadline}
                filledActionType={isAddPressed ? 'add' : null}
              />
            </View>
            <View style={styles.turnsRow}>
              {pendingTurnIndex >= 0 && pendingQuery ? (
                <>
                  {/* Newer turns, then the pending question with the ANSWER
                      wheel under it, then the rest of the log. */}
                  {pendingTurnIndex > 0 && (
                    <View style={styles.logGap}>
                      <TradeTurns turns={turns.slice(0, pendingTurnIndex)} />
                    </View>
                  )}
                  <QueryAnswer
                    queryId={pendingQuery.tradeId}
                    questionTurn={turns[pendingTurnIndex]}
                    placeholder="Answer to begin your turn"
                    onAnswered={() => onActionComplete?.('answer')}
                    onFailed={err => onActionFailed?.('answer', err)}
                  />
                  {pendingTurnIndex < turns.length - 1 && (
                    <View style={styles.answerGap}>
                      <TradeTurns turns={turns.slice(pendingTurnIndex + 1)} />
                    </View>
                  )}
                </>
              ) : (
                <TradeTurns turns={turns} />
              )}
            </View>
          </View>
        )}

        {gameId && (
          <FeedDeck
            postId={addProfile ? partnerPostIds[0] ?? null : null}
            prefetchedProfile={addProfile}
            visible={isAddDeckOpen}
            onClose={() => { setIsAddDeckOpen(false); setIsAddPressed(false); }}
            addGameId={gameId}
            excludePostIds={partnerPostIds}
            onAdded={() => onActionComplete?.('add')}
            onAddFailed={err => onActionFailed?.('add', err)}
          />
        )}

        <TouchableOpacity
          style={styles.collapseBar}
          onPress={() => setIsExpanded(prev => !prev)}
        >
          <FontAwesome6 name={isExpanded ? 'angle-up' : 'angle-down'} size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  turnsAndButtonColumn: { flexDirection: 'column', width: DECK_BAR_WIDTH },
  queryRow: {},
  actionRow: {marginBottom: -2},
  turnsRow: {},
  // 4px between list elements, matching TradeTurns' own gap.
  logGap: { marginBottom: 4 },
  answerGap: { marginTop: 4 },
  partnerBar: {
    ...makeCountBar('leftCap', 'flex-start'),
  },
  playerBar: {
    ...makeCountBar('rightCap', 'flex-end'),
  },
  activeText: {
    color: colors.actions.trade,
  },
  deckClipWindow: {
    width: width,
    alignItems: 'flex-start',
  },
  decksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 26,
    zIndex: 30,
  },
  collapseBar: {
    top: 0,
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