import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';

import { API } from '@/services/api';
import { Trip } from '@/types/models';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 880;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1080 : undefined, alignSelf: 'center' };

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

  const handleToggleFavorite = async () => {
    if (!id || !trip) return;
    try {
      setIsActionLoading(true);
      const res = await API.toggleLike(id);
      setTrip({ ...trip, liked: res.liked, likesCount: res.likesCount });
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de mettre à jour le favori');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce voyage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsActionLoading(true);
            await API.deleteTrip(id);
            router.back();
          } catch (err) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Suppression impossible');
          } finally {
            setIsActionLoading(false);
          }
        },
      },
    ]);
  };

  const cover =
    (trip?.image && { uri: trip.image }) ||
    (trip?.photos?.[0] && { uri: trip.photos[0] }) ||
    require('@/assets/images/paris.jpeg');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={[styles.topBar, layoutWidth]}>
        <TouchableOpacity style={[styles.backButton, { borderColor: palette.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={palette.text} />
          <Text style={[styles.backText, { color: palette.text }]}>{t('trips.openDetails')}</Text>
        </TouchableOpacity>

        {trip && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: palette.border }]}
              onPress={handleToggleFavorite}
              disabled={isActionLoading}>
              <Ionicons
                name={trip.liked ? 'heart' : 'heart-outline'}
                size={18}
                color={trip.liked ? palette.danger : palette.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: palette.border }]}
              onPress={() => router.push({ pathname: '/modal/add-trip', params: { id } })}>
              <Ionicons name="pencil" size={18} color={palette.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: palette.border }]}
              onPress={handleDelete}
              disabled={isActionLoading}>
              <Ionicons name="trash" size={18} color={palette.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading && <ActivityIndicator color={palette.tint} style={{ marginTop: 12 }} />}
      {error && <Text style={[styles.error, { color: palette.danger }, layoutWidth]}>{error}</Text>}

      {trip && (
        <ScrollView>
          <Image source={cover} style={styles.cover} contentFit="cover" />
          <View
            style={[
              styles.content,
              { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow },
              layoutWidth,
            ]}>
            <Text style={[styles.title, { color: palette.text }]}>{trip.title}</Text>
            <View style={styles.row}>
              <Ionicons name="location-outline" size={18} color={palette.icon} />
              <Text style={[styles.subtitle, { color: palette.muted }]}>{trip.destination}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={18} color={palette.icon} />
              <Text style={[styles.subtitle, { color: palette.muted }]}>
                {trip.startDate} - {trip.endDate}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.metaChip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Ionicons name="camera-outline" size={16} color={palette.icon} />
                <Text style={[styles.metaText, { color: palette.muted }]}>{trip.photosCount ?? trip.photos?.length ?? 0} photos</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Ionicons name="heart" size={16} color={palette.danger} />
                <Text style={[styles.metaText, { color: palette.muted }]}>{trip.likesCount ?? 0}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Ionicons name="chatbubbles-outline" size={16} color={palette.icon} />
                <Text style={[styles.metaText, { color: palette.muted }]}>{trip.commentsCount ?? 0}</Text>
              </View>
            </View>
            {!!trip.description && <Text style={[styles.description, { color: palette.text }]}>{trip.description}</Text>}

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
                <Image key={photo} source={{ uri: photo }} style={[styles.photo, { borderColor: palette.border }]} contentFit="cover" />
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
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backText: {
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  cover: {
    height: 240,
    width: '100%',
  },
  content: {
    padding: 16,
    margin: 12,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  subtitle: {
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaText: {
    fontWeight: '600',
  },
  description: {
    marginTop: 12,
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
    borderWidth: 1,
  },
  error: {
    paddingHorizontal: 16,
  },
});
