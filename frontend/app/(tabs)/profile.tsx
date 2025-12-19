import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { useAuth } from '@/contexts/auth-context';
import { useDashboard } from '@/hooks/use-dashboard';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API } from '@/services/api';
import { userApi } from '@/services/user';
import { auth } from '@/services/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const { t } = useI18n();
  const { data, isLoading } = useDashboard();
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1100 : undefined, alignSelf: 'center' };

  useEffect(() => {
    setAvatar(user?.avatar || '');
  }, [user]);

  const stats = [
    { label: t('profile.statsTrips'), value: data?.stats.trips ?? 0, icon: 'map-outline' as const, colors: palette.heroGradient as const },
    { label: t('profile.statsPhotos'), value: data?.stats.photos ?? 0, icon: 'camera' as const, colors: palette.actionGradient as const },
    { label: t('profile.statsFavorites'), value: data?.stats.likes ?? 0, icon: 'heart-outline' as const, colors: palette.deepGradient as const },
  ];

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setIsUpdatingAvatar(true);
      const photoUri = result.assets[0].uri;
      const uploaded = await API.uploadImage(photoUri);
      const updated = await userApi.updateProfile({ avatar: uploaded });
      await auth.saveUser(updated);
      await refreshAuth();
      setAvatar(uploaded);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={palette.heroGradient} style={[styles.header, { shadowColor: palette.shadow }, layoutWidth]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>{t('profile.title')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={[styles.settingsBtn, { borderColor: palette.glassStroke }]}>
              <Ionicons name="settings-outline" size={20} color={palette.text} />
              <Text style={[styles.settingsText, { color: palette.text }]}>{t('profile.settings')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.profileCard, { borderColor: palette.border, shadowColor: palette.shadow }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, { borderColor: palette.glassStroke }]}>
                <View style={[styles.avatar, { backgroundColor: palette.glass, borderColor: palette.glassStroke }]}>
                  {avatar ? <Image source={{ uri: avatar }} style={styles.avatarBg} /> : <Text style={styles.avatarEmoji}>🧭</Text>}
                </View>
                <TouchableOpacity style={[styles.avatarEdit, { backgroundColor: palette.tint }]} onPress={pickAvatar}>
                  <Ionicons name="pencil" size={14} color={palette.background} />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.profileName, { color: palette.text }]}>
                    {user?.username || 'TravelMate'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.inlineEdit, { borderColor: palette.border }]}
                    onPress={() => router.push('/modal/edit-profile')}>
                    <Ionicons name="pencil" size={14} color={palette.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.profileEmail, { color: palette.muted }]}>{user?.email}</Text>
              </View>
            </View>
            {isLoading || isUpdatingAvatar ? (
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

        <View style={[styles.content, { backgroundColor: palette.background }, layoutWidth]} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsText: {
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  profileCard: {
    borderRadius: 24,
    padding: 16,
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
  avatarContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    borderWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarBg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarInitials: {
    fontSize: 32,
    color: '#fff',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    padding: 0,
    marginTop: 0,
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  inlineEdit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    marginTop: 4,
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
