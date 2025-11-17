# Movies and Shows Feature Design

**Date:** November 17, 2025
**Status:** Design Complete - Ready for Implementation
**Version:** 3.0.0

## Overview

Transform ShowTracker from a TV show-only app into a unified media tracker supporting both movies and TV shows with improved flexibility, filtering, and backup management.

## Goals

1. **Media Type Distinction**: Support both movies and TV shows as first-class content types
2. **Flexible Data Entry**: Make most fields optional (only name + media type required)
3. **Better Filtering**: Filter by media type, status, and genre directly on main screen
4. **Improved Backups**: Show backup list with metadata (movie/show counts, dates)
5. **Backward Compatibility**: Seamlessly migrate existing v2.0 backups to v3.0 format

## Design Sections

---

## 1. Data Model Changes

### Current Model (v2.0)
```typescript
interface Show {
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
```

### New Model (v3.0)
```typescript
type MediaType = 'movie' | 'show';

interface MediaItem {
  id: number;
  name: string;
  mediaType: MediaType;        // NEW: Required field

  // Optional fields (can be undefined)
  genres?: string[];           // Changed to optional
  status?: string;             // Changed to optional
  rating?: number;             // Changed to optional
  dateWatched?: string;        // Changed to optional
  notes?: string;              // Changed to optional

  // Progress fields (only for shows)
  season?: number;             // Only shown/used for mediaType='show'
  episode?: number;            // Only shown/used for mediaType='show'
}
```

### Updated Categories
```typescript
interface Categories {
  genres: string[];
  statuses: string[];
  // Media types are hardcoded: ['movie', 'show']
}
```

### Key Changes
- Rename `Show` → `MediaItem` to reflect both movies and shows
- Add `mediaType` as required field
- Make all fields except `name` and `mediaType` optional
- Season/episode only apply to shows (hidden in UI for movies)
- Tags/genres used for loose collection grouping (e.g., "Godfather-Series")

---

## 2. UI Layout & Navigation

### Main Screen Tabs (Horizontal swipe/tab bar)
```
┌─────────────────────────────────┐
│ [All] [Movies] [TV Shows]       │ ← New tab selector
├─────────────────────────────────┤
│ 🔍 Search  [Genre▼] [Status▼]  │ ← Filter chips (collapsible)
├─────────────────────────────────┤
│                                 │
│  📺 Breaking Bad                │ ← MediaItem cards
│  ⭐ 9.5  S5E16  🏷️Drama,Crime   │   (same expandable style)
│                                 │
│  🎬 The Godfather               │
│  ⭐ -    🏷️Godfather-Series     │ ← No rating yet (dimmed)
│                                 │
│  🎬 The Godfather Part II       │ ← Grouped by tag
│  ⭐ 9.8  🏷️Godfather-Series     │
│                                 │
└─────────────────────────────────┘
    [+] FAB ← Add movie/show
```

### Filter Behavior
- **All tab**: Shows both movies and shows
- **Movies tab**: Filters `mediaType='movie'`
- **TV Shows tab**: Filters `mediaType='show'`
- **Filter chips**: Genre and Status dropdowns (inline, always visible but collapsible)
- **Search**: Text input for name search (inline with filters)

### Tab State Persistence
- Remember last selected tab (AsyncStorage)
- Remember active filters per tab
- Clear filters when switching tabs

### Card Display Rules
- If `mediaType='show'`: Show season/episode (or "S- E-" if empty, dimmed)
- If `mediaType='movie'`: Hide season/episode entirely
- If `rating` is undefined: Show "-" (dimmed)
- If `status` is undefined: Don't show status badge
- If `genres` is empty: Show "No tags" (dimmed)

---

## 3. Add/Edit Form

### Form Layout
```
Add New Entry
┌─────────────────────────────────┐
│ Media Type: [Movie] [Show] ←────┤ Required, radio buttons
│                                 │
│ Name: [____________]  ←─────────┤ Required
│                                 │
│ ─── Optional Fields ───         │
│                                 │
│ Status: [Plan to Watch ▼]      │ Optional dropdown
│                                 │
│ Rating: [Slider 1-10]          │ Optional, default empty
│                                 │
│ Tags/Genres: [Drama] [Action]  │ Optional, multi-select chips
│              [+ Add Tag]        │
│                                 │
│ ─── Show-Specific ───          │ ← Only visible if mediaType='show'
│ Season: [__]  Episode: [__]    │   Optional number inputs
│                                 │
│ Date Watched: [Pick Date]      │ Optional
│                                 │
│ Notes: [____________]          │ Optional, multiline
│        [____________]          │
│                                 │
│ [Cancel]  [Save]               │
└─────────────────────────────────┘
```

### Form Behavior
1. **Media Type Selection**:
   - First field, defaults to 'show'
   - Switching type shows/hides season/episode fields with animation

2. **Required Field Validation**:
   - Only `name` and `mediaType` required
   - Save button enabled as soon as name is entered

3. **Optional Field Handling**:
   - Empty fields saved as `undefined` (not empty strings or 0)
   - Form fields show placeholder text when empty
   - Clear buttons for filled optional fields

4. **Edit Mode**:
   - Pre-fill all existing values
   - Can clear optional fields back to undefined
   - Changing mediaType from 'show' to 'movie' prompts: "Remove season/episode data?" (if exists)

---

## 4. Backup System (Import/Export)

### Backup List Screen (new screen in drawer navigation)
```
Backups
┌─────────────────────────────────┐
│ Current Data                    │
│ 🎬 15 movies  📺 23 shows       │
│                                 │
│ [Export Backup]  [Import]      │
├─────────────────────────────────┤
│ Recent Backups                  │
│                                 │
│ 📄 showtracker-2025-11-17.json │
│    15 movies, 23 shows          │
│    Nov 17, 2025 3:45 PM         │
│    [Restore] [Share] [Delete]   │
│                                 │
│ 📄 showtracker-2025-11-10.json │
│    12 movies, 20 shows          │
│    Nov 10, 2025 2:30 PM         │
│    [Restore] [Share] [Delete]   │
│                                 │
│ (Swipe to refresh)              │
└─────────────────────────────────┘
```

### BackupValidator (simplified from PeopleDB)
```typescript
class BackupValidator {
  // Quick validation during file scan
  static async quickValidate(uri: string): Promise<boolean> {
    // 1. Check file exists and is .json
    // 2. Check file size > 50 bytes
    // 3. Parse JSON
    // 4. Check required fields: mediaItems array (or shows for old format), exportDate, version
    return true/false;
  }

  // Extract metadata for display
  static async extractMetadata(uri: string): Promise<BackupMetadata> {
    const data = JSON.parse(content);

    // Handle both old and new formats
    const items = data.mediaItems || data.shows || [];
    const movieCount = items.filter(m => m.mediaType === 'movie').length;
    const showCount = items.filter(m => m.mediaType === 'show' || !m.mediaType).length;

    return {
      movieCount,
      showCount,
      exportDate: data.exportDate,
      version: data.version,
    };
  }
}
```

### Export Flow
1. User taps "Export Backup"
2. Generates filename: `showtracker-YYYY-MM-DD-HHmmss.json`
3. Writes to app's documents directory `/backups/` folder
4. Shows success toast with option to share
5. Rescan backups folder to update list

### Import/Restore Flow
1. **Import**: Pick external file → validate → merge with existing data (simple append, no conflict resolution)
2. **Restore**: Restore from backup list → validate → replace all data with backup (with confirmation prompt)

### Export Data Structure (v3.0)
```json
{
  "mediaItems": [...],
  "categories": {
    "genres": [...],
    "statuses": [...]
  },
  "exportDate": "2025-11-17T15:45:00.000Z",
  "version": "3.0.0"
}
```

---

## 5. Backward Compatibility & Migration

### Migration Strategy

Support both old (v2.0) and new (v3.0) formats during import:

```typescript
// Support both old and new formats
interface OldAppData {
  shows: Show[];              // Old field name
  categories: Categories;
  exportDate?: string;
  version?: string;
}

interface NewAppData {
  mediaItems: MediaItem[];    // New field name
  categories: Categories;
  exportDate: string;
  version: string;
}

class DataMigrator {
  static migrate(data: OldAppData | NewAppData): NewAppData {
    // If new format, return as-is
    if ('mediaItems' in data) {
      return data as NewAppData;
    }

    // Migrate old format
    const migratedItems: MediaItem[] = data.shows.map(show => ({
      ...show,
      mediaType: 'show' as MediaType,  // All old items were shows
      // Convert required fields to optional
      genres: show.genres?.length > 0 ? show.genres : undefined,
      status: show.status || undefined,
      rating: show.rating || undefined,
      season: show.season || undefined,
      episode: show.episode || undefined,
      dateWatched: show.dateWatched || undefined,
      notes: show.notes || undefined,
    }));

    return {
      mediaItems: migratedItems,
      categories: data.categories,
      exportDate: data.exportDate || new Date().toISOString(),
      version: '3.0.0',
    };
  }
}
```

### Import/Restore Flow (with migration)
1. Read JSON file
2. **Check format**: Look for `mediaItems` (new) or `shows` (old)
3. **Auto-migrate** if old format detected
4. Show migration notice: "Converted 23 shows from v2.0 format"
5. Proceed with import/restore

### Export Flow (always new format)
- Always exports as `mediaItems` with v3.0.0
- Old backups remain untouched until imported

### Validator Updates
```typescript
static async quickValidate(uri: string): Promise<boolean> {
  // Accept both old and new formats
  const hasOldFormat = data.shows && Array.isArray(data.shows);
  const hasNewFormat = data.mediaItems && Array.isArray(data.mediaItems);

  return hasOldFormat || hasNewFormat;
}
```

---

## Implementation Phases

### Phase 1: Data Model & Migration
- Update TypeScript interfaces (Show → MediaItem)
- Implement DataMigrator class
- Update DataManager to handle both formats
- Migrate current in-app data on first launch

### Phase 2: UI Updates
- Add media type selector to add/edit form
- Update card display logic (conditional season/episode)
- Implement tabbed view (All/Movies/TV Shows)
- Add inline filters (search, genre, status)

### Phase 3: Backup System
- Create BackupValidator utility
- Build backup list screen with metadata extraction
- Implement backup folder scanning (no caching)
- Add restore/share/delete actions

### Phase 4: Polish & Testing
- Handle edge cases (empty states, migrations)
- Test backward compatibility with old backups
- Update app version to 3.0.0
- Update documentation

---

## Testing Checklist

- [ ] Import v2.0 backup file (should auto-migrate)
- [ ] Export v3.0 backup (should use new format)
- [ ] Create movie with no rating/progress
- [ ] Create show with season/episode
- [ ] Filter by media type (All/Movies/Shows tabs)
- [ ] Filter by genre and status
- [ ] Search by name
- [ ] Tag-based movie collections (e.g., "Godfather-Series")
- [ ] Edit movie → change to show (prompt for season/episode)
- [ ] Edit show → change to movie (prompt to remove season/episode)
- [ ] Backup list displays correct metadata
- [ ] Restore from backup (replace all data)
- [ ] Import from external file (merge with existing)

---

## Success Criteria

1. ✅ Can track both movies and shows with clear distinction
2. ✅ Can add entries with minimal friction (only name + type required)
3. ✅ Can filter by media type, status, and genre on main screen
4. ✅ Can see backup list with movie/show counts
5. ✅ Old v2.0 backups import seamlessly with auto-migration
6. ✅ Movie collections group visually via tags
7. ✅ Optional fields display cleanly (dimmed when empty)

---

## Open Questions / Future Enhancements

- Should filters persist when switching between All/Movies/Shows tabs, or reset?
- Add sorting options (by name, rating, date added)?
- Add statistics screen (total movies watched, avg rating by genre)?
- Cloud sync for backups?
- TMDB/IMDB API integration for metadata?

---

## Version History

- **v3.0.0** (Planned): Movies + Shows support, optional fields, backup list
- **v2.0.0** (Current): TV shows only, all fields required
- **v1.0.0** (Initial): Basic show tracking
