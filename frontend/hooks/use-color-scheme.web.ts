import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const themeContext = useTheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const preferenceTheme = themeContext?.theme;

  if (hasHydrated) {
    return preferenceTheme ?? colorScheme ?? 'light';
  }

  return preferenceTheme ?? 'light';
}
