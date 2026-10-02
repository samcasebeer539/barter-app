import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Deck, { DeckGroup } from './Deck';

import { colors } from '../styles/globalStyles';
import TradeUI, { TradeAction } from './TradeActions';
import TradeTurns, { TradeTurn } from './TradeTurns';
import { TradeActionConfig, TradeActionType, getActionConfig } from '../config/tradeConfig';
import { deckStyles, makeCountBar, barRadius, DECK_BAR_WIDTH } from '../styles/deckStyles';
import { Post, Locations, User } from '@/types/index';
import { acceptTrade, declineTrade, stallTrade } from '@/services/tradeService';
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
  onCounterSubmit?: (value: number) => void;
  // Fired after a move this deck sent succeeds, so the screen can refetch
  // the game (new turn owner, new phase, new turn in the log).
  onActionComplete?: (actionType: TradeActionType) => void;
  gameId?: string;
  // Whose move it is. When false, the wheel shows only WAIT. Defaults to
  // true so decks without live game data (e.g. mock decks) stay usable.
  isMyTurn?: boolean;
  // ISO timestamp the active player's turn runs out. Shown on DECLINE / WAIT.
  turnDeadline?: string | null;
  // Fired once the deadline has passed. The server auto-declines overdue
  // games when they're next loaded, so the screen should refetch.
  onTurnExpired?: () => void;
}

// Wait this long past the deadline before refetching, so a phone clock
// running slightly fast doesn't ask the server before it agrees time is up.
const EXPIRY_GRACE_MS = 2000;

const DECK_WIDTH = Math.min(width - 36, 400);

const MULTI_SELECT_ACTIONS: TradeActionType[] = ['offer', 'barter', 'rescind'];

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
  onCounterSubmit,
  onActionComplete,
  gameId,
  isMyTurn = true,
  turnDeadline = null,
  onTurnExpired,
}: TradeDeckProps) {
  const trade = useTradeAction();

  // On your turn: every action except WAIT. Off your turn: WAIT only.
  const visibleActions = useMemo(() => {
    if (isMyTurn) return actions.filter(a => a.actionType !== 'wait');
    return WAIT_ACTION ? [WAIT_ACTION] : [];
  }, [actions, isMyTurn]);

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

  const partnerGroups: DeckGroup[] = useMemo(
    () => [{ user: partnerUser, posts: partnerPosts }],
    [partnerUser, partnerPosts]
  );
  const playerGroups: DeckGroup[] = useMemo(
    () => [{ user: playerUser, posts: playerPosts }],
    [playerUser, playerPosts]
  );

  const handleSwitchDecks = () => {
    const toValue = showingPlayer ? -12 : -(DECK_WIDTH) - 38;
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, tension: 60, friction: 10 }).start();
    setShowingPlayer(prev => !prev);
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

  // query's readiness can come from either of two independent signals —
  // a partner post selected (trade.subflowData, inside the hook) or a
  // question typed (queryText, kept local — see note above). The hook
  // only knows about the first; this folds in the second.
  const effectiveIsReady =
    trade.activeAction === 'query'
      ? trade.isReady || queryText.trim().length > 0
      : trade.isReady;

  // Clear the locally-held question text whenever the query subflow ends,
  // so a stale draft doesn't leak into the next query attempt.
  useEffect(() => {
    if (!isQueryActive) setQueryText('');
  }, [isQueryActive]);

  const handleActionSelected = (action: TradeAction) => {
    const { actionType, subAction } = action;

    // Off-turn the wheel only shows WAIT, which is display-only. This guard
    // backs that up in case anything else tries to arm a move.
    if (!isMyTurn) return;

    // Arrow / confirm tap always sends 'select' for the currently-active action.
    if (subAction === 'select' && trade.activeAction === actionType) {
      handleConfirm();
      return;
    }

    if (actionType === 'counter') {
      if (subAction === 'add') {
        trade.selectAction(actionType);
        trade.adjustCounter(1);
      } else if (subAction === 'remove') {
        trade.selectAction(actionType);
        trade.adjustCounter(-1);
      } else {
        trade.selectAction(actionType);
      }
      return;
    }

    if (MULTI_SELECT_ACTIONS.includes(actionType)) {
      trade.selectAction(actionType, playerTopPostIndex);
      return;
    }

    // Simple actions (accept, acceptFinal, decline, stall, verify, wait, play)
    // and subflow actions (query, where, when) both just arm on icon tap.
    trade.selectAction(actionType);
  };

  const handleConfirm = async () => {
    if (!isMyTurn || !effectiveIsReady || !trade.activeAction) return;

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
        }
        break;

      case 'decline':
        if (!gameId) break;
        try {
          await declineTrade(gameId);
          onActionComplete?.('decline');
        } catch (err) {
          console.error('Decline failed:', err);
        }
        break;

      case 'stall':
        if (!gameId) break;
        try {
          await stallTrade(gameId);
          onActionComplete?.('stall');
        } catch (err) {
          console.error('Stall failed:', err);
        }
        break;

      case 'query':
        onQuerySubmit?.({
          postIndex: typeof trade.subflowData === 'number' ? trade.subflowData : null,
          question: queryText,
        });
        break;

      case 'where':
        if (trade.subflowData) onLocationProposed?.(trade.subflowData as Locations);
        break;

      case 'counter':
        onCounterSubmit?.(trade.counterValue);
        break;

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
                  selectColor={colors.actions.trade}
                  isLocationSelectMode={isWhereActive}
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
              />
            </View>
            <View style={styles.turnsRow}>
              <TradeTurns turns={turns} />
            </View>
          </View>
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