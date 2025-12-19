import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '@/contexts/i18n-context';
import { useOffline } from '@/hooks/use-offline';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useI18n();
  const { isOnline, pendingCount, syncNow } = useOffline();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('tabs.settings')}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.changeLanguage')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, language === 'fr' && styles.chipActive]}
              onPress={() => setLanguage('fr')}
            >
              <Text style={[styles.chipText, language === 'fr' && styles.chipTextActive]}>FR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, language === 'en' && styles.chipActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.chipText, language === 'en' && styles.chipTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('general.offline')}</Text>
          <Text style={styles.subtitle}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
          <Text style={styles.subtitle}>Actions en attente: {pendingCount}</Text>
          <TouchableOpacity style={styles.syncButton} onPress={syncNow}>
            <Text style={styles.syncText}>{t('general.syncNow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  chipText: {
    color: '#111827',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 4,
  },
  syncButton: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncText: {
    color: '#fff',
    fontWeight: '600',
  },
});
