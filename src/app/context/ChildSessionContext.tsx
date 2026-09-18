'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildSession, CHILD_AVATAR_LIST } from '../types/childCredential';
import { ChildProfile } from '../types/childProfile';
import { childAccessCredentialService } from '../services/childAccessCredentialService';

interface ChildSessionContextType {
  currentSession: ChildSession | null;
  isChildModeActive: boolean;
  startChildSession: (
    child: ChildProfile,
    entryMode?: 'SupervisorLaunched' | 'IndependentEasyLogin'
  ) => void;
  endChildSession: () => void;
  requestExitWithGate: () => void;
  isParentalGateOpen: boolean;
  closeParentalGate: () => void;
  onParentalGateSuccess: () => void;
  pendingGateDestinationStage: number | null;
  setPendingGateDestinationStage: (stage: number | null) => void;
}

const ChildSessionContext = createContext<ChildSessionContextType | undefined>(undefined);

const CHILD_SESSION_STORAGE_KEY = 'magictales_active_child_session';

export const ChildSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ChildSession | null>(null);
  const [isParentalGateOpen, setIsParentalGateOpen] = useState<boolean>(false);
  const [pendingGateDestinationStage, setPendingGateDestinationStage] = useState<number | null>(null);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem(CHILD_SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChildSession;
        setCurrentSession(parsed);
      }
    } catch (e) {
      console.error('Failed to restore child session:', e);
    }
  }, []);

  const isChildModeActive = currentSession !== null;

  const startChildSession = useCallback(
    (child: ChildProfile, entryMode: 'SupervisorLaunched' | 'IndependentEasyLogin' = 'SupervisorLaunched') => {
      const cred = childAccessCredentialService.getCredential(child.id);
      const avatar = CHILD_AVATAR_LIST.find((a) => a.id === cred.avatarId) || CHILD_AVATAR_LIST[0];

      const newSession: ChildSession = {
        childProfileId: child.id,
        nickname: child.nickname,
        ageBand: child.ageBand,
        avatarId: avatar.id,
        avatarEmoji: avatar.emoji,
        avatarName: avatar.name,
        sessionToken: `cs_${child.id}_${Date.now()}`,
        startedAt: new Date().toISOString(),
        entryMode,
      };

      setCurrentSession(newSession);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(CHILD_SESSION_STORAGE_KEY, JSON.stringify(newSession));
      }
    },
    []
  );

  const endChildSession = useCallback(() => {
    setCurrentSession(null);
    setIsParentalGateOpen(false);
    setPendingGateDestinationStage(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHILD_SESSION_STORAGE_KEY);
    }
  }, []);

  const requestExitWithGate = useCallback(() => {
    setIsParentalGateOpen(true);
  }, []);

  const closeParentalGate = useCallback(() => {
    setIsParentalGateOpen(false);
    setPendingGateDestinationStage(null);
  }, []);

  const onParentalGateSuccess = useCallback(() => {
    endChildSession();
  }, [endChildSession]);

  return (
    <ChildSessionContext.Provider
      value={{
        currentSession,
        isChildModeActive,
        startChildSession,
        endChildSession,
        requestExitWithGate,
        isParentalGateOpen,
        closeParentalGate,
        onParentalGateSuccess,
        pendingGateDestinationStage,
        setPendingGateDestinationStage,
      }}
    >
      {children}
    </ChildSessionContext.Provider>
  );
};

export const useChildSession = () => {
  const context = useContext(ChildSessionContext);
  if (!context) {
    throw new Error('useChildSession must be used within a ChildSessionProvider');
  }
  return context;
};
