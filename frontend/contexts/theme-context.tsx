import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeValue = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeValue;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  isReady: boolean;
};

const STORAGE_KEY = 'theme:preference';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  preference: 'system',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setPreference: async () => {},
  isReady: false,
});

const resolveTheme = (preference: ThemePreference, system: ThemeValue) =>
  preference === 'system' ? system : preference;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = Appearance.getColorScheme() as ThemeValue | null;
  const [systemTheme, setSystemTheme] = useState<ThemeValue>(systemScheme ?? 'light');
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      } finally {
        setIsReady(true);
      }
    };
    loadPreference();
  }, []);

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setSystemTheme(colorScheme as ThemeValue);
      }
    });
    return () => listener.remove();
  }, []);

  const setPreference = useCallback(async (value: ThemePreference) => {
    setPreferenceState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolveTheme(preference, systemTheme),
      preference,
      setPreference,
      isReady,
    }),
    [preference, setPreference, systemTheme, isReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
