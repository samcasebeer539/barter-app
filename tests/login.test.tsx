// app/(auth)/login.tsx: signing in and signing up.
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

jest.mock('@/lib/firebase', () => ({ auth: { name: 'test-auth' } }));
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(async () => ({})),
  signInWithEmailAndPassword: jest.fn(async () => ({})),
}));
jest.mock('@/lib/api', () => ({ apiJson: jest.fn(async () => ({})) }));

import Login from '@/app/(auth)/login';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { apiJson } from '@/lib/api';
import { TEXT_LIMITS } from '@/config/textLimits';

const alertMock = jest.fn();
beforeEach(() => { (globalThis as any).alert = alertMock; alertMock.mockClear(); });

const type = (placeholder: string, text: string) => fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);
const tap = (label: string) => fireEvent.press(screen.getByText(label));
const flush = () => act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); });

test('sign in: the first tap of SIGN IN submits (it starts in sign-in mode)', async () => {
  await render(<Login />);
  expect(screen.getByText('Welcome Back!')).toBeTruthy();
  expect(screen.queryByPlaceholderText('First Name')).toBeNull();
  await type('Email', 'alice@example.com');
  await type('Password', 'hunter22');
  await tap('Sign In');
  await flush();
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith({ name: 'test-auth' }, 'alice@example.com', 'hunter22');
});

test('a failed sign in says why, and you can try again', async () => {
  (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(new Error('Firebase: Error (auth/invalid-credential).'));
  await render(<Login />);
  await tap('Sign In');
  await flush();
  expect(alertMock).toHaveBeenCalledWith('Sign In Failed: Firebase: Error (auth/invalid-credential).');
  expect(screen.getByText('Sign In')).toBeTruthy();        // buttons back, not stuck loading
});

test('sign up: the first tap switches to sign-up (with name fields), the second submits', async () => {
  await render(<Login />);
  await tap('Sign Up');
  expect(screen.getByText('Welcome to Win-Win!')).toBeTruthy();
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  await type('First Name', 'Ana');
  await type('Last Name', 'Ruiz');
  await type('Email', 'ana@example.com');
  await type('Password', 'hunter22');
  await tap('Sign Up');
  await flush();
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({ name: 'test-auth' }, 'ana@example.com', 'hunter22');
  expect(apiJson).toHaveBeenCalledWith('/dev/create_user', { method: 'POST', body: { firstName: 'Ana', lastName: 'Ruiz' } });
});

test("sign up needs both names; the form isn't left stuck loading", async () => {
  await render(<Login />);
  await tap('Sign Up');
  await type('First Name', 'Ana');
  await tap('Sign Up');
  await flush();
  expect(alertMock).toHaveBeenCalledWith('Please enter your first and last name.');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  await type('Last Name', 'Ruiz');
  await tap('Sign Up');                                    // still tappable
  await flush();
  expect(createUserWithEmailAndPassword).toHaveBeenCalled();
});

test("if the account record can't be created on the server, says so", async () => {
  (apiJson as jest.Mock).mockRejectedValueOnce(new Error('Missing name fields'));
  await render(<Login />);
  await tap('Sign Up');
  await type('First Name', 'Ana'); await type('Last Name', 'Ruiz');
  await tap('Sign Up');
  await flush();
  expect(alertMock).toHaveBeenCalledWith('Sign Up Failed: Missing name fields');
});

test('switching back to sign in hides the name fields', async () => {
  await render(<Login />);
  await tap('Sign Up');
  await tap('Sign In');
  expect(screen.queryByPlaceholderText('First Name')).toBeNull();
  expect(signInWithEmailAndPassword).not.toHaveBeenCalled();   // that tap only switched modes
});

test('fields stop at the length limits', async () => {
  await render(<Login />);
  await tap('Sign Up');
  const limit = (p: string) => screen.getByPlaceholderText(p).props.maxLength;
  expect([limit('First Name'), limit('Last Name'), limit('Email'), limit('Password')])
    .toEqual([TEXT_LIMITS.firstName, TEXT_LIMITS.lastName, TEXT_LIMITS.email, TEXT_LIMITS.password]);
});
