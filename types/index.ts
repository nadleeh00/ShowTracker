// v3.0 Media Types
export type MediaType = 'movie' | 'show';

// New MediaItem interface (replaces Show)
export interface MediaItem {
  id: number;
  name: string;
  mediaType: MediaType;

  // Optional fields
  genres?: string[];
  status?: string;
  rating?: number;
  dateWatched?: string;
  notes?: string;

  // Progress fields (only for shows)
  season?: number;
  episode?: number;
}

// Keep old Show interface for migration compatibility
export interface Show {
  id: number;
  name: string;
  genres: string[];
  status: string;
  rating: number;
  season: number;
  episode: number;
  dateWatched: string;
  notes: string;
}

export interface Categories {
  genres: string[];
  statuses: string[];
  [key: string]: string[];
}

// Old app data format (v2.0)
export interface OldAppData {
  shows: Show[];
  categories: Categories;
  exportDate?: string;
  version?: string;
}

// New app data format (v3.0)
export interface AppData {
  mediaItems: MediaItem[];
  categories: Categories;
  exportDate: string;
  version: string;
}

// Backward compatibility: accept both formats
export type ImportableAppData = OldAppData | AppData;

// Form data for adding/editing
export interface FormData {
  name: string;
  mediaType: MediaType;
  genres: string[];
  status: string;
  rating: string;
  season: string;
  episode: string;
  dateWatched: string;
  notes: string;
}

// Backup metadata for display
export interface BackupMetadata {
  movieCount: number;
  showCount: number;
  exportDate: string;
  version: string;
  filename: string;
  uri: string;
}
