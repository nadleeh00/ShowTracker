import type { OldAppData, AppData, MediaItem, Show, MediaType } from '../types';

export class DataMigrator {
  /**
   * Migrate data from v2.0 (shows) to v3.0 (mediaItems) format
   * If already v3.0, returns as-is
   */
  static migrate(data: OldAppData | AppData): AppData {
    // Check if already new format
    if ('mediaItems' in data && data.mediaItems) {
      return data as AppData;
    }

    // Migrate old format
    const oldData = data as OldAppData;
    const migratedItems: MediaItem[] = oldData.shows.map(show =>
      this.migrateShow(show)
    );

    return {
      mediaItems: migratedItems,
      categories: oldData.categories,
      exportDate: oldData.exportDate || new Date().toISOString(),
      version: '3.0.0',
    };
  }

  /**
   * Convert a single Show to MediaItem
   */
  private static migrateShow(show: Show): MediaItem {
    return {
      id: show.id,
      name: show.name,
      mediaType: 'show' as MediaType, // All old items are shows

      // Convert empty/zero values to undefined
      genres: show.genres && show.genres.length > 0 ? show.genres : undefined,
      status: show.status || undefined,
      rating: show.rating || undefined,
      season: show.season || undefined,
      episode: show.episode || undefined,
      dateWatched: show.dateWatched || undefined,
      notes: show.notes || undefined,
    };
  }

  /**
   * Check if data is in old format
   */
  static isOldFormat(data: any): data is OldAppData {
    return data && 'shows' in data && Array.isArray(data.shows);
  }

  /**
   * Check if data is in new format
   */
  static isNewFormat(data: any): data is AppData {
    return data && 'mediaItems' in data && Array.isArray(data.mediaItems);
  }
}
