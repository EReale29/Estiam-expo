import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';

import { useNotifications } from '@/hooks/use-notifications';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NotificationScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<string[]>([]);
  const isSimulator = !Device.isDevice;
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1080 : undefined, alignSelf: 'center' };

  const {
    pushToken,
    isLoading,
    hasPermission,
    initialize,
    send,
    schedule,
    scheduled,
    badgeCount,
    setBadgeCount,
    clearBadge,
    refreshScheduled,
    updatePreferences,
  } = useNotifications(
    (notification) => addTestResult(`✅ Notification reçue: ${notification.request.content.title}`),
    (data) => addTestResult(`👆 Notification cliquée: ${JSON.stringify(data)}`)
  );

  const addTestResult = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    refreshScheduled();
  }, [refreshScheduled]);

  const handleInitialize = async () => {
    addTestResult('🔄 Initialisation des notifications ...');
    await updatePreferences({ enabled: true });
    const token = await initialize();
    if (token) {
      addTestResult(`✅ Token obtenu: ${token.token.substring(0, 20)}...`);
      addTestResult(`📱 Plateforme: ${token.platform}`);
    } else {
      addTestResult('❌ Echec de l’intialisation');
    }
  };

  const handleSendImmediate = async () => {
    try {
      const id = await send('Test Notification', 'Notification immédiate');
      addTestResult(`✅ Notification envoyée (ID: ${id.substring(0, 8)}...)`);
    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    }
  };

  const handleSchedule = async (seconds: number) => {
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    try {
      await schedule('Rappel de voyage', `Notification dans ${seconds} secondes`, date, { testType: 'scheduled' });
      addTestResult(`✅ Notification programmée pour ${date.toLocaleTimeString()}`);
      await refreshScheduled();
    } catch (error) {
      addTestResult(`❌ Erreur: ${error}`);
    }
  };

  const handleClearResults = () => setTestResults([]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <LinearGradient colors={palette.heroGradient} style={[styles.header, { shadowColor: palette.shadow }, layoutWidth]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { borderColor: palette.glassStroke }]}>
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>{t('notifications.title')}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, layoutWidth]}>
        <View style={[styles.statusCard, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isSimulator ? 'phone-portrait-outline' : 'phone-portrait'}
              size={20}
              color={isSimulator ? palette.warning : palette.success}
            />
            <Text style={[styles.statusText, { color: palette.text }]}>{isSimulator ? 'Simulateur' : 'Appareil physique'}</Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons
              name={hasPermission ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasPermission ? palette.success : palette.danger}
            />
            <Text style={[styles.statusText, { color: palette.text }]}>Permissions: {hasPermission ? 'Accordées' : 'Non accordées'}</Text>
          </View>
          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={[styles.tokenLabel, { color: palette.muted }]}>Token:</Text>
              <Text style={[styles.tokenText, { color: palette.text }]} numberOfLines={1}>
                {pushToken.token}
              </Text>
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={[styles.badgeLabel, { color: palette.text }]}>Badge count: {badgeCount}</Text>
          </View>
          {scheduled.length > 0 && (
            <View style={styles.scheduledContainer}>
              <Text style={[styles.scheduledLabel, { color: palette.muted }]}>Notifications programmées: {scheduled.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('notifications.title')}</Text>

          <TouchableOpacity
            onPress={handleInitialize}
            disabled={isLoading}
            style={[styles.button, { backgroundColor: palette.tint, shadowColor: palette.shadow }]}>
            <Ionicons name="notifications-outline" size={20} color={palette.background} />
            <Text style={[styles.buttonText, { color: palette.background }]}>{t('notifications.initialize')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendImmediate}
            style={[styles.button, { backgroundColor: palette.success, shadowColor: palette.shadow }]}>
            <Ionicons name="send-outline" size={20} color={palette.background} />
            <Text style={[styles.buttonText, { color: palette.background }]}>{t('notifications.immediate')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSchedule(5)}
            style={[styles.button, { backgroundColor: palette.accentSecondary, shadowColor: palette.shadow }]}>
            <Ionicons name="time-outline" size={20} color={palette.text} />
            <Text style={[styles.buttonText, { color: palette.text }]}>{t('notifications.in5s')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSchedule(30)}
            style={[styles.button, { backgroundColor: palette.icon, shadowColor: palette.shadow }]}>
            <Ionicons name="calendar-outline" size={20} color={palette.background} />
            <Text style={[styles.buttonText, { color: palette.background }]}>{t('notifications.in30s')}</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setBadgeCount(5)}
              style={[
                styles.button,
                styles.buttonSmall,
                { backgroundColor: palette.warning, shadowColor: palette.shadow },
              ]}>
              <Ionicons name="ellipse" size={16} color={palette.background} />
              <Text style={[styles.buttonTextSmall, { color: palette.background }]}>{t('notifications.badgeFive')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearBadge}
              style={[
                styles.button,
                styles.buttonSmall,
                { backgroundColor: palette.danger, shadowColor: palette.shadow },
              ]}>
              <Ionicons name="close-circle-outline" size={16} color={palette.background} />
              <Text style={[styles.buttonTextSmall, { color: palette.background }]}>{t('notifications.clearBadge')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('notifications.results')}</Text>
            {testResults.length > 0 && (
              <TouchableOpacity onPress={handleClearResults}>
                <Text style={[styles.clearButton, { color: palette.tint }]}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>

          {testResults.length === 0 ? (
            <View style={[styles.emptyResults, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="document-text-outline" size={48} color={palette.icon} />
              <Text style={[styles.emptyText, { color: palette.text }]}>{t('notifications.empty')}</Text>
              <Text style={[styles.emptySubtext, { color: palette.muted }]}>
                Utilisez les boutons ci-dessus pour tester les notifications
              </Text>
            </View>
          ) : (
            <View style={[styles.resultsContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
              {testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={[styles.resultText, { color: palette.text }]}>{result}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {isSimulator && (
          <View style={[styles.infoBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="information-circle" size={20} color={palette.icon} />
            <Text style={[styles.infoText, { color: palette.text }]}>{t('notifications.simulatorInfo')}</Text>
          </View>
        )}
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
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  badgeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scheduledContainer: {
    marginTop: 8,
  },
  scheduledLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  buttonSmall: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
    borderWidth: 1,
  },
  resultItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyResults: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
