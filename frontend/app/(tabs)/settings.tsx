import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '@/contexts/i18n-context';
import { useOffline } from '@/hooks/use-offline';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { useState, useMemo, useCallback } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { userApi } from '@/services/user';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useI18n();
  const { isOnline, pendingCount, syncNow } = useOffline();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { preference, setPreference } = useTheme();
  const { logout } = useAuth();
  const { preferences, initialize, updatePreferences, pushToken, hasPermission, isLoading: isLoadingNotifications } = useNotifications();
  const [search, setSearch] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width > 720;
  const cardWidth = { width: '100%', maxWidth: isWide ? 720 : undefined, alignSelf: 'center' };
  const notificationsEnabled = preferences?.enabled ?? false;

  const handleToggleNotifications = useCallback(async () => {
    const nextState = !notificationsEnabled;
    await updatePreferences({ enabled: nextState });
    if (nextState) {
      const token = await initialize();
      await userApi.updateProfile({ notificationsEnabled: true, pushToken: token?.token || null });
    } else {
      await userApi.updateProfile({ notificationsEnabled: false, pushToken: null });
    }
  }, [initialize, notificationsEnabled, updatePreferences]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const sections = useMemo(() => [
    { key: 'appearance', label: t('settingsPage.appearance') },
    { key: 'language', label: t('settingsPage.language') },
    { key: 'notifications', label: t('settingsPage.notifications') },
    { key: 'offline', label: t('settingsPage.offline') },
    { key: 'logout', label: t('settingsPage.logout') },
  ], [t]);

  const visibleSections = useMemo(() => {
    if (!search.trim()) return sections.map((s) => s.key);
    const term = search.trim().toLowerCase();
    return sections.filter((s) => s.label.toLowerCase().includes(term)).map((s) => s.key);
  }, [sections, search]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.headerRow, cardWidth]}>
          <Text style={[styles.title, { color: palette.text }]}>{t('settingsPage.title')}</Text>
          <View style={[styles.searchBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Ionicons name="search" size={16} color={palette.icon} />
            <TextInput
              style={[styles.searchInput, { color: palette.text }]}
              placeholder={t('settingsPage.searchPlaceholder')}
              placeholderTextColor={palette.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {visibleSections.includes('appearance') && (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t('settingsPage.appearance')}</Text>
            <View style={[styles.row, styles.chipRow]}>
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.chip,
                    { borderColor: palette.border },
                    preference === mode && { backgroundColor: palette.tint, borderColor: palette.tint, shadowColor: palette.shadow },
                  ]}
                  onPress={() => setPreference(mode)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: palette.text },
                      preference === mode && { color: palette.background, fontWeight: '700' },
                    ]}>
                    {mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {visibleSections.includes('language') && (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t('profile.changeLanguage')}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  { borderColor: palette.border },
                  language === 'fr' && { backgroundColor: palette.tint, borderColor: palette.tint },
                ]}
                onPress={() => setLanguage('fr')}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: palette.text },
                    language === 'fr' && styles.chipTextActive,
                    language === 'fr' && { color: palette.background },
                  ]}>
                  FR
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  { borderColor: palette.border },
                  language === 'en' && { backgroundColor: palette.tint, borderColor: palette.tint },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: palette.text },
                    language === 'en' && styles.chipTextActive,
                    language === 'en' && { color: palette.background },
                  ]}>
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {visibleSections.includes('notifications') && (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t('settingsPage.notifications')}</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>
              {t('settingsPage.notificationStatus', { status: notificationsEnabled ? t('settingsPage.statusOn') : t('settingsPage.statusOff') })}
            </Text>
            <TouchableOpacity
              style={[
                styles.syncButton,
                { backgroundColor: notificationsEnabled ? palette.tint : palette.border, shadowColor: palette.shadow },
              ]}
              onPress={handleToggleNotifications}
              disabled={isLoadingNotifications}>
              <Text style={[styles.syncText, { color: palette.background }]}>
                {notificationsEnabled ? t('settingsPage.disableNotifications') : t('settingsPage.enableNotifications')}
              </Text>
            </TouchableOpacity>
            {pushToken && (
              <Text style={[styles.subtitle, { color: palette.muted, marginTop: 6 }]} numberOfLines={1}>
                Token: {pushToken.token}
              </Text>
            )}
            {hasPermission ? null : (
              <Text style={[styles.subtitle, { color: palette.warning, marginTop: 4 }]}>Permissions requises</Text>
            )}
          </View>
        )}

        {visibleSections.includes('offline') && (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t('general.offline')}</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>Actions en attente: {pendingCount}</Text>
            <TouchableOpacity style={[styles.syncButton, { backgroundColor: palette.tint, shadowColor: palette.shadow }]} onPress={syncNow}>
              <Text style={[styles.syncText, { color: palette.background }]}>{t('general.syncNow')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {visibleSections.includes('logout') && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: palette.danger, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}
            onPress={handleLogout}
            disabled={isLoggingOut}>
            <Text style={[styles.cardTitle, { color: palette.background }]}>{t('settingsPage.logout')}</Text>
            <Text style={[styles.subtitle, { color: palette.background }]}>{t('profile.logoutSubtitle')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
  },
  chipTextActive: {
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 4,
  },
  syncButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  syncText: {
    fontWeight: '600',
  },
});
