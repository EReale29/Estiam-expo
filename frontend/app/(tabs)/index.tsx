import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDashboard } from '@/hooks/use-dashboard';
import { useI18n } from '@/contexts/i18n-context';
import { Trip } from '@/types/models';
import { useAuth } from '@/contexts/auth-context';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>{t('home.greeting')}</Text>
              <Text style={styles.firstnameText}>{user?.name || 'TravelMate'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/(tabs)/notification')}>
              <Ionicons name="notifications-outline" size={24} color="rgba(255, 255, 255, 0.9)" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon} color="#fff" style={styles.statIcon} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.homeContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.upcoming')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
                <Text style={styles.homeSeeAllBtn}>{t('general.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {isLoading && <ActivityIndicator color="#a855f7" />}
            {error && (
              <TouchableOpacity onPress={refresh} style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorRetry}>{t('general.retry')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {upcomingTrips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
          >
            <Image source={buildImageSource(trip)} style={styles.tripImage} />
            <View style={styles.tripInfo}>
              <Text style={styles.tripTitle}>{trip.title}</Text>
              <View style={styles.tripDate}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.tripDateText}>{`${trip.startDate} - ${trip.endDate}`}</Text>
              </View>
              <View style={styles.tripBadge}>
                <Text style={styles.tripBadgeText}>{t('home.daysLeft', { count: formatDaysLeft(trip.startDate) })}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, paddingHorizontal: 12 }}>{t('home.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity onPress={() => router.push('/modal/add-trip')}>
              <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.quickActionCard}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.newTrip')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(tabs)/trips')}>
              <LinearGradient colors={['#3b82f6', '#06b6d4']} style={styles.quickActionCard}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.addPhoto')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/trips', params: { view: 'map' } })}>
              <LinearGradient colors={['#10b981', '#059669']} style={styles.quickActionCard}>
                <Ionicons name="map-outline" size={24} color="#fff" />
                <Text style={styles.quickActionLabel}>{t('home.explore')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ paddingHorizontal: 12 }}>
            <Text style={{ ...styles.sectionTitle, paddingHorizontal: 12 }}>{t('home.recentActivity')}</Text>
            {activities.length === 0 && !isLoading ? (
              <Text style={styles.activityEmpty}>{t('general.loading')}</Text>
            ) : (
              activities.map((activity) => (
                <View style={styles.activityCard} key={activity.id}>
                  <Ionicons name={activity.icon as any} size={24} color="#6b7280" style={styles.activityIcon} />
                  <View>
                    <Text style={styles.activityText}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
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
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 24,
  },
  firstnameText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: '#111827',
  },
  homeSeeAllBtn: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#111827',
    marginBottom: 4,
  },
  tripDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tripDateText: {
    color: '#6b7280',
    fontSize: 14,
  },
  tripBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tripBadgeText: {
    color: '#7c3aed',
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
  quickActionCard: {
    width: 110,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityEmpty: {
    color: '#6b7280',
    paddingHorizontal: 12,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#b91c1c',
  },
  errorRetry: {
    color: '#7c3aed',
    marginTop: 4,
    fontWeight: '600',
  },
});
