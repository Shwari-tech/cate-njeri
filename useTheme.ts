// =========================================
// THEME HOOK - LIGHT/DARK MODE
// =========================================

import { useState, useEffect, useCallback } from 'react';
import type { Theme, ThemeState } from '@/types';

const THEME_STORAGE_KEY = 'shwari_theme_v1';

export function useTheme() {
  const [state, setState] = useState<ThemeState>({
    theme: 'light',
    systemPreference: null,
  });

  // Initialize theme from storage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      // Check stored preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed: ThemeState = JSON.parse(stored);
        setState(parsed);
        applyTheme(parsed.theme);
        return;
      }

      // Check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme: Theme = mediaQuery.matches ? 'dark' : 'light';
      
      setState({
        theme: systemTheme,
        systemPreference: systemTheme,
      });
      applyTheme(systemTheme);

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        setState(prev => ({
          ...prev,
          theme: newTheme,
          systemPreference: newTheme,
        }));
        applyTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    };

    initializeTheme();
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  const setTheme = useCallback((theme: Theme) => {
    setState(prev => ({
      ...prev,
      theme,
      systemPreference: null, // User has overridden system preference
    }));
    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      theme,
      systemPreference: null,
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => {
      const newTheme: Theme = prev.theme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        theme: newTheme,
        systemPreference: null,
      }));
      return {
        ...prev,
        theme: newTheme,
        systemPreference: null,
      };
    });
  }, []);

  const resetToSystem = useCallback(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme: Theme = mediaQuery.matches ? 'dark' : 'light';
    
    setState({
      theme: systemTheme,
      systemPreference: systemTheme,
    });
    applyTheme(systemTheme);
    localStorage.removeItem(THEME_STORAGE_KEY);
  }, []);

  return {
    theme: state.theme,
    isDark: state.theme === 'dark',
    isSystemPreference: state.systemPreference !== null,
    setTheme,
    toggleTheme,
    resetToSystem,
  };
}
