import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/utils/env';
import { auth } from './auth';

const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@offline_queue',
  CACHED_TRIPS: '@cached_trips',
};

export type QueueActionType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface QueueAction {
  id: string;
  type: QueueActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  timestamp: number;
}

export interface TripPayload {
  id?: string;
  title: string;
  destination: string;
  city?: string;
  country?: string;
  startDate: string;
  endDate: string;
  description: string;
  image?: string;
  photos?: string[];
  location?: { lat: number; lng: number };
}

const pingBackend = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`${config.mockBackendUrl}/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const getQueue = async (): Promise<QueueAction[]> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
  return stored ? JSON.parse(stored) : [];
};

const addToQueue = async (action: Omit<QueueAction, 'id' | 'timestamp'>): Promise<void> => {
  const queue = await getQueue();
  const newAction: QueueAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  queue.push(newAction);
  await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
};

const removeFromQueue = async (actionId: string): Promise<void> => {
  const queue = await getQueue();
  const filtered = queue.filter((a) => a.id !== actionId);
  await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
};

const syncQueue = async (): Promise<{ synced: number; failed: number }> => {
  const online = await pingBackend();
  if (!online) return { synced: 0, failed: 0 };

  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      const response = await auth.fetch(`${config.mockBackendUrl}${action.endpoint}`, {
        method: action.method,
        body: JSON.stringify(action.payload),
        headers: { 'Content-Type': 'application/json' },
      } as any);
      if (response.ok) {
        await removeFromQueue(action.id);
        synced++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { synced, failed };
};

const cacheTrips = async (trips: TripPayload[]): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.CACHED_TRIPS,
    JSON.stringify({
      data: trips,
      cachedAt: Date.now(),
    })
  );
};

const getCachedTrips = async (): Promise<TripPayload[] | null> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TRIPS);
  if (stored) {
    const { data } = JSON.parse(stored);
    return data;
  }
  return null;
};

export const OFFLINE = {
  pingBackend,
  getQueue,
  addToQueue,
  removeFromQueue,
  syncQueue,
  cacheTrips,
  getCachedTrips,
};
