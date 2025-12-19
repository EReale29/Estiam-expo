export type Language = 'fr' | 'en';

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  city?: string;
  country?: string;
  startDate: string;
  endDate: string;
  image?: string;
  description?: string;
  notes?: string;
  photos: string[];
  photosCount?: number;
  activities?: TripActivity[];
  activitiesCount?: number;
  location?: LocationPoint;
  liked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export interface TripActivity {
  id: string;
  title: string;
  date?: string;
  description?: string;
  created_at?: number;
}

export interface DashboardStats {
  trips: number;
  photos: number;
  likes: number;
  countries: number;
  comments: number;
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
