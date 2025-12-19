import { Trip, DashboardResponse } from '@/types/models';
import { http } from './http';
import { auth } from './auth';
import { OFFLINE, TripPayload } from './offline';
import { config } from '@/utils/env';
import { events } from './events';

export interface TripInput {
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
      events.emitTripsChanged();
      return created;
    }

    await OFFLINE.addToQueue({
      type: 'CREATE',
      endpoint: '/trips',
      method: 'POST',
      payload: trip,
    });

    const fallback = {
      ...trip,
      id: `local-${Date.now()}`,
      photos: trip.photos || [],
    };
    events.emitTripsChanged();
    return fallback;
  },

  async getTrips(): Promise<Trip[]> {
    const online = await OFFLINE.pingBackend();
    if (online) {
      try {
        const result = await http.request<Trip[] | { trips: Trip[] }>('/trips');
        const trips = Array.isArray(result) ? result : result?.trips || [];
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

  async updateTrip(id: string, payload: Partial<TripInput>): Promise<Trip> {
    const updated = await http.request<Trip>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    events.emitTripsChanged();
    return updated;
  },

  async deleteTrip(id: string): Promise<void> {
    await http.request(`/trips/${id}`, { method: 'DELETE' });
    events.emitTripsChanged();
  },

  async toggleLike(id: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await http.request<{ liked: boolean; likesCount: number }>(`/trips/${id}/like`, { method: 'POST' });
    events.emitTripsChanged();
    return res;
  },

  async getDashboard(): Promise<DashboardResponse> {
    return http.request<DashboardResponse>('/dashboard');
  },
};
