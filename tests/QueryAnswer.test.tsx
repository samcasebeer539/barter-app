// components/QueryAnswer.tsx: answering a question someone asked you.
// In a trade the trade deck handles a failure (onFailed); in the profile's
// QUERIES drawer the answer box shows it itself. Either way your answer stays.
import React from 'react';
import { Alert } from 'react-native';
import { render } from '@testing-library/react-native';

jest.mock('@/components/TradeActions', () => require('./helpers/deckRecorders').MockTradeActions);
jest.mock('@/components/TradeTurns', () => require('./helpers/deckRecorders').MockTradeTurns);
jest.mock('@/services/tradeService', () => ({ answerQuery: jest.fn(async () => ({})) }));

import QueryAnswer from '@/components/QueryAnswer';
import { answerQuery } from '@/services/tradeService';
import { ApiError } from '@/lib/apiError';
import { resetRecorders, wheel, press, confirm, typeQuestion } from './helpers/deckRecorders';

const question = { type: 'turnQuery' as const, user: 'Bob', item: 'Size?', isUser: false };
let alert: jest.SpyInstance;
beforeEach(() => {
  resetRecorders();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

async function answer(text: string) {
  await press('answer');
  await typeQuestion(text);
  await confirm('answer');
}

test('sends the answer, then clears the box', async () => {
  const onAnswered = jest.fn();
  await render(<QueryAnswer queryId="q1" questionTurn={question} onAnswered={onAnswered} />);
  await answer('Large');
  expect(answerQuery).toHaveBeenCalledWith('q1', 'Large');
  expect(onAnswered).toHaveBeenCalled();
  expect(wheel().activeActionType).toBeNull();
});

test('in the QUERIES drawer, a failed answer says why and keeps your answer', async () => {
  (answerQuery as jest.Mock).mockRejectedValueOnce(new ApiError('This trade has ended', 409));
  await render(<QueryAnswer queryId="q1" questionTurn={question} />);
  await answer('Large');
  expect(alert).toHaveBeenCalledWith("Your answer didn't go through", 'This trade has ended');
  expect(wheel()).toMatchObject({ activeActionType: 'answer', isReady: true });
});

test('in a trade, the trade deck is told instead (it shows the alert and reloads)', async () => {
  const err = new ApiError('This trade has ended', 409);
  (answerQuery as jest.Mock).mockRejectedValueOnce(err);
  const onFailed = jest.fn();
  await render(<QueryAnswer queryId="q1" questionTurn={question} onFailed={onFailed} />);
  await answer('Large');
  expect(onFailed).toHaveBeenCalledWith(err);
  expect(alert).not.toHaveBeenCalled();
});
