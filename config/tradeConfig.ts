//add verify
import { colors, globalFonts } from '../styles/globalStyles';

<<<<<<< HEAD
export type TradeActionType = 'query' | 'counter' | 'stall' | 'verify' | 'accept' | 'decline' | 'where' | 'when' | 'wait' | 'play' | 'cancel';

export type TradeTurnType = 
  | 'turnOffer' 
  | 'turnTrade' 
  | 'turnCounter' 
  | 'turnQuery' 
  | 'turnAccept' 
  | 'turnStall'
  | 'turnDecline'
  | 'turnWhere'
  | 'turnWhen';
=======
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
>>>>>>> origin/auth

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
<<<<<<< HEAD
  templateUser: string;
  templatePartner: string;
=======
  template: string;
>>>>>>> origin/auth
  isSent: boolean;
}

// Configuration for UI actions (used in TradeUI)
export const TRADE_ACTIONS: TradeActionConfig[] = [
  {
    text: 'QUERY',
    color: colors.actions.query,
    hasButtons: true,
    actionType: 'query',
<<<<<<< HEAD
    turnType: 'turnQuery',
=======
    turnType: 'sentQuery',
>>>>>>> origin/auth
  },
  {
    text: 'COUNTER',
    color: colors.actions.counter,
    hasButtons: true,
    actionType: 'counter',
<<<<<<< HEAD
    turnType: 'turnCounter',
=======
    turnType: 'sentCounter',
>>>>>>> origin/auth
  },
  {
    text: 'VERIFY',
    color: colors.actions.verify,
    hasButtons: true,
    actionType: 'verify',
<<<<<<< HEAD
    turnType: 'turnWhen',
=======
    turnType: 'sentWhen',
>>>>>>> origin/auth
  },
  {
    text: 'STALL',
    color: colors.actions.time,
    hasButtons: false,
    actionType: 'stall',
<<<<<<< HEAD
    turnType: 'turnStall',
  },
  
  {
    text: '*ACCEPT',
    color: colors.actions.accept,
    hasButtons: false,
    actionType: 'accept',
    turnType: 'turnAccept',
=======
    turnType: 'sentStall',
  },
  
  {
    text: 'ACCEPT*',
    color: colors.actions.accept,
    hasButtons: false,
    actionType: 'accept',
    turnType: 'sentAccept',
>>>>>>> origin/auth
  },
  {
    text: 'DECLINE',
    color: colors.actions.decline,
    hasButtons: false,
    actionType: 'decline',
<<<<<<< HEAD
    turnType: 'turnDecline',
=======
    turnType: 'sentDecline',
>>>>>>> origin/auth
  },
  {
    text: 'WHERE',
    color: colors.actions.location,
    hasButtons: true,
    actionType: 'where',
<<<<<<< HEAD
    turnType: 'turnWhere',
=======
    turnType: 'sentWhere',
>>>>>>> origin/auth
  },
  {
    text: 'WHEN',
    color: colors.actions.time,
    hasButtons: true,
    actionType: 'when',
<<<<<<< HEAD
    turnType: 'turnWhen',
  },
  {
    text: '11:59:43 WAIT',
    color: colors.actions.wait,
    hasButtons: true,
    actionType: 'wait',
    turnType: 'turnWhen',
  },
  {
    text: '11:59:43 PLAY',
    color: colors.actions.wait,
    hasButtons: true,
    actionType: 'play',
    turnType: 'turnWhen',
  },
  {
    text: ':29 CANCEL',
    color: colors.actions.wait,
    hasButtons: true,
    actionType: 'cancel',
    turnType: 'turnWhen',
=======
    turnType: 'sentWhen',
>>>>>>> origin/auth
  },

];

// Configuration for turn display (used in ActiveTrade)
export const TURN_DISPLAY: Record<TradeTurnType, TurnDisplayConfig> = {
<<<<<<< HEAD
  turnOffer: {
    actionText: 'OFFER',
    colorStyle: { color: colors.actions.offer, fontFamily: globalFonts.extrabold },
    templateUser: 'You sent offer on "{item}"',
    templatePartner: '{user} sent offer on "{item}"',
    isSent: true,
  },
  turnTrade: {
    actionText: 'TRADE',
    colorStyle: { color: colors.actions.trade, fontFamily: globalFonts.extrabold },
    templateUser: 'You proposed trade for "{item}"',
    templatePartner: '{user} proposed trade for "{item}"',
    isSent: false,
  },
  turnCounter: {
    actionText: 'COUNTERED',
    colorStyle: { color: colors.actions.counter, fontFamily: globalFonts.extrabold },
    templateUser: 'You added "Pokemon Cards"',
    templatePartner: '{user} proposed {action} for "{item}"',
    isSent: true,
  },
  turnQuery: {
    actionText: 'QUESTION',
    colorStyle: { color: colors.actions.query, fontFamily: globalFonts.extrabold },
    templateUser: 'You asked {action}',
    templatePartner: '{user} asked {action}',
    isSent: false,
  },
  turnAccept: {
    actionText: 'ACCEPTED',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    templateUser: 'You {action}',
    templatePartner: '{user} accepted',
    isSent: true,
  },
  turnDecline: {
    actionText: 'DECLINED',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    templateUser: 'You {action}',
    templatePartner: '{user} {action}',
    isSent: true,
  },
  turnStall: {
    actionText: 'STALL',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    templateUser: 'You {action}',
    templatePartner: '{user} {action}',
    isSent: true,
  },

  turnWhere: {
    actionText: 'WHERE',
    colorStyle: { color: colors.actions.location, fontFamily: globalFonts.extrabold },
    templateUser: 'You suggested {action}',
    templatePartner: '{user} suggested {action}',
    isSent: true,
  },
  turnWhen: {
    actionText: 'WHEN',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    templateUser: 'You suggested {action}',
    templatePartner: '{user} suggested {action}',
=======
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
>>>>>>> origin/auth
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
