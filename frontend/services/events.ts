type TripEvent = 'trips:changed';

const tripListeners = new Set<() => void>();

export const events = {
  emitTripsChanged() {
    tripListeners.forEach((cb) => {
      try {
        cb();
      } catch (error) {
        console.warn('[events] trip listener error', error);
      }
    });
  },
  onTripsChanged(callback: () => void) {
    tripListeners.add(callback);
    return () => tripListeners.delete(callback);
  },
};
