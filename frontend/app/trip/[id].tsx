import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';

import { API } from '@/services/api';
import { Trip } from '@/types/models';
import { useI18n } from '@/contexts/i18n-context';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchTrip = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await API.getTrip(id);
        setTrip(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load trip');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const cover =
    (trip?.image && { uri: trip.image }) ||
    (trip?.photos?.[0] && { uri: trip.photos[0] }) ||
    require('@/assets/images/paris.jpeg');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#111827" />
        <Text style={styles.backText}>{t('trips.openDetails')}</Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator color="#a855f7" style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {trip && (
        <ScrollView>
          <Image source={cover} style={styles.cover} contentFit="cover" />
          <View style={styles.content}>
            <Text style={styles.title}>{trip.title}</Text>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <Text style={styles.subtitle}>{trip.destination}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              <Text style={styles.subtitle}>
                {trip.startDate} - {trip.endDate}
              </Text>
            </View>
            {!!trip.description && <Text style={styles.description}>{trip.description}</Text>}

            {trip.location && trip.location.lat !== 0 && trip.location.lng !== 0 && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: trip.location.lat,
                    longitude: trip.location.lng,
                    latitudeDelta: 0.4,
                    longitudeDelta: 0.4,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: trip.location.lat, longitude: trip.location.lng }}
                    title={trip.title}
                  />
                </MapView>
              </View>
            )}

            <View style={styles.photosContainer}>
              {trip.photos?.map((photo) => (
                <Image key={photo} source={{ uri: photo }} style={styles.photo} contentFit="cover" />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 16,
  },
  backText: {
    color: '#111827',
    fontWeight: '600',
  },
  cover: {
    height: 240,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
  },
  description: {
    marginTop: 12,
    color: '#111827',
    lineHeight: 20,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  map: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  photo: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  error: {
    color: '#b91c1c',
    paddingHorizontal: 16,
  },
});
