import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboard } from '@/hooks/use-dashboard';
import { useI18n } from '@/contexts/i18n-context';
import { Trip } from '@/types/models';
import { useAuth } from '@/contexts/auth-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const formatDaysLeft = (date: string) => {
  if (!date) return '';
  const diff = new Date(date).getTime() - Date.now();
  const days = Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  return days;
};

const buildImageSource = (trip: Trip) => {
  if (trip.image && trip.image.startsWith('http')) return { uri: trip.image };
  if (trip.photos?.[0]) return { uri: trip.photos[0] };
  return require('@/assets/images/paris.jpeg');
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data, isLoading, error, refresh } = useDashboard();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1100 : undefined, alignSelf: 'center' };

  const stats = useMemo(
    () => [
      { label: t('home.statsTrips'), value: data?.stats.trips ?? 0, icon: 'airplane-outline' as const },
      { label: t('home.statsPhotos'), value: data?.stats.photos ?? 0, icon: 'camera-outline' as const },
      { label: t('home.statsCountries'), value: data?.stats.countries ?? 0, icon: 'globe-outline' as const },
    ],
    [data?.stats, t]
  );

  const activities = data?.activities ?? [];
  const upcomingTrips = data?.upcomingTrips ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={palette.heroGradient}
          style={[styles.header, layoutWidth, { shadowColor: palette.shadow, marginHorizontal: isWide ? 16 : 0 }]}>
          <View style={[styles.headerTop, { borderColor: palette.glassStroke }]}>
            <View>
              <Text style={[styles.greetingText, { color: palette.muted }]}>{t('home.greeting')}</Text>
              <Text style={[styles.firstnameText, { color: palette.text }]}>{user?.username || user?.name || 'TravelMate'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.notificationBtn, { backgroundColor: palette.glass, borderColor: palette.glassStroke }]}
              onPress={() => router.push('/(tabs)/notification')}>
              <Ionicons name="notifications-outline" size={24} color={palette.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.statCard,
                  { backgroundColor: palette.glass, borderColor: palette.glassStroke, shadowColor: palette.shadow },
                ]}>
                <Ionicons name={stat.icon} color={palette.text} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: palette.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: palette.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={[styles.homeContent, { backgroundColor: palette.background }, layoutWidth]}>
          <View style={[styles.section, { borderColor: palette.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>{t('home.upcoming')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={[styles.homeSeeAllBtn, { color: palette.tint }]}>{t('general.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {isLoading && <ActivityIndicator color={palette.tint} />}
            {error && (
              <TouchableOpacity onPress={refresh} style={[styles.errorBox, { borderColor: palette.danger }]}>
                <Text style={[styles.errorText, { color: palette.text }]}>{error}</Text>
                <Text style={[styles.errorRetry, { color: palette.danger }]}>{t('general.retry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {upcomingTrips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={[
              styles.tripCard,
              { backgroundColor: palette.card, shadowColor: palette.shadow, borderColor: palette.border },
            ]}
            onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
          >
            <Image source={buildImageSource(trip)} style={styles.tripImage} />
            <View style={styles.tripInfo}>
              <Text style={[styles.tripTitle, { color: palette.text }]}>{trip.title}</Text>
              <View style={styles.tripDate}>
                <Ionicons name="calendar-outline" size={16} color={palette.icon} />
                <Text style={[styles.tripDateText, { color: palette.muted }]}>{`${trip.startDate} - ${trip.endDate}`}</Text>
              </View>
              <View style={[styles.tripBadge, { backgroundColor: palette.glass, borderColor: palette.border }]}>
                <Text style={[styles.tripBadgeText, { color: palette.tint }]}>
                  {t('home.daysLeft', { count: formatDaysLeft(trip.startDate) })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.section, styles.quickActionsSection, { borderColor: palette.border }]}>
          <Text style={{ ...styles.sectionTitle, paddingHorizontal: 12, color: palette.text }}>
            {t('home.quickActions')}
          </Text>
          <View style={[styles.quickActionsGrid, isWide && styles.quickActionsGridWide]}>
            <TouchableOpacity onPress={() => router.push('/modal/add-trip')}>
              <LinearGradient colors={palette.actionGradient} style={[styles.quickActionCard, { shadowColor: palette.shadow }]}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.newTrip')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
              <LinearGradient colors={palette.deepGradient} style={[styles.quickActionCard, { shadowColor: palette.shadow }]}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.addPhoto')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/trips', params: { view: 'map' } })}>
              <LinearGradient colors={palette.heroGradient} style={[styles.quickActionCard, { shadowColor: palette.shadow }]}>
                <Ionicons name="map-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.explore')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.activitySection, { borderColor: palette.border }]}>
          <View style={{ paddingHorizontal: 12 }}>
            <Text style={{ ...styles.sectionTitle, paddingHorizontal: 12, color: palette.text }}>
              {t('home.recentActivity')}
            </Text>
            {activities.length === 0 && !isLoading ? (
              <Text style={[styles.activityEmpty, { color: palette.muted }]}>{t('general.loading')}</Text>
            ) : (
              activities.map((activity) => (
                <View
                  style={[
                    styles.activityCard,
                    { backgroundColor: palette.card, shadowColor: palette.shadow, borderColor: palette.border },
                  ]}
                  key={activity.id}>
                  <Ionicons name={activity.icon as any} size={24} color={palette.icon} style={styles.activityIcon} />
                  <View>
                    <Text style={[styles.activityText, { color: palette.text }]}>{activity.text}</Text>
                    <Text style={[styles.activityTime, { color: palette.muted }]}>{activity.time}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
  },
  firstnameText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  homeContent: {
    padding: 24,
    paddingBottom: 0,
    marginBottom: 0,
  },
  section: {
    marginBottom: 24,
    marginTop: 8,
    borderBottomWidth: 1,
  },
  quickActionsSection: {
    borderTopWidth: 0,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  activitySection: {
    borderBottomWidth: 1,
    paddingBottom: 12,
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
  },
  homeSeeAllBtn: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripCard: {
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    alignSelf: 'center',
    width: '92%',
    maxWidth: 1000,
  },
  tripImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tripDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tripDateText: {
    fontSize: 14,
  },
  tripBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  tripBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  quickActionsGridWide: {
    gap: 16,
    justifyContent: 'flex-start',
  },
  quickActionCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  activityEmpty: {
    paddingHorizontal: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  errorText: {
  },
  errorRetry: {
    marginTop: 4,
    fontWeight: '600',
  },
});
