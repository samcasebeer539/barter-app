//add verify
import { colors, globalFonts } from '../styles/globalStyles';

export type TradeActionType = 'offer' | 'trade' | 'query' | 'counter' | 'stall' | 'verify' | 'accept' | 'decline' | 'where' | 'when' | 'wait' | 'play' | 'cancel' | 'rescind';

export type TradeTurnType = 
  | 'turnOffer' 
  | 'turnTrade' 
  | 'turnCounter' 
  | 'turnQuery' 
  | 'turnAccept' 
  | 'turnStall'
  | 'turnDecline'
  | 'turnWhere'
  | 'turnWhen'
  | 'turnRescind';

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
  templateUser: string;
  templatePartner: string;
  isSent: boolean;
}

// Configuration for UI actions (used in TradeUI)
export const TRADE_ACTIONS: TradeActionConfig[] = [
  {
    text: 'OFFER',
    color: colors.actions.offer,
    hasButtons: true,
    actionType: 'offer',
    turnType: 'turnOffer',
  },
  {
    text: 'BARTER',
    color: colors.actions.trade,
    hasButtons: true,
    actionType: 'trade',
    turnType: 'turnTrade',
  },
  {
    text: 'QUERY',
    color: colors.actions.query,
    hasButtons: true,
    actionType: 'query',
    turnType: 'turnQuery',
  },
  {
    text: 'COUNTER',
    color: colors.actions.counter,
    hasButtons: true,
    actionType: 'counter',
    turnType: 'turnCounter',
  },
  {
    text: 'VERIFY',
    color: colors.actions.verify,
    hasButtons: true,
    actionType: 'verify',
    turnType: 'turnWhen',
  },
  {
    text: 'STALL',
    color: colors.actions.time,
    hasButtons: true,
    actionType: 'stall',
    turnType: 'turnStall',
  },
  
  {
    text: '*AGREE',
    color: colors.actions.accept,
    hasButtons: true,
    actionType: 'accept',
    turnType: 'turnAccept',
  },
  {
    text: 'WITHDRAW',
    color: colors.actions.decline,
    hasButtons: true,
    actionType: 'decline',
    turnType: 'turnDecline',
  },
  {
    text: 'WHERE',
    color: colors.actions.location,
    hasButtons: true,
    actionType: 'where',
    turnType: 'turnWhere',
  },
  {
    text: 'WHEN',
    color: colors.actions.time,
    hasButtons: true,
    actionType: 'when',
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
  },
  {
    text: 'RESCIND',
    color: colors.actions.rescind,
    hasButtons: true,
    actionType: 'rescind',
    turnType: 'turnRescind',
  },

];

// Configuration for turn display (used in ActiveTrade)
export const TURN_DISPLAY: Record<TradeTurnType, TurnDisplayConfig> = {
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
    templateUser: 'You asked: ',
    templatePartner: '{user} asked: this is a question about this item and its going to go onto the second line at least',
    isSent: false,
  },
  turnAccept: {
    actionText: 'ACCEPTED',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    templateUser: 'You agreed*',
    templatePartner: '{user} agreed*',
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
    isSent: true,
  },
  turnRescind: {
    actionText: 'RESCIND',
    colorStyle: { color: colors.actions.rescind, fontFamily: globalFonts.extrabold },
    templateUser: 'You rescinded',
    templatePartner: '{user} rescinded',
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
