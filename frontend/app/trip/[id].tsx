import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { API } from '@/services/api';
import { Trip, TripActivity, TripJournalEntry } from '@/types/models';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [activityForm, setActivityForm] = useState({ title: '', description: '' });
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [activityTime, setActivityTime] = useState<Date | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [notesForm, setNotesForm] = useState({ title: '', content: '' });
  const [journalDate, setJournalDate] = useState<Date | null>(null);
  const [journalTime, setJournalTime] = useState<Date | null>(null);
  const [journalEntries, setJournalEntries] = useState<TripJournalEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [showActivityDatePicker, setShowActivityDatePicker] = useState(false);
  const [showActivityTimePicker, setShowActivityTimePicker] = useState(false);
  const [showJournalDatePicker, setShowJournalDatePicker] = useState(false);
  const [showJournalTimePicker, setShowJournalTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 880;
  const layoutWidth = { width: '100%', maxWidth: isWide ? 1080 : undefined, alignSelf: 'center' };
  const toTimestamp = (dateStr?: string, timeStr?: string, fallback?: number) => {
    if (dateStr) {
      const iso = `${dateStr}${timeStr ? `T${timeStr}` : 'T00:00'}`;
      const ts = new Date(iso).getTime();
      if (!Number.isNaN(ts)) return ts;
    }
    return fallback ?? 0;
  };
  const formatDisplayDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr && !timeStr) return '';
    const [year, month, day] = (dateStr || '').split('-');
    const formattedDate = dateStr ? `${day?.padStart(2, '0')}-${month?.padStart(2, '0')}-${year}` : '';
    const formattedTime = timeStr ? timeStr.padStart(5, '0') : '';
    const payload = [formattedDate, formattedTime].filter(Boolean).join(' | ');
    return payload ? `[${payload}]` : '';
  };
  const formatDateLabel = (date?: Date | null) => (date ? formatDisplayDateTime(formatDateForStorage(date), '') : 'Date');
  const formatTimeLabel = (date?: Date | null) => (date ? formatDisplayDateTime('', formatTimeForStorage(date)) : 'Heure');
  const sortedJournalEntries = useMemo(
    () =>
      [...journalEntries].sort((a, b) => {
        const tsA = toTimestamp(a.date, a.time, a.created_at);
        const tsB = toTimestamp(b.date, b.time, b.created_at);
        return tsA - tsB;
      }),
    [journalEntries]
  );

  useEffect(() => {
    if (!id) return;
    const fetchTrip = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await API.getTrip(id);
        setTrip(data);
        setActivities(data.activities || []);
        setJournalEntries(data.journalEntries || []);
        setNotesForm((prev) => ({ ...prev, content: data.notes || '' }));
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

  const handleSaveNotes = async () => {
    if (!trip) return;
    if (!notesForm.title.trim()) {
      Alert.alert('Titre requis', 'Ajoutez un titre pour le journal');
      return;
    }
    try {
      setIsActionLoading(true);
      const payload = {
        ...notesForm,
        date: journalDate ? formatDateForStorage(journalDate) : undefined,
        time: journalTime ? formatTimeForStorage(journalTime) : undefined,
      };
      if (editingEntryId) {
        const res = await API.updateTripJournalEntry(trip.id, editingEntryId, payload);
        setJournalEntries((prev) => prev.map((e) => (e.id === editingEntryId ? res.entry : e)));
      } else {
        const res = await API.addTripJournalEntry(trip.id, payload);
        setJournalEntries((prev) => [...prev, res.entry]);
      }
      setNotesForm({ title: '', content: '' });
      setJournalDate(null);
      setJournalTime(null);
      setEditingEntryId(null);
      setIsNotesModalVisible(false);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de sauvegarder le journal');
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetActivityForm = () => {
    setActivityForm({ title: '', description: '' });
    setActivityDate(null);
    setActivityTime(null);
    setEditingActivityId(null);
  };

  const parseDateValue = (value?: string | null) => {
    if (value) {
      const parsed = new Date(`${value}T00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const parseTimeValue = (value?: string | null) => {
    const base = new Date();
    if (value) {
      const [hours, minutes] = value.split(':').map((v) => parseInt(v, 10));
      if (!Number.isNaN(hours)) {
        base.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
        return base;
      }
    }
    base.setSeconds(0, 0);
    return base;
  };

  const formatDateForStorage = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForStorage = (date: Date) => {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmitActivity = async () => {
    if (!trip) return;
    if (!activityForm.title.trim()) {
      Alert.alert('Titre requis', 'Ajoutez un titre pour l’activité');
      return;
    }
    try {
      setIsActionLoading(true);
      if (editingActivityId) {
        const res = await API.updateTripActivity(trip.id, editingActivityId, {
          ...activityForm,
          date: activityDate ? formatDateForStorage(activityDate) : undefined,
          time: activityTime ? formatTimeForStorage(activityTime) : undefined,
        });
        setActivities((prev) => prev.map((a) => (a.id === editingActivityId ? res.activity : a)));
      } else {
        const res = await API.addTripActivity(trip.id, {
          ...activityForm,
          date: activityDate ? formatDateForStorage(activityDate) : undefined,
          time: activityTime ? formatTimeForStorage(activityTime) : undefined,
        });
        setActivities((prev) => [...prev, res.activity]);
      }
      setTrip((prev) => (prev ? { ...prev, activitiesCount: (prev.activitiesCount || 0) + (editingActivityId ? 0 : 1) } : prev));
      resetActivityForm();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : "Impossible d'enregistrer l'activité");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleActivityDateChange = (_event: any, selectedDate?: Date) => {
    setShowActivityDatePicker(false);
    if (!selectedDate) return;
    setActivityDate(selectedDate);
  };

  const handleActivityTimeChange = (_event: any, selectedTime?: Date) => {
    setShowActivityTimePicker(false);
    if (!selectedTime) return;
    setActivityTime(selectedTime);
  };

  const handleJournalDateChange = (_event: any, selectedDate?: Date) => {
    setShowJournalDatePicker(false);
    if (!selectedDate) return;
    setJournalDate(selectedDate);
  };

  const handleJournalTimeChange = (_event: any, selectedTime?: Date) => {
    setShowJournalTimePicker(false);
    if (!selectedTime) return;
    setJournalTime(selectedTime);
  };

  const handleEditActivity = (activity: TripActivity) => {
    setEditingActivityId(activity.id);
    setActivityForm({
      title: activity.title,
      description: activity.description || '',
    });
    setActivityDate(activity.date ? parseDateValue(activity.date) : null);
    setActivityTime(activity.time ? parseTimeValue(activity.time) : null);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!trip) return;
    try {
      setIsActionLoading(true);
      await API.deleteTripActivity(trip.id, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setTrip((prev) => (prev ? { ...prev, activitiesCount: Math.max(0, (prev.activitiesCount || 1) - 1) } : prev));
      if (editingActivityId === activityId) resetActivityForm();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : "Impossible de supprimer l'activité");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditJournal = (entry: TripJournalEntry) => {
    setEditingEntryId(entry.id);
    setNotesForm({
      title: entry.title,
      content: entry.content || '',
    });
    setJournalDate(entry.date ? parseDateValue(entry.date) : null);
    setJournalTime(entry.time ? parseTimeValue(entry.time) : null);
    setIsNotesModalVisible(true);
  };

  const handleDeleteJournal = async (entryId: string) => {
    if (!trip) return;
    try {
      setIsActionLoading(true);
      await API.deleteTripJournalEntry(trip.id, entryId);
      setJournalEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (editingEntryId === entryId) setEditingEntryId(null);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : "Impossible de supprimer l'entrée");
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
              <Text style={[styles.subtitle, { color: palette.muted }]}>{trip.destination || `${trip.city || ''}${trip.country ? `, ${trip.country}` : ''}`}</Text>
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
                <Ionicons name="list-outline" size={16} color={palette.icon} />
                <Text style={[styles.metaText, { color: palette.muted }]}>{trip.activitiesCount ?? activities.length} activités</Text>
              </View>
            </View>

            {!!trip.description && (
              <Text style={[styles.description, { color: palette.text }]}>{trip.description}</Text>
            )}

            <View style={[styles.cardSection, { borderColor: palette.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Journal de bord</Text>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.tint }]} onPress={() => setIsNotesModalVisible(true)}>
                  <Text style={[styles.saveButtonText, { color: palette.background }]}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {sortedJournalEntries.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.muted }]}>Aucune note</Text>
              ) : (
                sortedJournalEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.activityItem, { borderColor: palette.border }]}
                    onPress={() => handleEditJournal(entry)}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.activityTitle, { color: palette.text }]}>{entry.title}</Text>
                      <Text style={[styles.activityMeta, { color: palette.muted }]}>
                        {formatDisplayDateTime(entry.date, entry.time)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteJournal(entry.id)} style={[styles.iconButton, { borderColor: palette.border }]}>
                      <Ionicons name="trash" size={16} color={palette.danger} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={[styles.cardSection, { borderColor: palette.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Activités</Text>
              </View>
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                  placeholder="Titre de l'activité"
                  placeholderTextColor={palette.muted}
                  value={activityForm.title}
                  onChangeText={(text) => setActivityForm((prev) => ({ ...prev, title: text }))}
                  editable={!isActionLoading}
                />
                <TouchableOpacity
                  style={[styles.pickerButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
                  onPress={() => setShowActivityDatePicker(true)}
                  disabled={isActionLoading}>
                  <Text style={[styles.pickerButtonText, { color: palette.text }]}>{formatDateLabel(activityDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
                  onPress={() => setShowActivityTimePicker(true)}
                  disabled={isActionLoading}>
                  <Text style={[styles.pickerButtonText, { color: palette.text }]}>{formatTimeLabel(activityTime)}</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                  placeholder="Description"
                  placeholderTextColor={palette.muted}
                  value={activityForm.description}
                  onChangeText={(text) => setActivityForm((prev) => ({ ...prev, description: text }))}
                  editable={!isActionLoading}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: palette.tint }]}
                  onPress={handleSubmitActivity}
                  disabled={isActionLoading}>
                  <Text style={[styles.saveButtonText, { color: palette.background }]}>
                    {editingActivityId ? 'Mettre à jour' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
                {editingActivityId && (
                  <TouchableOpacity style={styles.cancelButton} onPress={resetActivityForm}>
                    <Text style={[styles.cancelButtonText, { color: palette.text }]}>Annuler</Text>
                  </TouchableOpacity>
                )}
              </View>

              {activities.length === 0 ? (
                <Text style={[styles.emptyText, { color: palette.muted }]}>Aucune activité</Text>
              ) : (
                activities.map((activity) => (
                  <View key={activity.id} style={[styles.activityItem, { borderColor: palette.border }]}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.activityTitle, { color: palette.text }]}>{activity.title}</Text>
                      {(activity.date || activity.time || activity.description) && (
                        <Text style={[styles.activityMeta, { color: palette.muted }]}>
                          {[formatDisplayDateTime(activity.date, activity.time), activity.description].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.activityActions}>
                      <TouchableOpacity onPress={() => handleEditActivity(activity)} style={[styles.iconButton, { borderColor: palette.border }]}>
                        <Ionicons name="pencil" size={16} color={palette.text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteActivity(activity.id)} style={[styles.iconButton, { borderColor: palette.border }]}>
                        <Ionicons name="trash" size={16} color={palette.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.cardSection, { borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Photos</Text>
              <View style={styles.photosContainer}>
                {trip.photos?.map((photo) => (
                  <Image key={photo} source={{ uri: photo }} style={[styles.photo, { borderColor: palette.border }]} contentFit="cover" />
                ))}
              </View>
            </View>

            {trip.location && trip.location.lat !== 0 && trip.location.lng !== 0 && (
              <View style={[styles.cardSection, { borderColor: palette.border }]}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>Carte</Text>
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
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {showActivityDatePicker && (
        <DateTimePicker
          value={activityDate || new Date()}
          mode="date"
          display="default"
          onChange={handleActivityDateChange}
        />
      )}
      {showActivityTimePicker && (
        <DateTimePicker
          value={activityTime || new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={handleActivityTimeChange}
        />
      )}
      {showJournalDatePicker && (
        <DateTimePicker
          value={journalDate || new Date()}
          mode="date"
          display="default"
          onChange={handleJournalDateChange}
        />
      )}
      {showJournalTimePicker && (
        <DateTimePicker
          value={journalTime || new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={handleJournalTimeChange}
        />
      )}

      <Modal visible={isNotesModalVisible} transparent animationType="fade" onRequestClose={() => setIsNotesModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{editingEntryId ? 'Modifier une note' : 'Ajouter une note'}</Text>
            {sortedJournalEntries.length > 0 && (
              <View style={{ gap: 8 }}>
                {sortedJournalEntries.map((entry) => (
                  <View key={entry.id} style={[styles.activityItem, { borderColor: palette.border }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.activityTitle, { color: palette.text }]}>{entry.title}</Text>
                      <Text style={[styles.activityMeta, { color: palette.muted }]}>
                        {formatDisplayDateTime(entry.date, entry.time)}
                      </Text>
                    </View>
                    <View style={styles.activityActions}>
                      <TouchableOpacity onPress={() => handleEditJournal(entry)} style={[styles.iconButton, { borderColor: palette.border }]}>
                        <Ionicons name="pencil" size={16} color={palette.text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteJournal(entry.id)} style={[styles.iconButton, { borderColor: palette.border }]}>
                        <Ionicons name="trash" size={16} color={palette.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              placeholder="Titre"
              placeholderTextColor={palette.muted}
              value={notesForm.title}
              onChangeText={(text) => setNotesForm((prev) => ({ ...prev, title: text }))}
              editable={!isActionLoading}
            />
            <TouchableOpacity
              style={[styles.pickerButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
              onPress={() => setShowJournalDatePicker(true)}
              disabled={isActionLoading}>
              <Text style={[styles.pickerButtonText, { color: palette.text }]}>{formatDateLabel(journalDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
              onPress={() => setShowJournalTimePicker(true)}
              disabled={isActionLoading}>
              <Text style={[styles.pickerButtonText, { color: palette.text }]}>{formatTimeLabel(journalTime)}</Text>
            </TouchableOpacity>
            <TextInput
              multiline
              style={[styles.notesInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder="Contenu"
              placeholderTextColor={palette.muted}
              value={notesForm.content}
              onChangeText={(text) => setNotesForm((prev) => ({ ...prev, content: text }))}
              editable={!isActionLoading}
            />
            <View style={styles.modalActions}>
              {editingEntryId && (
                <TouchableOpacity onPress={() => handleDeleteJournal(editingEntryId)} style={[styles.iconButton, { borderColor: palette.border }]}>
                  <Ionicons name="trash" size={16} color={palette.danger} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: palette.tint, flex: 1 }]}
                onPress={handleSaveNotes}
                disabled={isActionLoading}>
                <Text style={[styles.saveButtonText, { color: palette.background }]}>
                  {isActionLoading ? t('general.loading') : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsNotesModalVisible(false)} style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cardSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
  },
  formRow: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  activityItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityMeta: {
    fontSize: 14,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyText: {
    fontStyle: 'italic',
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
