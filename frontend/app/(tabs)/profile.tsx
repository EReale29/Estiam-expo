import { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const { data, isLoading } = useDashboard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1100 : undefined, alignSelf: 'center' };

  const stats = [
    { label: t('profile.statsTrips'), value: data?.stats.trips ?? 0, icon: 'map-outline' as const, colors: palette.heroGradient as const },
    { label: t('profile.statsPhotos'), value: data?.stats.photos ?? 0, icon: 'camera' as const, colors: palette.actionGradient as const },
    { label: t('profile.statsFavorites'), value: 0, icon: 'heart-outline' as const, colors: palette.deepGradient as const },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    router.replace('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={palette.heroGradient} style={[styles.header, { shadowColor: palette.shadow }, layoutWidth]}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>{t('profile.title')}</Text>
          <View style={[styles.profileCard, { borderColor: palette.border, shadowColor: palette.shadow }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: palette.glass, borderColor: palette.glassStroke }]}>
                <Text style={styles.avatarEmoji}>🧭</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: palette.text }]}>{user?.name || 'TravelMate'}</Text>
                <Text style={[styles.profileEmail, { color: palette.muted }]}>{user?.email}</Text>
              </View>
            </View>
            {isLoading ? (
              <ActivityIndicator color={palette.tint} />
            ) : (
              <View style={styles.statsGrid}>
                {stats.map((stat) => (
                  <View key={stat.label} style={styles.statItem}>
                    <LinearGradient colors={stat.colors} style={[styles.statIcon, { shadowColor: palette.shadow }]}>
                      <Ionicons name={stat.icon as any} size={24} color="white" />
                    </LinearGradient>
                    <Text style={[styles.statValue, { color: palette.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: palette.muted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={[styles.content, { backgroundColor: palette.background }, layoutWidth]}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }]} onPress={toggleLanguage}>
            <LinearGradient colors={palette.actionGradient} style={styles.menuItemIcon}>
              <Ionicons name="language-outline" size={24} color="white" />
            </LinearGradient>
            <View>
              <Text style={[styles.menuItemTitle, { color: palette.text }]}>{t('profile.changeLanguage')}</Text>
              <Text style={[styles.menuItemSubTitle, { color: palette.muted }]}>{language.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow },
              isLoggingOut && styles.menuItemDisabled,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <LinearGradient colors={[palette.danger, '#1e293b']} style={styles.menuItemIcon}>
              <Ionicons name="log-out-outline" size={24} color="white" />
            </LinearGradient>
            <View>
              <Text style={[styles.menuItemTitle, { color: palette.text }]}>{t('profile.logout')}</Text>
              <Text style={[styles.menuItemSubTitle, { color: palette.muted }]}>{t('profile.logoutSubtitle')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 128,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  content: {
    padding: 24,
    marginTop: -80,
  },
  menuItem: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemSubTitle: {
    fontSize: 16,
  },
});
