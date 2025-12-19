import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTrips } from '@/hooks/use-trips';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/contexts/i18n-context';

interface PhotoItem {
  url: string;
  tripId: string;
  tripTitle: string;
  country: string;
  startDate?: string;
  endDate?: string;
}

export default function CollectionScreen() {
  const { rawTrips, isLoading, error, refresh } = useTrips();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1080 : undefined, alignSelf: 'center' };

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const photos: PhotoItem[] = useMemo(
    () =>
      rawTrips.flatMap((trip) =>
        (trip.photos || []).map((url) => ({
          url,
          tripId: trip.id,
          tripTitle: trip.title,
          country: trip.country || (trip.destination?.split(',').pop()?.trim() || ''),
          startDate: trip.startDate,
          endDate: trip.endDate,
        }))
      ),
    [rawTrips]
  );

  const countries = useMemo(
    () => Array.from(new Set(photos.map((p) => p.country).filter(Boolean))),
    [photos]
  );
  const tripOptions = useMemo(
    () => rawTrips.map((trip) => ({ id: trip.id, title: trip.title })),
    [rawTrips]
  );

  const filteredPhotos = useMemo(() => {
    return photos.filter((item) => {
      if (selectedCountry && item.country !== selectedCountry) return false;
      if (selectedTripId && item.tripId !== selectedTripId) return false;
      const start = item.startDate ? new Date(item.startDate).getTime() : null;
      const end = item.endDate ? new Date(item.endDate).getTime() : start;
      if (fromDate && start !== null && start < fromDate.getTime()) return false;
      if (toDate && end !== null && end > toDate.getTime()) return false;
      return true;
    });
  }, [photos, selectedCountry, selectedTripId, fromDate, toDate]);

  const renderChip = (label: string, isActive: boolean, onPress: () => void, key?: string) => (
    <TouchableOpacity
      key={key ?? label}
      style={[
        styles.chip,
        { borderColor: palette.border },
        isActive && { backgroundColor: palette.tint, borderColor: palette.tint, shadowColor: palette.shadow },
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles.chipText,
          { color: palette.text },
          isActive && { color: palette.background, fontWeight: '700' },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, layoutWidth]}>
        <Text style={[styles.title, { color: palette.text }]}>{t('collection.title')}</Text>

        <View style={[styles.filtersCard, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('home.filters')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {renderChip(t('collection.filterCountry'), Boolean(selectedCountry), () => setSelectedCountry(null), 'reset-country')}
            {countries.map((country) =>
              renderChip(country, selectedCountry === country, () => setSelectedCountry(country), `country-${country}`)
            )}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {renderChip(t('collection.filterTrip'), Boolean(selectedTripId), () => setSelectedTripId(null), 'reset-trip')}
            {tripOptions.map((trip) =>
              renderChip(trip.title, selectedTripId === trip.id, () => setSelectedTripId(trip.id), `trip-${trip.id}`)
            )}
          </ScrollView>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
              onPress={() => setShowFromPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={palette.icon} />
              <Text style={[styles.dateLabel, { color: palette.text }]}>
                {fromDate ? fromDate.toLocaleDateString() : t('collection.filterFrom')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
              onPress={() => setShowToPicker(true)}>
              <Ionicons name="calendar" size={16} color={palette.icon} />
              <Text style={[styles.dateLabel, { color: palette.text }]}>
                {toDate ? toDate.toLocaleDateString() : t('collection.filterTo')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowFromPicker(false);
              if (date) setFromDate(date);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowToPicker(false);
              if (date) setToDate(date);
            }}
          />
        )}

        {isLoading && <ActivityIndicator color={palette.tint} style={{ marginTop: 12 }} />}
        {error && (
          <TouchableOpacity style={[styles.errorBox, { borderColor: palette.danger }]} onPress={refresh}>
            <Text style={[styles.errorText, { color: palette.text }]}>{error}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: palette.text }]}>
            {t('collection.totalPhotos', { count: filteredPhotos.length })}
          </Text>
          <TouchableOpacity onPress={() => { setSelectedCountry(null); setSelectedTripId(null); setFromDate(null); setToDate(null); }}>
            <Text style={[styles.resetText, { color: palette.tint }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        {filteredPhotos.length === 0 && !isLoading ? (
          <View style={[styles.emptyBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Ionicons name="images-outline" size={36} color={palette.icon} />
            <Text style={[styles.emptyText, { color: palette.text }]}>{t('collection.empty')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredPhotos.map((photo) => (
              <View key={`${photo.url}-${photo.tripId}`} style={[styles.photoCard, { borderColor: palette.border }]}>
                <Image source={{ uri: photo.url }} style={styles.photo} contentFit="cover" />
                <View style={styles.photoMeta}>
                  <Text style={[styles.photoTitle, { color: palette.text }]} numberOfLines={1}>
                    {photo.tripTitle}
                  </Text>
                  <Text style={[styles.photoSubtitle, { color: palette.muted }]} numberOfLines={1}>
                    {photo.country}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  filtersCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chipText: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    height: 160,
    width: '100%',
  },
  photoMeta: {
    padding: 8,
    gap: 2,
  },
  photoTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  photoSubtitle: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    marginTop: 8,
    fontWeight: '600',
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetText: {
    fontWeight: '700',
  },
});
