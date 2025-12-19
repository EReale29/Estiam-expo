import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import DateTimePicker from '@react-native-community/datetimepicker';

import { API } from '@/services/api';
import { isEndDateAfterStart, isValidDestination, isValidName } from '@/utils/validation';
import { useI18n } from '@/contexts/i18n-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AddTripModal() {
  const router = useRouter();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [tripTitle, setTripTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<Array<string>>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const isPhysicalDevice = Device.isDevice;

  const ensureDevice = (feature: string) => {
    if (!isPhysicalDevice) {
      Alert.alert('Simulateur', `La fonctionnalité "${feature}" nécessite un appareil réel.`);
      return false;
    }
    return true;
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const showPermissionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ouvrir les paramètres', onPress: openAppSettings },
    ]);
  };

  const pickImage = async () => {
    if (!ensureDevice('Galerie')) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        showPermissionAlert('Permission Galerie refusée', t('addTrip.permissionLibrary'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const selectedUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prevImages) => [...prevImages, ...selectedUris]);
      }
    } catch (error) {
      console.error('Error picking image: ', error);
    }
  };

  const takePhoto = async () => {
    if (!ensureDevice('Camera')) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showPermissionAlert('Permission refusée', t('addTrip.permissionCamera'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        const photoUri = result.assets[0].uri;
        setSelectedImages((prevImages) => [...prevImages, photoUri]);
      }
    } catch (error) {
      console.log('Error taking photo: ', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showPermissionAlert('Permission Localisation refusée', t('addTrip.permissionLocation'));
        return;
      }

      let position = await Location.getLastKnownPositionAsync();
      if (!position) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000,
          timeout: 5000,
        });
      }

      if (!position) {
        Alert.alert('Erreur', t('addTrip.permissionLocation'));
        return;
      }

      const address = await Location.reverseGeocodeAsync(position.coords);
      if (address.length > 0) {
        const addr = address[0];
        const city = addr.city || addr.name || '';
        const country = addr.country || '';
        const formattedAddress = `${city}${city && country ? ', ' : ''}${country}`.trim();
        setDestination(formattedAddress);
      }
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch (error) {
      console.log('Error getting location: ', error);
      Alert.alert('Erreur', t('addTrip.permissionLocation'));
      setLocation(undefined);
    }
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      return { cover: '', photos: [] as string[] };
    }

    const uploadedPhotos: string[] = [];
    for (let i = 0; i < selectedImages.length; i++) {
      const uploadedUrl = await API.uploadImage(selectedImages[i]);
      uploadedPhotos.push(uploadedUrl);
      const progress = Math.round(((i + 1) / selectedImages.length) * 100);
      setUploadProgress(progress);
    }

    return { cover: uploadedPhotos[0] ?? '', photos: uploadedPhotos };
  };

  const geocodeDestination = async (): Promise<{ lat: number; lng: number } | undefined> => {
    const query = destination.trim();
    if (!query) return undefined;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TravelMateApp/1.0 (expo)'
        }
      });
      if (!response.ok) {
        return undefined;
      }
      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!data || data.length === 0) {
        return undefined;
      }
      const first = data[0];
      return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
    } catch {
      return undefined;
    }
  };

  const handleSaveTrip = async () => {
    if (!isValidName(tripTitle)) {
      Alert.alert(t('addTrip.required'));
      return;
    }
    if (!isValidDestination(destination)) {
      Alert.alert(t('addTrip.destinationFormat'));
      return;
    }
    if (!isEndDateAfterStart(startDate, endDate)) {
      Alert.alert(t('addTrip.dateError'));
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { cover, photos } = await uploadImages();
      const resolvedLocation = await geocodeDestination();
      if (!resolvedLocation) {
        Alert.alert('Erreur', t('addTrip.destinationFormat'));
        return;
      }

      const newTrip = await API.createTrip({
        title: tripTitle,
        destination,
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        description,
        image: cover,
        photos,
        location: resolvedLocation,
      });

      Alert.alert('Succès', t('addTrip.success'), [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
      return newTrip;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('addTrip.failure');
      Alert.alert('Erreur', message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (date: Date | null) => (date ? date.toLocaleDateString() : '');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Text style={styles.title}>{t('addTrip.title')}</Text>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.label}>{t('addTrip.cover')}</Text>
          <View style={styles.photoUpload}>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color={palette.tint} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="image" size={32} color={palette.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoText}>{t('home.addPhoto')}</Text>
            <Text style={styles.photoSubText}>Access camera and photos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addTrip.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('addTrip.titleLabel')}
            value={tripTitle}
            onChangeText={setTripTitle}
            placeholderTextColor={palette.muted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('addTrip.destination')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={16} color={palette.muted} />
            <TextInput
              style={styles.inputFlex}
              placeholder={t('addTrip.destinationHint')}
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor={palette.muted}
            />
            <TouchableOpacity onPress={getLocation}>
              <Text style={styles.gpsButton}>
                <Ionicons name="location-outline" size={16} color={palette.tint} /> {t('addTrip.useLocation')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.label}>{t('addTrip.startDate')}</Text>
              <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={24} color={palette.muted} />
                <Text style={styles.inputFlex}>{formatDate(startDate) || t('addTrip.startDate')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.label}>{t('addTrip.endDate')}</Text>
              <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar-outline" size={24} color={palette.muted} />
                <Text style={styles.inputFlex}>{formatDate(endDate) || t('addTrip.endDate')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>

        <View>
          <Text style={styles.label}>{t('addTrip.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('addTrip.description')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor={palette.muted}
          />
        </View>

        {isUploading && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressInfo}>
                <Ionicons name="cloud-upload-outline" size={24} color={palette.tint} />
                <Text style={styles.progressText}>{t('general.loading')}</Text>
              </View>
              <Text style={styles.progressPercent}>{uploadProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={palette.actionGradient}
                style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTrip} disabled={isUploading}>
          <LinearGradient colors={palette.actionGradient} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.saveButtonText}>{isUploading ? t('addTrip.uploading') : t('addTrip.create')}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: palette.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: palette.text,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      color: palette.muted,
      marginBottom: 8,
      fontWeight: '600',
    },
    photoUpload: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: palette.border,
      padding: 12,
    },
    photoButtons: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
      paddingVertical: 16,
    },
    photoButton: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: palette.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: palette.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: palette.border,
    },
    photoText: {
      fontSize: 14,
      color: palette.text,
    },
    photoSubText: {
      fontSize: 12,
      color: palette.muted,
      marginTop: 4,
    },
    input: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: palette.text,
      borderWidth: 1,
      borderColor: palette.border,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 12,
    },
    gpsButton: {
      color: palette.tint,
      fontSize: 14,
      fontWeight: '600',
    },
    inputFlex: {
      flex: 1,
      fontSize: 16,
      color: palette.text,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateColumn: {
      flex: 1,
    },
    textArea: {
      height: 100,
      paddingTop: 12,
    },
    progressCard: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: palette.border,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    progressText: {
      fontSize: 14,
      color: palette.text,
    },
    progressPercent: {
      fontSize: 14,
      color: palette.tint,
      fontWeight: '600',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: palette.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
    },
    saveButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    gradientButton: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonText: {
      color: palette.background,
      fontSize: 16,
      fontWeight: '600',
    },
  });
