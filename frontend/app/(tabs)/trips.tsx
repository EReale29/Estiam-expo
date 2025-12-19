import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';

import { useTrips, TripFilter, TripView } from '@/hooks/use-trips';
import { Trip } from '@/types/models';
import { useI18n } from '@/contexts/i18n-context';

const formatDate = (value: string) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
};

const TripCard = ({ trip, onPress }: { trip: Trip; onPress: () => void }) => {
  const cover =
    (trip.image && { uri: trip.image }) ||
    (trip.photos?.[0] && { uri: trip.photos[0] }) ||
    require('@/assets/images/paris.jpeg');

  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress}>
      <View style={styles.tripImageContainer}>
        <Image source={cover} style={styles.tripImageBg} contentFit="cover" />
        <View style={styles.tripImageOverlay} />
        <View style={styles.tripImageContent}>
          <Text style={styles.tripCardTitle}>{trip.title}</Text>
          <View style={styles.tripLocation}>
            <Ionicons name="location-outline" size={16} color="white" />
            <Text style={styles.tripLocationText}>{trip.destination}</Text>
          </View>
        </View>
      </View>
      <View style={styles.tripCardInfo}>
        <View style={styles.tripDate}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.tripDateText}>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );
};

export default function TripsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ view?: TripView }>();
  const { trips, view, setView, filter, setFilter, query, setQuery, isLoading, error, refresh } = useTrips();

  useEffect(() => {
    if (params.view === 'map' || params.view === 'list') {
      setView(params.view);
    }
  }, [params.view, setView]);

  const filters: { label: string; value: TripFilter }[] = useMemo(
    () => [
      { label: t('trips.filters.all'), value: 'all' },
      { label: t('trips.filters.upcoming'), value: 'upcoming' },
      { label: t('trips.filters.past'), value: 'past' },
    ],
    [t]
  );

  const handleOpenTrip = (tripId: string) => {
    router.push({ pathname: '/trip/[id]', params: { id: tripId } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('trips.title')}</Text>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('trips.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setView(view === 'list' ? 'map' : 'list')}>
            <Ionicons name={view === 'list' ? 'map-outline' : 'list-outline'} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={styles.tabsContent}>
          {filters.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, filter === tab.value && styles.tabActive]}
              onPress={() => setFilter(tab.value)}
            >
              <Text style={[styles.tabText, filter === tab.value && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && <ActivityIndicator color="#a855f7" style={{ marginTop: 16 }} />}
        {error && (
          <TouchableOpacity style={styles.errorBox} onPress={refresh}>
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        )}

        {!isLoading && trips.length === 0 && !error && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{t('trips.empty')}</Text>
            <TouchableOpacity onPress={() => router.push('/modal/add-trip')}>
              <Text style={styles.homeSeeAllBtn}>{t('home.newTrip')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {view === 'list' ? (
          <View style={styles.tripsList}>
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onPress={() => handleOpenTrip(trip.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 20,
                longitude: 0,
                latitudeDelta: 120,
                longitudeDelta: 120,
              }}
            >
              {trips.map((trip) => {
                const coords = trip.location || { lat: 0, lng: 0 };
                if (coords.lat === 0 && coords.lng === 0) return null;
                return (
                  <Marker
                    key={trip.id}
                    coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                    title={trip.title}
                    description={trip.destination}
                    onPress={() => handleOpenTrip(trip.id)}
                  />
                );
              })}
            </MapView>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/modal/add-trip')}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#a855f7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabsContent: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  tabActive: {
    backgroundColor: '#a855f7',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  tripsList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  tripImageContainer: {
    position: 'relative',
    height: 192,
    backgroundColor: '#a855f7',
  },
  tripImageBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  tripImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tripImageContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  tripCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripLocationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  tripCardInfo: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripDateText: {
    color: '#6b7280',
    fontSize: 14,
  },
  mapContainer: {
    height: 380,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  map: {
    flex: 1,
  },
  fabButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#a855f7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyBox: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  homeSeeAllBtn: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorBox: {
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorText: {
    color: '#b91c1c',
  },
});
