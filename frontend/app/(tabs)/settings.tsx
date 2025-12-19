import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useI18n } from '@/contexts/i18n-context';
import { useOffline } from '@/hooks/use-offline';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme-context';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useI18n();
  const { isOnline, pendingCount, syncNow } = useOffline();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { preference, setPreference } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width > 720;
  const cardWidth = { width: '100%', maxWidth: isWide ? 720 : undefined, alignSelf: 'center' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.text }, cardWidth]}>{t('tabs.settings')}</Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('tabs.settings')} • Apparence</Text>
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

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, cardWidth]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('general.offline')}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Actions en attente: {pendingCount}</Text>
          <TouchableOpacity style={[styles.syncButton, { backgroundColor: palette.tint, shadowColor: palette.shadow }]} onPress={syncNow}>
            <Text style={[styles.syncText, { color: palette.background }]}>{t('general.syncNow')}</Text>
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
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
