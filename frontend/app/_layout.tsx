import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOffline } from '@/hooks/use-offline';
import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { ThemeProvider } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const palette = Colors[colorScheme ?? 'light'];


  // check auth
  useEffect(() => {
    if (isLoading) return;
    const root = segments[0];
    const isProtected = root === '(tabs)' || root === 'modal' || root === 'trip';
    const isLogin = root === 'login';

    if (!isAuthenticated && isProtected) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated && isLogin) {
      router.replace('/(tabs)');
    }
  }, [segments, isLoading, isAuthenticated, router]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? {
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                primary: palette.tint,
                background: palette.background,
                card: palette.card,
                text: palette.text,
                border: palette.border,
                notification: palette.accent,
              },
            }
          : {
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                primary: palette.tint,
                background: palette.background,
                card: palette.card,
                text: palette.text,
                border: palette.border,
                notification: palette.accent,
              },
            }
      }>
      {/*Banner Offline*/}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: palette.danger, shadowColor: palette.shadow }]}>
          <Ionicons name='cloud-offline-outline' size={16} color='#fff' />
          <Text style={styles.bannerText}>
            Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
          </Text>
        </View>
      )}

      {/*Banner Sync */}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity
          style={[
            styles.syncBanner,
            { backgroundColor: palette.success, shadowColor: palette.shadow, borderColor: palette.glassStroke },
          ]}
          onPress={syncNow}>
          <Ionicons
            name={isSyncing ? "sync" : "sync-outline"}
            size={16}
            color="#fff"
          />
          <Text style={styles.bannerText}>
            {isSyncing
              ? 'Synchronisation...'
              : `Synchroniser ${pendingCount} action(s)`}
          </Text>
        </TouchableOpacity>
      )}

      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trip/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}



const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingTop: 50,
    gap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});


export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
            <RootLayoutContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
  
}
