/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#29d9c2';
const tintColorDark = '#6ff3dc';

export const Colors = {
  light: {
    text: '#0f1f2f',
    muted: '#1b4332',
    background: '#e9f7f1',
    surface: '#f7fffb',
    card: 'rgba(255, 255, 255, 0.78)',
    glass: 'rgba(255, 255, 255, 0.48)',
    glassStroke: 'rgba(20, 184, 166, 0.25)',
    border: 'rgba(13, 148, 136, 0.18)',
    tint: tintColorLight,
    accent: '#25c5ad',
    accentSecondary: '#60efff',
    icon: '#0f766e',
    tabIconDefault: '#5b7083',
    tabIconSelected: tintColorLight,
    shadow: 'rgba(15, 118, 110, 0.25)',
    heroGradient: ['#44efd1', '#0ea5e9'],
    actionGradient: ['#5eead4', '#22d3ee'],
    deepGradient: ['#0d9488', '#0f172a'],
    success: '#0ea5e9',
    warning: '#f59e0b',
    danger: '#f87171',
  },
  dark: {
    text: '#e6f7f3',
    muted: '#9adbd0',
    background: '#071821',
    surface: '#0d2932',
    card: 'rgba(12, 38, 44, 0.78)',
    glass: 'rgba(12, 38, 44, 0.6)',
    glassStroke: 'rgba(94, 234, 212, 0.25)',
    border: 'rgba(34, 211, 238, 0.24)',
    tint: tintColorDark,
    accent: '#5eead4',
    accentSecondary: '#67e8f9',
    icon: '#9adbd0',
    tabIconDefault: '#9ba1a6',
    tabIconSelected: tintColorDark,
    shadow: 'rgba(4, 120, 87, 0.45)',
    heroGradient: ['#0f766e', '#082f49'],
    actionGradient: ['#22d3ee', '#0ea5e9'],
    deepGradient: ['#0b1720', '#020617'],
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
