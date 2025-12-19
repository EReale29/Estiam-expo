export type Language = 'fr' | 'en';

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  image?: string;
  description?: string;
  photos: string[];
  location?: LocationPoint;
}

export interface DashboardStats {
  trips: number;
  photos: number;
  countries: number;
}

export interface DashboardActivity {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  upcomingTrips: Trip[];
  activities: DashboardActivity[];
}
