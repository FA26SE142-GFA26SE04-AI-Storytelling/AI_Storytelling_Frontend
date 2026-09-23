import { useState, useEffect } from 'react';

export type AuthTabType = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

export interface RoomUrlParamsResult {
  initialAuthTab: AuthTabType;
  initialEmail: string;
  initialToken: string;
}

/**
 * Custom hook tự động phân giải URL query params (auth, token, email, code)
 * và điều hướng 3D Stage tương ứng mà không tạo route phẳng độc lập.
 */
export function useRoomUrlParams(
  isLoggedIn: boolean,
  setCurrentStage: (stage: number) => void
): RoomUrlParamsResult {
  const [initialAuthTab, setInitialAuthTab] = useState<AuthTabType>('signin');
  const [initialEmail, setInitialEmail] = useState<string>('');
  const [initialToken, setInitialToken] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get('auth');
    const tokenParam = params.get('token') || params.get('resetToken');
    const emailParam = params.get('email') || '';
    const codeParam = params.get('code') || params.get('invitationCode') || params.get('inviteCode');

    if (codeParam) {
      sessionStorage.setItem('pendingInvitationCode', codeParam);
      if (isLoggedIn) {
        setCurrentStage(6);
      } else {
        setCurrentStage(5);
        setInitialAuthTab('signup');
      }
    } else if (tokenParam || authParam === 'reset') {
      setCurrentStage(5);
      setInitialAuthTab('reset');
      if (tokenParam) setInitialToken(tokenParam);
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'forgot') {
      setCurrentStage(5);
      setInitialAuthTab('forgot');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'signin') {
      setCurrentStage(5);
      setInitialAuthTab('signin');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'signup') {
      setCurrentStage(5);
      setInitialAuthTab('signup');
      if (emailParam) setInitialEmail(emailParam);
    } else if (authParam === 'verify') {
      setCurrentStage(5);
      setInitialAuthTab('verify');
      if (emailParam) setInitialEmail(emailParam);
    }
  }, [isLoggedIn, setCurrentStage]);

  return { initialAuthTab, initialEmail, initialToken };
}
