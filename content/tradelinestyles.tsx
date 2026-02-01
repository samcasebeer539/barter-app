
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';


export const TRADE_STYLES = {
  actions: {
    offer: {
      color: colors.actions.offer,
      fontFamily: globalFonts.bold
    },
    trade: {
      color: colors.actions.trade,
      fontFamily: globalFonts.bold
    },
    counteroffer: {
      color: colors.actions.counter,
      fontFamily: globalFonts.bold
    },
    question: {
      color: colors.actions.query,
      fontFamily: globalFonts.bold
    },
    accepted: {
      color: colors.actions.accept,
      fontFamily: globalFonts.bold
    },
    declined: {
      color: colors.actions.decline,
      fontFamily: globalFonts.bold
    },
  },
  text: {
    question: {
      color: '#ffffff',
      fontFamily: globalFonts.regular
    },
    answer: {
      color: colors.actions.query,
      fontFamily: globalFonts.regular
    },
  },
};