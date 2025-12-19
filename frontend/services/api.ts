import { Trip, DashboardResponse } from '@/types/models';
import { http } from './http';
import { auth } from './auth';
import { OFFLINE, TripPayload } from './offline';
import { config } from '@/utils/env';

export interface TripInput {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  image?: string;
  photos?: string[];
  location?: { lat: number; lng: number };
}

export const API = {
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append(
      'file',
      {
        uri,
        name: filename,
        type,
      } as any
    );

    const response = await auth.fetch(`${config.mockBackendUrl}/uploads`, {
      method: 'POST',
      body: formData,
    } as any);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error uploading image');
    }

    const data = await response.json();
    return data.url;
  },

  async createTrip(trip: TripInput): Promise<Trip> {
    const online = await OFFLINE.pingBackend();

    if (online) {
      const created = await http.request<Trip>('/trips', {
        method: 'POST',
        body: JSON.stringify(trip),
      });
      return created;
    }

    await OFFLINE.addToQueue({
      type: 'CREATE',
      endpoint: '/trips',
      method: 'POST',
      payload: trip,
    });

    return {
      ...trip,
      id: `local-${Date.now()}`,
      photos: trip.photos || [],
    };
  },

  async getTrips(): Promise<Trip[]> {
    const online = await OFFLINE.pingBackend();
    if (online) {
      try {
        const trips = await http.request<Trip[]>('/trips');
        await OFFLINE.cacheTrips(trips);
        return trips;
      } catch (error) {
        const cached = await OFFLINE.getCachedTrips();
        return cached || [];
      }
    }

    const cached = await OFFLINE.getCachedTrips();
    return cached || [];
  },

  async getTrip(id: string): Promise<Trip> {
    return http.request<Trip>(`/trips/${id}`);
  },

  async getDashboard(): Promise<DashboardResponse> {
    return http.request<DashboardResponse>('/dashboard');
  },
};
