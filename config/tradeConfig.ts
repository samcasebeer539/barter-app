//add verify
import { colors, globalFonts } from '../styles/globalStyles';

export type TradeActionType = 'query' | 'counter' | 'stall' | 'verify' | 'accept' | 'decline' | 'where' | 'when';

export type TradeTurnType = 
  | 'sentOffer' 
  | 'receivedTrade' 
  | 'sentCounteroffer' 
  | 'receivedQuestion' 
  | 'youAccepted' 
  | 'theyAccepted'
  | 'sentQuery'
  | 'sentCounter'
  | 'sentStall'
  | 'sentAccept'
  | 'sentDecline'
  | 'sentWhere'
  | 'sentWhen';

export interface TradeActionConfig {
  text: string;
  color: string;
  hasButtons: boolean;
  actionType: TradeActionType;
  turnType?: TradeTurnType;
}

export interface TurnDisplayConfig {
  actionText: string;
  colorStyle: { color: string; fontFamily: string };
  template: string;
  isSent: boolean;
}

// Configuration for UI actions (used in TradeUI)
export const TRADE_ACTIONS: TradeActionConfig[] = [
  {
    text: 'QUERY',
    color: colors.actions.query,
    hasButtons: true,
    actionType: 'query',
    turnType: 'sentQuery',
  },
  {
    text: 'COUNTER',
    color: colors.actions.counter,
    hasButtons: true,
    actionType: 'counter',
    turnType: 'sentCounter',
  },
  {
    text: 'VERIFY',
    color: colors.actions.verify,
    hasButtons: true,
    actionType: 'verify',
    turnType: 'sentWhen',
  },
  {
    text: 'STALL',
    color: colors.actions.time,
    hasButtons: false,
    actionType: 'stall',
    turnType: 'sentStall',
  },
  
  {
    text: '*ACCEPT',
    color: colors.actions.accept,
    hasButtons: false,
    actionType: 'accept',
    turnType: 'sentAccept',
  },
  {
    text: 'DECLINE',
    color: colors.actions.decline,
    hasButtons: false,
    actionType: 'decline',
    turnType: 'sentDecline',
  },
  {
    text: 'WHERE',
    color: colors.actions.location,
    hasButtons: true,
    actionType: 'where',
    turnType: 'sentWhere',
  },
  {
    text: 'WHEN',
    color: colors.actions.time,
    hasButtons: true,
    actionType: 'when',
    turnType: 'sentWhen',
  },

];

// Configuration for turn display (used in ActiveTrade)
export const TURN_DISPLAY: Record<TradeTurnType, TurnDisplayConfig> = {
  sentOffer: {
    actionText: 'OFFER',
    colorStyle: { color: colors.actions.offer, fontFamily: globalFonts.extrabold },
    template: 'You sent {action} on "{item}"',
    isSent: true,
  },
  receivedTrade: {
    actionText: 'TRADE',
    colorStyle: { color: colors.actions.trade, fontFamily: globalFonts.extrabold },
    template: '{user} proposed {action} for "{item}"',
    isSent: false,
  },
  sentCounteroffer: {
    actionText: 'COUNTERED',
    colorStyle: { color: colors.actions.counter, fontFamily: globalFonts.extrabold },
    template: 'You {action}, adding "{item}"',
    isSent: true,
  },
  receivedQuestion: {
    actionText: 'QUESTION',
    colorStyle: { color: colors.actions.query, fontFamily: globalFonts.extrabold },
    template: '{user} asked {action}',
    isSent: false,
  },
  youAccepted: {
    actionText: 'ACCEPTED',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    template: 'You {action}',
    isSent: true,
  },
  theyAccepted: {
    actionText: 'ACCEPTED',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    template: '{user} {action}',
    isSent: false,
  },
  sentQuery: {
    actionText: 'QUERY',
    colorStyle: { color: colors.actions.query, fontFamily: globalFonts.extrabold },
    template: 'You asked {action}',
    isSent: true,
  },
  sentCounter: {
    actionText: 'COUNTER',
    colorStyle: { color: colors.actions.counter, fontFamily: globalFonts.extrabold },
    template: 'You proposed {action}',
    isSent: true,
  },
  sentStall: {
    actionText: 'STALL',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    template: 'You {action}',
    isSent: true,
  },
  sentAccept: {
    actionText: 'ACCEPT',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    template: 'You {action}',
    isSent: true,
  },
  sentDecline: {
    actionText: 'DECLINE',
    colorStyle: { color: colors.actions.decline, fontFamily: globalFonts.extrabold },
    template: 'You {action}',
    isSent: true,
  },
  sentWhere: {
    actionText: 'WHERE',
    colorStyle: { color: colors.actions.location, fontFamily: globalFonts.extrabold },
    template: 'You suggested {action}',
    isSent: true,
  },
  sentWhen: {
    actionText: 'WHEN',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    template: 'You proposed {action}',
    isSent: true,
  },
};

// Helper function to get turn config by type
export const getTurnConfig = (turnType: TradeTurnType): TurnDisplayConfig | null => {
  return TURN_DISPLAY[turnType] || null;
};

// Helper function to get action config by type
export const getActionConfig = (actionType: TradeActionType): TradeActionConfig | null => {
  return TRADE_ACTIONS.find(action => action.actionType === actionType) || null;
};
