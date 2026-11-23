// hooks/useTradeAction.ts
import { useReducer, useCallback } from 'react';
import { TradeActionType } from '../config/tradeConfig';

// Actions where progress is "select N of my own posts"
const MULTI_SELECT_ACTIONS: TradeActionType[] = ['offer', 'barter', 'rescind', 'add', 'subtract'];

// Select actions that pick exactly one post: selecting another replaces it.
const SINGLE_SELECT_ACTIONS: TradeActionType[] = ['add', 'subtract'];

// Actions whose button tap toggles something other than the action itself
// (QUERY's button toggles the post the question is about), so tapping it
// again doesn't disarm.
const NON_TOGGLE_ACTIONS: TradeActionType[] = ['query'];

// Actions that need an intermediate step (typed text, a picked location, etc.)
// before they're ready to confirm
const SUBFLOW_ACTIONS: TradeActionType[] = ['query', 'answer', 'where', 'when', 'review'];

export type TradePhase = 'idle' | 'subflow' | 'ready' | 'confirmed';

export interface TradeActionState {
  activeAction: TradeActionType | null;
  phase: TradePhase;
  selectedPosts: number[];
  subflowData: unknown;
}

type Event =
  | { type: 'SELECT_ACTION'; actionType: TradeActionType; topPostIndex: number | null }
  | { type: 'TOGGLE_POST'; postIndex: number }
  | { type: 'SET_SUBFLOW_DATA'; data: unknown }
  | { type: 'CONFIRM' }
  | { type: 'RESET' };

const initialState: TradeActionState = {
  activeAction: null,
  phase: 'idle',
  selectedPosts: [],
  subflowData: null,
};

function isReady(state: TradeActionState): boolean {
  if (!state.activeAction) return false;
  if (MULTI_SELECT_ACTIONS.includes(state.activeAction)) {
    return state.selectedPosts.length > 0;
  }
  if (SUBFLOW_ACTIONS.includes(state.activeAction)) {
    return state.subflowData != null && state.subflowData !== '';
  }
  // Simple one-tap actions: accept, acceptFinal, decline, stall, wait, play
  return true;
}

function reducer(state: TradeActionState, event: Event): TradeActionState {
  switch (event.type) {
    case 'SELECT_ACTION': {
      const isNewAction = state.activeAction !== event.actionType;

      // Tapping an armed action's button again disarms it. Select actions
      // are the exception: their button toggles the top card instead.
      if (
        !isNewAction &&
        !MULTI_SELECT_ACTIONS.includes(event.actionType) &&
        !NON_TOGGLE_ACTIONS.includes(event.actionType)
      ) {
        return initialState;
      }
      const base: TradeActionState = isNewAction
        ? { ...initialState, activeAction: event.actionType }
        : state;

      if (MULTI_SELECT_ACTIONS.includes(event.actionType)) {
        // Tapping the action button toggles whatever post is currently on top
        if (event.topPostIndex == null) {
          return { ...base, phase: isReady(base) ? 'ready' : 'idle' };
        }
        const exists = base.selectedPosts.includes(event.topPostIndex);
        const selectedPosts = exists
          ? base.selectedPosts.filter(i => i !== event.topPostIndex)
          : SINGLE_SELECT_ACTIONS.includes(event.actionType)
            ? [event.topPostIndex]
            : [...base.selectedPosts, event.topPostIndex];
        const next = { ...base, selectedPosts };
        return { ...next, phase: isReady(next) ? 'ready' : 'idle' };
      }

      if (SUBFLOW_ACTIONS.includes(event.actionType)) {
        return { ...base, phase: 'subflow' };
      }

      // Simple action: one tap is enough to arm the confirm arrow
      return { ...base, phase: 'ready' };
    }

    case 'TOGGLE_POST': {
      if (!state.activeAction || !MULTI_SELECT_ACTIONS.includes(state.activeAction)) {
        return state;
      }
      const exists = state.selectedPosts.includes(event.postIndex);
      const selectedPosts = exists
        ? state.selectedPosts.filter(i => i !== event.postIndex)
        : SINGLE_SELECT_ACTIONS.includes(state.activeAction)
          ? [event.postIndex]
          : [...state.selectedPosts, event.postIndex];
      const next = { ...state, selectedPosts };
      return { ...next, phase: isReady(next) ? 'ready' : 'idle' };
    }

    case 'SET_SUBFLOW_DATA': {
      if (!state.activeAction || !SUBFLOW_ACTIONS.includes(state.activeAction)) {
        return state;
      }
      const next = { ...state, subflowData: event.data };
      return { ...next, phase: isReady(next) ? 'ready' : 'subflow' };
    }

    case 'CONFIRM':
      if (state.phase !== 'ready') return state;
      return { ...state, phase: 'confirmed' };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useTradeAction() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const selectAction = useCallback(
    (actionType: TradeActionType, topPostIndex: number | null = null) =>
      dispatch({ type: 'SELECT_ACTION', actionType, topPostIndex }),
    []
  );

  const togglePost = useCallback(
    (postIndex: number) => dispatch({ type: 'TOGGLE_POST', postIndex }),
    []
  );

  const setSubflowData = useCallback(
    (data: unknown) => dispatch({ type: 'SET_SUBFLOW_DATA', data }),
    []
  );

  const confirm = useCallback(() => dispatch({ type: 'CONFIRM' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    activeAction: state.activeAction,
    phase: state.phase,
    selectedPosts: state.selectedPosts,
    subflowData: state.subflowData,
    isReady: state.phase === 'ready',
    isSubflow: state.phase === 'subflow',
    isConfirmed: state.phase === 'confirmed',
    selectAction,
    togglePost,
    setSubflowData,
    confirm,
    reset,
  };
}