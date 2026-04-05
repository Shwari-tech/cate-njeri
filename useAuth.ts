// =========================================
// AUTHENTICATION HOOK - ENTERPRISE GRADE
// =========================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { User, LoginCredentials, AuthState } from '@/types';

const AUTH_STORAGE_KEY = 'shwari_auth_v2';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface StoredAuth {
  user: User;
  credentials: {
    identifier: string;
    pin: string;
    type: 'mobile' | 'email';
  };
  expiresAt: number;
  loginAttempts: number;
  lockedUntil: number | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });
  
  const loginAttemptsRef = useRef(0);
  const lockedUntilRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for stored session on mount
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const parsed: StoredAuth = JSON.parse(stored);
        
        // Check if session is expired
        if (Date.now() > parsed.expiresAt) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Check if account is locked
        if (parsed.lockedUntil && Date.now() < parsed.lockedUntil) {
          lockedUntilRef.current = parsed.lockedUntil;
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: `Account locked. Try again in ${Math.ceil((parsed.lockedUntil! - Date.now()) / 60000)} minutes.`
          }));
          return;
        }

        // Restore session
        setState({
          isAuthenticated: true,
          user: parsed.user,
          isLoading: false,
          error: null,
        });

        // Restore attempt tracking
        loginAttemptsRef.current = parsed.loginAttempts || 0;
        lockedUntilRef.current = parsed.lockedUntil;
      } catch (error) {
        console.error('Session restore error:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkStoredSession();
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isLocked = useCallback(() => {
    if (lockedUntilRef.current && Date.now() < lockedUntilRef.current) {
      return true;
    }
    return false;
  }, []);

  const getLockoutTimeRemaining = useCallback(() => {
    if (lockedUntilRef.current && Date.now() < lockedUntilRef.current) {
      return Math.ceil((lockedUntilRef.current - Date.now()) / 60000);
    }
    return 0;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check lockout
      if (isLocked()) {
        const minutes = getLockoutTimeRemaining();
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: `Too many attempts. Account locked for ${minutes} minutes.`
        }));
        return false;
      }

      // Simulate API call with retry logic
      const user = await simulateLoginAPI(credentials, abortControllerRef.current.signal);

      if (user) {
        // Reset attempts on success
        loginAttemptsRef.current = 0;
        lockedUntilRef.current = null;

        // Store session if remember me
        if (credentials.rememberMe) {
          const storedAuth: StoredAuth = {
            user,
            credentials: {
              identifier: credentials.identifier,
              pin: credentials.pin,
              type: credentials.type,
            },
            expiresAt: Date.now() + SESSION_DURATION,
            loginAttempts: 0,
            lockedUntil: null,
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedAuth));
        }

        setState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });

        return true;
      } else {
        // Increment failed attempts
        loginAttemptsRef.current++;
        
        // Lock account if max attempts reached
        if (loginAttemptsRef.current >= MAX_LOGIN_ATTEMPTS) {
          lockedUntilRef.current = Date.now() + LOCKOUT_DURATION;
        }

        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - loginAttemptsRef.current} attempts remaining.`
        }));
        return false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }

      console.error('Login error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Connection error. Please try again.'
      }));
      return false;
    }
  }, [isLocked, getLockoutTimeRemaining]);

  const logout = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    localStorage.removeItem(AUTH_STORAGE_KEY);
    loginAttemptsRef.current = 0;
    lockedUntilRef.current = null;
    
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate API refresh
      const refreshedUser = await simulateRefreshAPI(state.user.id);
      
      if (refreshedUser) {
        setState(prev => ({
          ...prev,
          user: refreshedUser,
          isLoading: false,
        }));

        // Update stored session
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed: StoredAuth = JSON.parse(stored);
          parsed.user = refreshedUser;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
    isLocked: isLocked(),
    lockoutTimeRemaining: getLockoutTimeRemaining(),
    loginAttemptsRemaining: MAX_LOGIN_ATTEMPTS - loginAttemptsRef.current,
  };
}

// Simulated API functions (replace with real API calls)
async function simulateLoginAPI(
  credentials: LoginCredentials, 
  signal: AbortSignal
): Promise<User | null> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Demo credentials for testing
      if (credentials.pin === '1234') {
        resolve({
          id: 'user-001',
          name: 'John Doe',
          email: credentials.type === 'email' ? credentials.identifier : 'john@example.com',
          accountNo: '254712345678',
          bankBranch: 'Nairobi Main',
          bankCode: 'KCB',
          netPay: 87500.00,
          team: 'Operations',
          sheetLink: 'https://sheets.example.com/user-001',
          syncTime: new Date().toLocaleString(),
          serverNode: 'NODE_ALPHA',
        });
      } else {
        resolve(null);
      }
    }, 1500);

    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      reject(new Error('AbortError'));
    });
  });
}

async function simulateRefreshAPI(userId: string): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        accountNo: '254712345678',
        bankBranch: 'Nairobi Main',
        bankCode: 'KCB',
        netPay: 87500.00,
        team: 'Operations',
        sheetLink: 'https://sheets.example.com/user-001',
        syncTime: new Date().toLocaleString(),
        serverNode: 'NODE_BETA',
      });
    }, 800);
  });
}
