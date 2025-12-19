import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API } from '@/services/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function JournalDetail() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<Array<any>>([]);
  const [tripTitle, setTripTitle] = useState<string>('');
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (!tripId) return;
    let mounted = true;
    const load = async () => {
      try {
        const full = await API.getTrip(tripId as string);
        if (!mounted) return;
        setTripTitle(full?.title || 'Voyage');
        setEntries(full?.journalEntries || []);
      } catch (err) {
        // ignore for now
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: palette.text }]}>{'‹ Retour'}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]} numberOfLines={1}>{tripTitle}</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 ? (
          <Text style={{ color: palette.muted }}>Aucune entrée</Text>
        ) : (
          entries.map((e: any, idx: number) => (
            <View key={e.id ?? idx} style={[styles.entryCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
              <Text style={[styles.entryMeta, { color: palette.muted }]}>{(e.date ? e.date : '') + (e.time ? ` ${e.time}` : '')}</Text>
              <Text style={[styles.entryContent, { color: palette.text }]}>{e.content}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 64,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  entryCard: {
    width: '100%',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  entryMeta: {
    fontSize: 12,
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 22,
  },
});
