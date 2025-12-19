import { useColorScheme as useRNColorScheme } from 'react-native';

import { useTheme } from '@/contexts/theme-context';

export function useColorScheme() {
  const themeContext = useTheme();
  const fallback = useRNColorScheme();
  return themeContext?.theme ?? fallback ?? 'light';
}
