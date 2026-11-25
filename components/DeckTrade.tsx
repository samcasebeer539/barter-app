import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck, { DeckGroup } from './Deck';

import { colors, globalFonts } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import QueryAnswer from './QueryAnswer';
import StarPicker from './StarPicker';
import FeedDeck from './DeckFeed';
import { getFeedProfile } from '@/services/feedService';
import { FeedProfile } from '@/types/index';
import { TradeActionConfig, TradeActionType, getActionConfig } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post, Locations, User } from '@/types/index';
import { acceptTrade, declineTrade, stallTrade, sendGameQuery, proposeLocation, proposeTime, subtractPost, getLatestProposals, submitReview } from '@/services/tradeService';
import { ProposedTime } from './CardDateTime';
import { useTradeAction } from '../hooks/useTradeAction';
import { useStableCallback } from '../hooks/useStableCallback';

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
  // Whether this deck can show date / location cards at all (the close tab).
  // Within that, a player's card only appears while they hold the latest
  // WHEN / WHERE proposal, or while they're picking one.
  showDateTime?: boolean;
  showLocation?: boolean;
  // The game's raw turns, used to find the standing WHERE / WHEN proposals.
  // Pass the same array reference between renders (it feeds the decks'
  // card lists, and a new array would reset their swipe positions).
  rawTurns?: any[];
  // The game's stage. In 'agreed' (both players accepted the meetup) the
  // deal box sits atop the log and REVIEW is the only action.
  phase?: string;
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
  // Optional: let the screen control open/closed (e.g. one deck open at a time).
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

// Wait this long past the deadline before refetching, so a phone clock
// running slightly fast doesn't ask the server before it agrees time is up.
const EXPIRY_GRACE_MS = 2000;

const DECK_WIDTH = Math.min(width - 36, 400);

const MULTI_SELECT_ACTIONS: TradeActionType[] = ['offer', 'barter', 'rescind', 'subtract'];

const WAIT_ACTION = getActionConfig('wait');
const REVIEW_ACTION = getActionConfig('review');

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
  rawTurns,
  phase,
  expanded,
  onToggleExpanded,
}: TradeDeckProps) {
  const trade = useTradeAction();

  // Your turn begins once any question the partner asked is answered. Until
  // then (and whenever it's not your turn) the wheel shows WAIT only.
  // Once the deal is agreed there are no turns: both players get REVIEW.
  const isAgreed = phase === 'agreed';
  // Finished trades (accepted or declined) are read-only: log and decks, no wheel.
  const isHistory = phase === 'completed' || phase === 'declined';
  const mustAnswer = !isAgreed && !isHistory && isMyTurn && !!pendingQuery;
  const canPlay = !isHistory && (isAgreed || (isMyTurn && !mustAnswer));

  // Standing proposals: the latest WHERE and the latest WHEN, whoever made
  // them. Each shows only on its maker's card.
  const proposals = useMemo(
    () => getLatestProposals(rawTurns ?? [], playerUser._id ?? ''),
    [rawTurns, playerUser._id]
  );
  const hasPlaceAndTime = !!proposals.where && !!proposals.when;

  // Each player reviews once; after that it's WAIT until the other does.
  const hasReviewed = useMemo(
    () => (rawTurns ?? []).some(t => t.type === 'review' && t.actor_id === playerUser._id),
    [rawTurns, playerUser._id]
  );

  const visibleActions = useMemo(() => {
    if (isAgreed) {
      const action = hasReviewed ? WAIT_ACTION : REVIEW_ACTION;
      return action ? [action] : [];
    }
    if (canPlay) {
      return actions.filter(a =>
        a.actionType !== 'wait' &&
        a.actionType !== 'answer' &&
        a.actionType !== 'review' &&
        // SUBTRACT only when you'd still have an item left in the trade.
        (a.actionType !== 'subtract' || playerPosts.length > 1) &&
        // ACCEPT (the meetup) only once there's a place and a time.
        (a.actionType !== 'acceptFinal' || hasPlaceAndTime)
      );
    }
    return WAIT_ACTION ? [WAIT_ACTION] : [];
  }, [actions, canPlay, isAgreed, hasReviewed, playerPosts.length, hasPlaceAndTime]);

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

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = expanded ?? internalExpanded;
  const toggleExpanded = () => (onToggleExpanded ? onToggleExpanded() : setInternalExpanded(prev => !prev));
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

  const myLocation = proposals.where?.isUser ? proposals.where.location : null;
  const theirLocation = proposals.where && !proposals.where.isUser ? proposals.where.location : null;
  const myTime = proposals.when?.isUser ? proposals.when.label : null;
  const theirTime = proposals.when && !proposals.when.isUser ? proposals.when.label : null;

  // Your saved locations are what WHERE picks from.
  const partnerGroups: DeckGroup[] = useMemo(
    () => [{ user: partnerUser, posts: partnerPosts, proposedLocation: theirLocation, proposedTime: theirTime }],
    [partnerUser, partnerPosts, theirLocation, theirTime]
  );
  const playerGroups: DeckGroup[] = useMemo(
    () => [{
      user: playerUser, posts: playerPosts, locations: playerUser.locations ?? [],
      proposedLocation: myLocation, proposedTime: myTime,
    }],
    [playerUser, playerPosts, myLocation, myTime]
  );

  const slideToDeck = (toPlayer: boolean) => {
    const toValue = toPlayer ? -(DECK_WIDTH) - 38 : -12;
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 60, friction: 10 }).start();
    setShowingPlayer(toPlayer);
  };
  const handleSwitchDecks = () => slideToDeck(!showingPlayer);

  // WHERE brings the player's location card to the top of their deck. Deck
  // order is user card, date card (if shown), location card, then posts.
  // WHEN does the same with the date/time card, which comes just before it.
  // These are positions once the action is armed (its card is then shown).
  const playerDateTimeCardIndex = playerUser ? 1 : 0;
  const playerLocationCardIndex = playerDateTimeCardIndex + (showDateTime && myTime ? 1 : 0);
  const [playerJumpToken, setPlayerJumpToken] = useState<number | undefined>(undefined);
  const [playerJumpIndex, setPlayerJumpIndex] = useState(playerDateTimeCardIndex);
  const showPlayerCard = (index: number) => {
    if (!showingPlayer) slideToDeck(true);
    setPlayerJumpIndex(index);
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
  // REVIEW: stars (trade.subflowData, 1-5) plus optional text (queryText).
  const isReviewActive =
    trade.activeAction === 'review' &&
    scrolledActionType === 'review' &&
    trade.phase !== 'idle' &&
    trade.phase !== 'confirmed';
  const reviewRating = isReviewActive && typeof trade.subflowData === 'number' ? trade.subflowData : null;
  const isWhenActive =
    trade.activeAction === 'when' &&
    scrolledActionType === 'when' &&
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

  // While QUERY is open the question is about the other player's post on
  // top, following their deck as you swipe. With their user or location card
  // on top, or your own deck showing, it isn't about a post (still allowed).
  const queryPostIndex = isQueryActive && !showingPlayer ? partnerTopPostIndex : null;

  // Clear the locally-held question text whenever the query subflow ends,
  // so a stale draft doesn't leak into the next query attempt.
  useEffect(() => {
    if (!isQueryActive && !isReviewActive) setQueryText('');
  }, [isQueryActive, isReviewActive]);

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

    if (actionType === 'where' || actionType === 'when') {
      const wasArmed = trade.activeAction === actionType;
      trade.selectAction(actionType); // a second tap disarms
      if (!wasArmed) {
        showPlayerCard(actionType === 'where' ? playerLocationCardIndex : playerDateTimeCardIndex);
      }
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
        const postIndex = !showingPlayer ? partnerTopPostIndex : null;
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

      case 'review': {
        if (!gameId || typeof trade.subflowData !== 'number') break;
        try {
          await submitReview(gameId, trade.subflowData, queryText.trim());
          onActionComplete?.('review');
        } catch (err) {
          console.error('Review failed:', err);
          onActionFailed?.('review', err);
        }
        break;
      }

      case 'when': {
        const time = trade.subflowData as ProposedTime | null;
        if (!gameId || !time) break;
        try {
          await proposeTime(gameId, time.proposedAt, time.label);
          onActionComplete?.('when');
        } catch (err) {
          console.error('When failed:', err);
          onActionFailed?.('when', err);
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

  // A player's date / location card shows only while they hold the latest
  // proposal of that kind; yours also shows while you're picking one.
  const playerShowsDateTime = showDateTime && (isWhenActive || !!myTime);
  const playerShowsLocation = showLocation && (isWhereActive || !!myLocation);
  const partnerShowsDateTime = showDateTime && !!theirTime;
  const partnerShowsLocation = showLocation && !!theirLocation;

  // Stable for the (memoized) decks: post taps, picked locations and times
  // all go to the action's subflow data.
  const setTradeSubflowData = useStableCallback((data: unknown) => trade.setSubflowData(data));

  const sharedDeckProps = {
    cardWidth: DECK_WIDTH,
    enabled: true,
    onHorizontalGestureStart,
    onGestureEnd,

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
                  showDateTime={partnerShowsDateTime}
                  showLocation={partnerShowsLocation}
                  isUser={false}
                  onTopCardChange={setPartnerTopPostIndex}
                  isQueryMode={isQueryActive}
                  querySelectedPostIndex={queryPostIndex}
                  onQueryPostTap={setTradeSubflowData}
                />
              </View>
              {/* Player deck — barter select / where select mode */}
              <View style={{ width: DECK_WIDTH }}>
                <Deck
                  groups={playerGroups}
                  {...sharedDeckProps}
                  showDateTime={playerShowsDateTime}
                  showLocation={playerShowsLocation}
                  isUser={true}
                  onTopCardChange={setPlayerTopPostIndex}
                  isSelectMode={isBarterActive}
                  selectedPosts={trade.selectedPosts}
                  selectColor={trade.activeAction === 'subtract' ? colors.actions.counter : colors.actions.trade}
                  isLocationSelectMode={isWhereActive}
                  isTimeSelectMode={isWhenActive}
                  onProposeTime={setTradeSubflowData}
                  jumpToken={playerJumpToken}
                  jumpToCardIndex={playerJumpIndex}
                  onProposeLocation={setTradeSubflowData}
                />
              </View>
            </Animated.View>
          </View>
        )}

        {/* Actions + turns */}
        {isExpanded && (
          <View style={styles.turnsAndButtonColumn}>
            {!isHistory && (<>
            <View style={[styles.queryRow, { marginBottom: isQueryActive || isReviewActive ? 4 : 0 }]}>
              {isReviewActive && (
                <View style={styles.starGap}>
                  <StarPicker rating={reviewRating} onChange={n => trade.setSubflowData(n)} />
                </View>
              )}
              <TradeTurns
                turns={[]}
                isQueryOpen={isQueryActive || isReviewActive}
                onQueryTextChange={setQueryText}
                queryPlaceholder={isReviewActive ? 'Write a review (optional)' : undefined}
                queryColor={isReviewActive ? colors.actions.review : undefined}
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
                queryPostSelected={queryPostIndex !== null}
                onQueryPostSelect={() => {}}
                onQueryPostDeselect={() => {}}
                // SUBTRACT picks your top card (ADD opens their feed deck instead).
                blockedActionTypes={playerTopPostIndex === null ? ['subtract'] : []}
                onActionChange={setScrolledActionType}
                turnDeadline={turnDeadline}
                filledActionType={isAddPressed ? 'add' : null}
                noTurnClock={isAgreed}
              />
            </View>
            </>)}
            <View style={styles.turnsRow}>
              {(isAgreed || phase === 'completed') && (
                <View style={styles.dealBox}>
                  
                  <Text style={styles.dealLine}>
                    You give: {playerPosts.map(p => p.name).join(', ') || '—'}
                  </Text>
                  <Text style={styles.dealLine}>
                    You get: {partnerPosts.map(p => p.name).join(', ') || '—'}
                  </Text>
                  <Text style={styles.dealLine}>
                    Where: {proposals.where
                      ? `${proposals.where.location.name}${proposals.where.location.description ? ` (${proposals.where.location.description})` : ''}`
                      : '—'}
                  </Text>
                  <Text style={styles.dealLine}>
                    When: {proposals.when?.label ?? '—'}
                  </Text>
                  <Text style={styles.dealLine}>
                    With: {[partnerUser.first_name, partnerUser.last_name].filter(Boolean).join(' ')}
                  </Text>
                </View>
              )}
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
          onPress={toggleExpanded}
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
  // Deal summary atop the log once both players accept the meetup:
  // rectangular, in the app's main color, white text.
  // Same padding and text as TradeTurns' rows (bold 16, 10px sides), in
  // white on the app's main color.
  dealBox: {
    backgroundColor: colors.ui.secondary,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 10,
    marginBottom: 4,
  },
  dealLine: {
    color: colors.text.white,
    fontFamily: globalFonts.bold,
    fontSize: 16,
  },
  // 4px between the star box and the review text box.
  starGap: { marginBottom: 4 },
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