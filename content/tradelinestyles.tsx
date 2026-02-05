
import { defaultTextStyle, globalFonts, colors } from '../styles/globalStyles';


export const TRADE_STYLES = {
  actions: {
    offer: {
      color: colors.actions.offer,
      fontFamily: globalFonts.extrabold
    },
    trade: {
      color: colors.actions.trade,
      fontFamily: globalFonts.extrabold
    },
    counteroffer: {
      color: colors.actions.counter,
      fontFamily: globalFonts.extrabold
    },
    question: {
      color: colors.actions.query,
      fontFamily: globalFonts.extrabold
    },
    accepted: {
      color: colors.actions.accept,
      fontFamily: globalFonts.extrabold
    },
    declined: {
      color: colors.actions.decline,
      fontFamily: globalFonts.extrabold
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