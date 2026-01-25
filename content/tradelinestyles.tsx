import { TextStyle } from 'react-native';

export const TRADE_STYLES = {
  actions: {
    offer: {
      color: '#3B82F6',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    trade: {
      color: '#FFA600',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    counteroffer: {
      color: '#FF3B81',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    question: {
      color: '#a73bff',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    accepted: {
      color: '#00eb00',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
    declined: {
      color: '#ff3b3b',
      fontWeight: '600' as TextStyle['fontWeight'],
    },
  },
  text: {
    question: {
      color: '#ffffff',
    },
    answer: {
      color: '#a73bff',
    },
  },
};