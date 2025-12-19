import { useCallback, useEffect, useMemo, useState } from 'react';
import { API } from '@/services/api';
import { Trip } from '@/types/models';
import { events } from '@/services/events';

export type TripFilter = 'all' | 'upcoming' | 'past' | 'ongoing' | 'favorites';
export type TripView = 'list' | 'map';

const isUpcoming = (trip: Trip) => {
  if (!trip.startDate) return false;
  const start = new Date(trip.startDate).getTime();
  return !Number.isNaN(start) && start >= Date.now();
};

const isPast = (trip: Trip) => {
  if (!trip.endDate) return false;
  const end = new Date(trip.endDate).getTime();
  return !Number.isNaN(end) && end < Date.now();
};

const isOngoing = (trip: Trip) => {
  if (!trip.startDate || !trip.endDate) return false;
  const now = Date.now();
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return start <= now && now <= end;
};

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [view, setView] = useState<TripView>('list');
  const [filter, setFilter] = useState<TripFilter>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await API.getTrips();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trips');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
    const unsubscribe = events.onTripsChanged(loadTrips);
    return () => unsubscribe();
  }, [loadTrips]);

  const filteredTrips = useMemo(() => {
    const search = query.trim().toLowerCase();
    return trips.filter((trip) => {
      const matchesQuery =
        !search ||
        trip.title.toLowerCase().includes(search) ||
        trip.destination.toLowerCase().includes(search);

      if (!matchesQuery) return false;

      if (filter === 'upcoming') return isUpcoming(trip);
      if (filter === 'past') return isPast(trip);
      if (filter === 'ongoing') return isOngoing(trip);
      if (filter === 'favorites') return !!trip.liked;
      return true;
    });
  }, [trips, query, filter]);

  const setViewMode = useCallback((mode: TripView) => setView(mode), []);

  return {
    trips: filteredTrips,
    rawTrips: trips,
    view,
    setView: setViewMode,
    filter,
    setFilter,
    query,
    setQuery,
    isLoading,
    error,
    refresh: loadTrips,
  };
};
