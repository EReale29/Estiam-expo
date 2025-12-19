import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/contexts/i18n-context';
import { userApi } from '@/services/user';
import { auth } from '@/services/auth';
import { useRouter } from 'expo-router';

export default function EditProfileModal() {
  const { user, refreshAuth } = useAuth();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.username || '');
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await userApi.updateProfile({ username });
      await auth.saveUser(updated);
      await refreshAuth();
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      Alert.alert('Erreur', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { borderColor: palette.border }]}>
          <Ionicons name="arrow-back" size={18} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{t('profile.edit')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.formCard, { borderColor: palette.border, backgroundColor: palette.card, shadowColor: palette.shadow }]}>
        <Text style={[styles.label, { color: palette.muted }]}>{t('profile.username')}</Text>
        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          value={username}
          onChangeText={setUsername}
          placeholder={t('profile.username')}
          placeholderTextColor={palette.muted}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: palette.tint, shadowColor: palette.shadow }]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={[styles.saveText, { color: palette.background }]}>{isSaving ? t('general.loading') : t('profile.save')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  saveText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
