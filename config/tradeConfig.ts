import { colors, globalFonts } from '../styles/globalStyles';

export type TradeActionType =
  | 'offer'
  | 'barter'
  | 'query'
  | 'answer'
  | 'add'
  | 'subtract'
  | 'stall'
  | 'accept'
  | 'acceptFinal'
  | 'decline'
  | 'where'
  | 'when'
  | 'wait'
  | 'review'
  | 'rescind';

export type TradeTurnType =
  | 'turnOffer'
  | 'turnBarter'
  | 'turnQuery'
  | 'turnSubtract'
  | 'turnAdd'
  | 'turnReview'
  | 'turnAnswer'
  | 'turnAccept'
  | 'turnAcceptFinal'
  | 'turnStall'
  | 'turnDecline'
  | 'turnWhere'
  | 'turnWhen';

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

// ─── UI Actions ───────────────────────────────────────────────────────────────

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
    actionType: 'barter',
    turnType: 'turnBarter',
  },
  {
    text: 'QUERY',
    color: colors.actions.query,
    hasButtons: true,
    actionType: 'query',
    turnType: 'turnQuery',
  },
  {
    text: 'ANSWER',
    color: colors.actions.query,
    hasButtons: true,
    actionType: 'answer',
    turnType: 'turnAnswer',
  },
  // ADD / REMOVE (subtract) replace COUNTER.
  {
    text: 'ADD',
    color: colors.actions.verify,
    hasButtons: true,
    actionType: 'add',
    turnType: 'turnAdd',
  },
  {
    text: 'REMOVE',
    color: colors.actions.counter,
    hasButtons: true,
    actionType: 'subtract',
    turnType: 'turnSubtract',
  },
  {
    text: 'STALL',
    color: colors.actions.time,
    hasButtons: true,
    actionType: 'stall',
    turnType: 'turnStall',
  },
  {
    text: '*ACCEPT',
    color: colors.actions.accept,
    hasButtons: true,
    actionType: 'accept',
    turnType: 'turnAccept',
  },
  {
    text: 'ACCEPT',
    color: colors.actions.accept,
    hasButtons: true,
    actionType: 'acceptFinal',
    turnType: 'turnAcceptFinal',
  },
  {
    text: 'DECLINE',
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
  // After the deal is agreed: rate the other player.
  {
    text: 'REVIEW',
    color: colors.actions.review,
    hasButtons: true,
    actionType: 'review',
    turnType: 'turnReview',
  },
  {
    text: 'WAIT',
    color: colors.ui.secondarydisabled,
    hasButtons: true,
    actionType: 'wait',
  },

  {
    text: 'RESCIND',
    color: colors.actions.rescind,
    hasButtons: true,
    actionType: 'rescind',
  },
];

// ─── Turn Display ─────────────────────────────────────────────────────────────

export const TURN_DISPLAY: Record<TradeTurnType, TurnDisplayConfig> = {
  turnOffer: {
    actionText: 'OFFER',
    colorStyle: { color: colors.actions.offer, fontFamily: globalFonts.extrabold },
    templateUser: 'You sent offer on {item}',
    templatePartner: '{user} sent offer on {item}',
    isSent: true,
  },
  turnBarter: {
    actionText: 'BARTER',
    colorStyle: { color: colors.actions.trade, fontFamily: globalFonts.extrabold },
    templateUser: 'You proposed trade for {item}',
    templatePartner: '{user} proposed trade for {item}',
    isSent: false,
  },
  turnQuery: {
    actionText: 'QUERY',
    colorStyle: { color: colors.actions.query, fontFamily: globalFonts.extrabold },
    templateUser: 'You asked: {item}',
    templatePartner: '{user} asked: {item}',
    isSent: false,
  },
  turnReview: {
    actionText: 'REVIEW',
    colorStyle: { color: colors.actions.review, fontFamily: globalFonts.extrabold },
    templateUser: 'You reviewed: {item}',
    templatePartner: '{user} reviewed: {item}',
    isSent: true,
  },
  turnAdd: {
    actionText: 'ADD',
    colorStyle: { color: colors.actions.verify, fontFamily: globalFonts.extrabold },
    templateUser: 'You added {item}',
    templatePartner: '{user} added {item}',
    isSent: true,
  },
  turnSubtract: {
    actionText: 'REMOVE',
    colorStyle: { color: colors.actions.counter, fontFamily: globalFonts.extrabold },
    templateUser: 'You removed {item}',
    templatePartner: '{user} removed {item}',
    isSent: true,
  },
  turnAnswer: {
    actionText: 'ANSWER',
    colorStyle: { color: colors.actions.query, fontFamily: globalFonts.extrabold },
    templateUser: 'You answered: {item}',
    templatePartner: '{user} answered: {item}',
    isSent: false,
  },
  turnStall: {
    actionText: 'STALL',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    templateUser: 'You stalled',
    templatePartner: '{user} stalled',
    isSent: true,
  },
  turnAccept: {
    actionText: '*ACCEPT',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    templateUser: 'You accepted*',
    templatePartner: '{user} accepted*',
    isSent: true,
  },
  turnAcceptFinal: {
    actionText: 'ACCEPT',
    colorStyle: { color: colors.actions.accept, fontFamily: globalFonts.extrabold },
    templateUser: 'You accepted',
    templatePartner: '{user} accepted',
    isSent: true,
  },
  turnDecline: {
    actionText: 'DECLINED',
    colorStyle: { color: colors.actions.decline, fontFamily: globalFonts.extrabold },
    templateUser: 'You declined',
    templatePartner: '{user} declined',
    isSent: true,
  },
  turnWhere: {
    actionText: 'WHERE',
    colorStyle: { color: colors.actions.location, fontFamily: globalFonts.extrabold },
    templateUser: 'You set location: {item}',
    templatePartner: '{user} set location: {item}',
    isSent: true,
  },
  turnWhen: {
    actionText: 'WHEN',
    colorStyle: { color: colors.actions.time, fontFamily: globalFonts.extrabold },
    templateUser: 'You set time: {item}',
    templatePartner: '{user} set time: {item}',
    isSent: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getTurnConfig = (turnType: TradeTurnType): TurnDisplayConfig | null => TURN_DISPLAY[turnType] ?? null;

export const getActionConfig = (actionType: TradeActionType): TradeActionConfig | null =>
  TRADE_ACTIONS.find(a => a.actionType === actionType) ?? null;

/** These actions, in this order (the order the wheel shows them). */
export const actionsInOrder = (types: TradeActionType[]): TradeActionConfig[] =>
  types.map(t => getActionConfig(t)).filter((a): a is TradeActionConfig => a !== null);

// The trade wheels on the barter page. WAIT is last: it only shows (alone)
// when it isn't your move.
/** BARTER tab: *ACCEPT, ADD, REMOVE, QUERY, STALL, DECLINE. */
export const BARTER_TAB_ACTIONS = actionsInOrder(['accept', 'add', 'subtract', 'query', 'stall', 'decline', 'wait']);
/** CLOSE tab: ACCEPT, WHERE, WHEN, QUERY, DECLINE. */
export const CLOSE_TAB_ACTIONS = actionsInOrder(['acceptFinal', 'where', 'when', 'query', 'decline', 'wait']);
