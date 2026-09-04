/* eslint-disable react-refresh/only-export-components -- ThemeContext intentionally exports both provider and hook */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const THEME_STORAGE_KEY = 'puthumai_uzhavan_dark_mode';
const THEME_META_NAME = 'theme-color';

type ThemeContextValue = {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyTheme(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', enabled);
  root.style.colorScheme = enabled ? 'dark' : 'light';

  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${THEME_META_NAME}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = THEME_META_NAME;
    document.head.appendChild(meta);
  }
  meta.content = enabled ? '#111827' : '#2E7D32';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(readStoredTheme);

  const setDarkMode = useCallback((enabled: boolean) => {
    setDarkModeState(enabled);
    applyTheme(enabled);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, String(enabled));
    } catch {
      // Theme still applies for the current session when storage is unavailable.
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  const value = useMemo(() => ({ darkMode, setDarkMode, toggleDarkMode }), [darkMode, setDarkMode, toggleDarkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// useTheme is exported from './useTheme' to keep this file fast-refresh compatible.
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
export { useTheme };
