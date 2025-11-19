# ShowTracker v3.0 - Movies and Shows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform ShowTracker from a TV show-only app into a unified media tracker supporting both movies and TV shows with improved flexibility, filtering, and backup management.

**Architecture:** Migration-first approach with backward compatibility. Update data model from `Show` to `MediaItem` with optional fields, implement auto-migration for v2.0 backups, add tabbed filtering UI, and enhance backup system with metadata display.

**Tech Stack:** React Native 0.79.2, Expo 53, TypeScript 5.8.3, AsyncStorage, expo-file-system, expo-document-picker

---

## Phase 1: Data Model & Migration

### Task 1: Update TypeScript Interfaces

**Files:**
- Modify: `/workspaces/ShowTracker/types/index.ts`

**Step 1: Update types/index.ts with new v3.0 interfaces**

Replace the current content with:

```typescript
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
```

**Step 2: Verify types file has no syntax errors**

Run: `npx tsc --noEmit`
Expected: No errors in types/index.ts

---

### Task 2: Create DataMigrator Utility

**Files:**
- Create: `/workspaces/ShowTracker/utils/dataMigrator.ts`

**Step 1: Create dataMigrator.ts with migration logic**

```typescript
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
```

**Step 2: Verify dataMigrator compiles**

Run: `npx tsc --noEmit`
Expected: No errors in utils/dataMigrator.ts

---

### Task 3: Update DataManager for v3.0

**Files:**
- Modify: `/workspaces/ShowTracker/utils/dataManager.ts`

**Step 1: Update imports and type references**

Replace imports and add DataMigrator:

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { AppData, MediaItem, Categories, ImportableAppData, BackupMetadata } from '../types';
import { DataMigrator } from './dataMigrator';
import versionInfo from '../version.json';
```

**Step 2: Update VERSION constant**

Find line 9-10 and update:

```typescript
export class DataManager {
  private static readonly VERSION = '3.0'; // Updated for v3.0
```

**Step 3: Update exportData method signature**

Replace lines 20-51 (exportData method):

```typescript
static async exportData(mediaItems: MediaItem[], categories: Categories, customFilename?: string): Promise<void> {
  try {
    const dataToExport: AppData = {
      mediaItems,
      categories,
      exportDate: new Date().toISOString(),
      version: '3.0.0'
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);

    // Use custom filename or generate default
    const defaultName = `showtracker-backup-${new Date().toISOString().split('T')[0]}`;
    const filename = customFilename ? `${customFilename}.json` : `${defaultName}.json`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export ShowTracker Data',
        UTI: 'public.json'
      });
    } else {
      Alert.alert('Export Complete', `Data saved to: ${filename}`);
    }
  } catch (error: unknown) {
    console.error('Export error:', error);
    Alert.alert('Export Error', 'Failed to export data. Please try again.');
  }
}
```

**Step 4: Update importData to use migration**

Replace lines 53-118 (importData method):

```typescript
static async importData(): Promise<AppData | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    let fileContent: string;
    const asset = result.assets[0];

    try {
      fileContent = await FileSystem.readAsStringAsync(asset.uri);
    } catch (directReadError: unknown) {
      console.log('Direct read failed, trying copy method...');

      const fileName = asset.name || 'import.json';
      const tempUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: tempUri
      });

      fileContent = await FileSystem.readAsStringAsync(tempUri);

      await FileSystem.deleteAsync(tempUri, { idempotent: true });
    }

    // Parse JSON
    const importedData = JSON.parse(fileContent) as ImportableAppData;

    // Validate
    if (!this.validateImportData(importedData)) {
      Alert.alert('Import Error', 'Invalid file format. Please select a valid ShowTracker backup file.');
      return null;
    }

    // Migrate if needed
    const migratedData = DataMigrator.migrate(importedData);

    // Show migration notice if old format detected
    if (DataMigrator.isOldFormat(importedData)) {
      const showCount = (importedData as any).shows.length;
      Alert.alert(
        'Migration Complete',
        `Converted ${showCount} shows from v2.0 format to v3.0`
      );
    }

    return migratedData;
  } catch (error) {
    console.error('Import error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unsupported scheme')) {
      Alert.alert(
        'Import Error',
        'Unable to read the selected file. Try saving the file to your device storage and selecting it again.'
      );
    } else if (errorMessage.includes('JSON')) {
      Alert.alert('Import Error', 'The selected file is not a valid JSON format.');
    } else {
      Alert.alert('Import Error', 'Failed to import data. Please try again or select a different file.');
    }

    return null;
  }
}
```

**Step 5: Update validateImportData to accept both formats**

Replace lines 120-129 (validateImportData method):

```typescript
private static validateImportData(data: any): data is ImportableAppData {
  // Check new format
  const hasNewFormat = data &&
    typeof data === 'object' &&
    Array.isArray(data.mediaItems) &&
    data.categories;

  // Check old format
  const hasOldFormat = data &&
    typeof data === 'object' &&
    Array.isArray(data.shows) &&
    data.categories;

  return hasNewFormat || hasOldFormat;
}
```

**Step 6: Add backup metadata extraction method**

Add at end of DataManager class (before closing brace):

```typescript
/**
 * Extract metadata from a backup file for display
 */
static async extractBackupMetadata(uri: string, filename: string): Promise<BackupMetadata | null> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(uri);
    const data = JSON.parse(fileContent) as ImportableAppData;

    // Handle both old and new formats
    let items: any[] = [];
    if (DataMigrator.isNewFormat(data)) {
      items = data.mediaItems;
    } else if (DataMigrator.isOldFormat(data)) {
      items = data.shows.map(show => ({ ...show, mediaType: 'show' }));
    }

    const movieCount = items.filter(item => item.mediaType === 'movie').length;
    const showCount = items.filter(item => !item.mediaType || item.mediaType === 'show').length;

    return {
      movieCount,
      showCount,
      exportDate: data.exportDate || 'Unknown',
      version: data.version || '2.0',
      filename,
      uri,
    };
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return null;
  }
}

/**
 * Get list of backup files from documents directory
 */
static async listBackups(): Promise<BackupMetadata[]> {
  try {
    const dirUri = FileSystem.documentDirectory;
    if (!dirUri) return [];

    const files = await FileSystem.readDirectoryAsync(dirUri);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const metadataPromises = jsonFiles.map(async (filename) => {
      const uri = dirUri + filename;
      return await this.extractBackupMetadata(uri, filename);
    });

    const results = await Promise.all(metadataPromises);
    return results.filter((m): m is BackupMetadata => m !== null);
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

/**
 * Delete a backup file
 */
static async deleteBackup(uri: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
}

/**
 * Restore data from a backup file (replaces all current data)
 */
static async restoreFromBackup(uri: string): Promise<AppData | null> {
  try {
    const fileContent = await FileSystem.readAsStringAsync(uri);
    const importedData = JSON.parse(fileContent) as ImportableAppData;

    if (!this.validateImportData(importedData)) {
      Alert.alert('Restore Error', 'Invalid backup file format.');
      return null;
    }

    const migratedData = DataMigrator.migrate(importedData);

    if (DataMigrator.isOldFormat(importedData)) {
      const showCount = (importedData as any).shows.length;
      Alert.alert(
        'Migration Complete',
        `Restored and converted ${showCount} shows from v2.0 format`
      );
    }

    return migratedData;
  } catch (error) {
    console.error('Restore error:', error);
    Alert.alert('Restore Error', 'Failed to restore backup.');
    return null;
  }
}
```

**Step 7: Verify DataManager compiles**

Run: `npx tsc --noEmit`
Expected: No errors in utils/dataManager.ts

---

### Task 4: Migrate In-App Data Storage (AsyncStorage)

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Add migration logic to loadShows function**

This will be a multi-part update. First, update the imports to include DataMigrator:

Around line 18, add to imports:

```typescript
import type { Categories, FormData, MediaItem } from '../../../types';
import { DataMigrator } from '../../../utils/dataMigrator';
```

**Step 2: Update state variable from Show[] to MediaItem[]**

Find the state declaration (around line 200-210 in the main component) and update:

```typescript
const [shows, setShows] = useState<MediaItem[]>([]);
```

**Step 3: Add one-time migration on app load**

In the loadShows function, add migration logic after reading from AsyncStorage:

```typescript
const loadShows = async () => {
  try {
    const savedData = await AsyncStorage.getItem('showTrackerData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Check if old format and migrate
      if (DataMigrator.isOldFormat(parsedData)) {
        const migratedData = DataMigrator.migrate(parsedData);
        setShows(migratedData.mediaItems);
        setCategories(migratedData.categories);

        // Save migrated data back to AsyncStorage
        await AsyncStorage.setItem('showTrackerData', JSON.stringify(migratedData));

        console.log('Migrated v2.0 data to v3.0');
      } else if (DataMigrator.isNewFormat(parsedData)) {
        setShows(parsedData.mediaItems);
        setCategories(parsedData.categories);
      } else {
        // Legacy: direct array (very old format)
        setShows([]);
      }
    }
  } catch (error) {
    console.error('Error loading shows:', error);
  }
};
```

**Step 4: Update saveShows to use new format**

Update saveShows function to save as mediaItems:

```typescript
const saveShows = async (updatedShows: MediaItem[]) => {
  try {
    const dataToSave = {
      mediaItems: updatedShows,
      categories: categories,
      exportDate: new Date().toISOString(),
      version: '3.0.0'
    };
    await AsyncStorage.setItem('showTrackerData', JSON.stringify(dataToSave));
    setShows(updatedShows);
  } catch (error) {
    console.error('Error saving shows:', error);
  }
};
```

**Step 5: Verify index.tsx compiles**

Run: `npx tsc --noEmit`
Expected: No errors (though there may be warnings about unused MediaItem type features)

---

## Phase 2: UI Updates

### Task 5: Update Add/Edit Form with Media Type Selector

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Update FormData initial state to include mediaType**

Find the initial formData state and update:

```typescript
const [formData, setFormData] = useState<FormData>({
  name: '',
  mediaType: 'show', // Default to show
  genres: [],
  status: '',
  rating: '',
  season: '',
  episode: '',
  dateWatched: '',
  notes: '',
});
```

**Step 2: Add media type selector to modal (before name input)**

In the modal render, add media type selector as the first field:

```jsx
<View style={styles.formGroup}>
  <Text style={styles.label}>Media Type *</Text>
  <View style={styles.mediaTypeSelector}>
    <TouchableOpacity
      style={[
        styles.mediaTypeButton,
        formData.mediaType === 'show' && styles.mediaTypeButtonActive
      ]}
      onPress={() => setFormData({ ...formData, mediaType: 'show' })}
    >
      <Text style={[
        styles.mediaTypeText,
        formData.mediaType === 'show' && styles.mediaTypeTextActive
      ]}>
        TV Show
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.mediaTypeButton,
        formData.mediaType === 'movie' && styles.mediaTypeButtonActive
      ]}
      onPress={() => setFormData({ ...formData, mediaType: 'movie' })}
    >
      <Text style={[
        styles.mediaTypeText,
        formData.mediaType === 'movie' && styles.mediaTypeTextActive
      ]}>
        Movie
      </Text>
    </TouchableOpacity>
  </View>
</View>
```

**Step 3: Conditionally show season/episode fields**

Wrap the season/episode fields with a condition:

```jsx
{formData.mediaType === 'show' && (
  <>
    <View style={styles.formRow}>
      <View style={styles.formHalf}>
        <Text style={styles.label}>Season</Text>
        <TextInput
          style={styles.input}
          value={formData.season}
          onChangeText={(text) => setFormData({ ...formData, season: text })}
          keyboardType="numeric"
          placeholder="Optional"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.formHalf}>
        <Text style={styles.label}>Episode</Text>
        <TextInput
          style={styles.input}
          value={formData.episode}
          onChangeText={(text) => setFormData({ ...formData, episode: text })}
          keyboardType="numeric"
          placeholder="Optional"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
    </View>
  </>
)}
```

**Step 4: Update handleSave to create MediaItem with optional fields**

Update the handleSave function to properly handle optional fields:

```typescript
const handleSave = () => {
  if (!formData.name.trim()) {
    Alert.alert('Error', 'Please enter a name');
    return;
  }

  const newItem: MediaItem = {
    id: editingShow?.id || Date.now(),
    name: formData.name.trim(),
    mediaType: formData.mediaType,

    // Optional fields - only include if not empty
    ...(formData.genres.length > 0 && { genres: formData.genres }),
    ...(formData.status && { status: formData.status }),
    ...(formData.rating && { rating: parseFloat(formData.rating) }),
    ...(formData.dateWatched && { dateWatched: formData.dateWatched }),
    ...(formData.notes.trim() && { notes: formData.notes.trim() }),

    // Show-specific fields
    ...(formData.mediaType === 'show' && formData.season && { season: parseInt(formData.season) }),
    ...(formData.mediaType === 'show' && formData.episode && { episode: parseInt(formData.episode) }),
  };

  if (editingShow) {
    saveShows(shows.map(s => s.id === editingShow.id ? newItem : s));
  } else {
    saveShows([...shows, newItem]);
  }

  setModalVisible(false);
  resetForm();
};
```

**Step 5: Update resetForm to include mediaType**

```typescript
const resetForm = () => {
  setFormData({
    name: '',
    mediaType: 'show',
    genres: [],
    status: '',
    rating: '',
    season: '',
    episode: '',
    dateWatched: '',
    notes: '',
  });
  setEditingShow(null);
};
```

**Step 6: Update handleEdit to populate mediaType**

```typescript
const handleEdit = (show: MediaItem) => {
  setEditingShow(show);
  setFormData({
    name: show.name,
    mediaType: show.mediaType,
    genres: show.genres || [],
    status: show.status || '',
    rating: show.rating?.toString() || '',
    season: show.season?.toString() || '',
    episode: show.episode?.toString() || '',
    dateWatched: show.dateWatched || '',
    notes: show.notes || '',
  });
  setModalVisible(true);
};
```

**Step 7: Add styles for media type selector**

Add to styles object:

```typescript
mediaTypeSelector: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 8,
},
mediaTypeButton: {
  flex: 1,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.background,
  alignItems: 'center',
},
mediaTypeButtonActive: {
  borderColor: theme.colors.primary,
  backgroundColor: theme.colors.primaryLight || theme.colors.primary + '20',
},
mediaTypeText: {
  fontSize: 16,
  fontWeight: '600',
  color: theme.colors.textSecondary,
},
mediaTypeTextActive: {
  color: theme.colors.primary,
},
```

---

### Task 6: Update Card Display Logic

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Update ExpandableShowCard component signature**

Update around line 26-30:

```typescript
interface ExpandableShowCardProps {
  item: MediaItem;  // Changed from show: Show
  onEdit: (item: MediaItem) => void;
  onDelete: (id: number) => void;
}

const ExpandableShowCard: React.FC<ExpandableShowCardProps> = ({ item, onEdit, onDelete }) => {
```

**Step 2: Update compact info to conditionally show progress**

In the compact info section (collapsed card), update around line 83-90:

```jsx
{!expanded && (
  <View style={styles.compactInfo}>
    {item.status && (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    )}
    {item.mediaType === 'show' && (item.season || item.episode) && (
      <Text style={styles.episodeInfo}>
        S{item.season || '-'}E{item.episode || '-'}
      </Text>
    )}
  </View>
)}
```

**Step 3: Update expanded view to handle optional fields**

Update the expanded details section:

```jsx
{expanded && (
  <View style={styles.expandedContent}>
    <View style={styles.detailsGrid}>
      {/* Media Type */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Type</Text>
        <Text style={styles.detailValue}>
          {item.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
        </Text>
      </View>

      {/* Genres/Tags */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Tags</Text>
        <View style={styles.genreContainer}>
          {item.genres && item.genres.length > 0 ? (
            item.genres.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.detailValue, styles.dimmedText]}>No tags</Text>
          )}
        </View>
      </View>

      {/* Status */}
      {item.status && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      )}

      {/* Rating */}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Rating</Text>
        {item.rating ? (
          <View style={styles.ratingContainer}>
            <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            <Text style={styles.ratingScale}>/ 10</Text>
          </View>
        ) : (
          <Text style={[styles.detailValue, styles.dimmedText]}>-</Text>
        )}
      </View>

      {/* Progress (only for shows) */}
      {item.mediaType === 'show' && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Progress</Text>
          <Text style={styles.detailValue}>
            {item.season || item.episode
              ? `Season ${item.season || '-'}, Episode ${item.episode || '-'}`
              : 'Not started'
            }
          </Text>
        </View>
      )}

      {/* Date Watched */}
      {item.dateWatched && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Watched</Text>
          <Text style={styles.detailValue}>{item.dateWatched}</Text>
        </View>
      )}

      {/* Notes */}
      {item.notes && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Notes</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>

    <View style={styles.actionBar}>
      <TouchableOpacity
        onPress={() => onEdit(item)}
        style={[styles.actionButton, styles.editButton]}
      >
        <Ionicons name="pencil" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        style={[styles.actionButton, styles.deleteButton]}
      >
        <Ionicons name="trash" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
```

**Step 4: Update rating badge display**

Update the rating badge in the header to handle undefined:

```jsx
<View style={styles.headerIndicators}>
  {item.rating ? (
    <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
      <Text style={styles.ratingText}>{item.rating}</Text>
    </View>
  ) : (
    <View style={[styles.ratingBadge, { backgroundColor: theme.colors.border }]}>
      <Text style={[styles.ratingText, styles.dimmedText]}>-</Text>
    </View>
  )}
  <Ionicons
    name={expanded ? "chevron-up" : "chevron-down"}
    size={20}
    color={theme.colors.textSecondary}
  />
</View>
```

**Step 5: Add dimmedText style**

```typescript
dimmedText: {
  opacity: 0.5,
},
```

**Step 6: Update FlatList renderItem**

Update the FlatList to use new prop names:

```jsx
<FlatList
  data={shows}
  renderItem={({ item }) => (
    <ExpandableShowCard
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )}
  keyExtractor={(item) => item.id.toString()}
  // ... rest of props
/>
```

---

### Task 7: Add Tabbed Filtering UI

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Add filter state**

Add these state variables after the existing state declarations:

```typescript
const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'shows'>('all');
const [searchQuery, setSearchQuery] = useState('');
const [selectedGenre, setSelectedGenre] = useState<string>('');
const [selectedStatus, setSelectedStatus] = useState<string>('');
```

**Step 2: Create filtered items computation**

Add this computed value before the render:

```typescript
const filteredItems = shows.filter(item => {
  // Tab filter
  if (activeTab === 'movies' && item.mediaType !== 'movie') return false;
  if (activeTab === 'shows' && item.mediaType !== 'show') return false;

  // Search filter
  if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }

  // Genre filter
  if (selectedGenre && (!item.genres || !item.genres.includes(selectedGenre))) {
    return false;
  }

  // Status filter
  if (selectedStatus && item.status !== selectedStatus) {
    return false;
  }

  return true;
});
```

**Step 3: Add tab selector above search**

Add tabs UI before the FlatList:

```jsx
{/* Tab Selector */}
<View style={styles.tabContainer}>
  <TouchableOpacity
    style={[styles.tab, activeTab === 'all' && styles.tabActive]}
    onPress={() => setActiveTab('all')}
  >
    <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
      All
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.tab, activeTab === 'movies' && styles.tabActive]}
    onPress={() => setActiveTab('movies')}
  >
    <Text style={[styles.tabText, activeTab === 'movies' && styles.tabTextActive]}>
      Movies
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.tab, activeTab === 'shows' && styles.tabActive]}
    onPress={() => setActiveTab('shows')}
  >
    <Text style={[styles.tabText, activeTab === 'shows' && styles.tabTextActive]}>
      TV Shows
    </Text>
  </TouchableOpacity>
</View>

{/* Filters */}
<View style={styles.filtersContainer}>
  {/* Search */}
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
    <TextInput
      style={styles.searchInput}
      placeholder="Search..."
      placeholderTextColor={theme.colors.textSecondary}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    {searchQuery.length > 0 && (
      <TouchableOpacity onPress={() => setSearchQuery('')}>
        <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    )}
  </View>

  {/* Genre Filter */}
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>Genre:</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        style={[styles.filterChip, !selectedGenre && styles.filterChipActive]}
        onPress={() => setSelectedGenre('')}
      >
        <Text style={[styles.filterChipText, !selectedGenre && styles.filterChipTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {categories.genres.map(genre => (
        <TouchableOpacity
          key={genre}
          style={[styles.filterChip, selectedGenre === genre && styles.filterChipActive]}
          onPress={() => setSelectedGenre(genre)}
        >
          <Text style={[styles.filterChipText, selectedGenre === genre && styles.filterChipTextActive]}>
            {genre}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>

  {/* Status Filter */}
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>Status:</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        style={[styles.filterChip, !selectedStatus && styles.filterChipActive]}
        onPress={() => setSelectedStatus('')}
      >
        <Text style={[styles.filterChipText, !selectedStatus && styles.filterChipTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {categories.statuses.map(status => (
        <TouchableOpacity
          key={status}
          style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
          onPress={() => setSelectedStatus(status)}
        >
          <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
            {status}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</View>
```

**Step 4: Update FlatList to use filteredItems**

```jsx
<FlatList
  data={filteredItems}
  // ... rest of props
/>
```

**Step 5: Add filter styles**

```typescript
tabContainer: {
  flexDirection: 'row',
  backgroundColor: theme.colors.surface,
  borderRadius: 8,
  padding: 4,
  marginBottom: 12,
},
tab: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  alignItems: 'center',
},
tabActive: {
  backgroundColor: theme.colors.primary,
},
tabText: {
  fontSize: 14,
  fontWeight: '600',
  color: theme.colors.textSecondary,
},
tabTextActive: {
  color: '#fff',
},
filtersContainer: {
  marginBottom: 12,
},
searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: theme.colors.surface,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 8,
},
searchInput: {
  flex: 1,
  marginLeft: 8,
  fontSize: 16,
  color: theme.colors.text,
},
filterRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
filterLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: theme.colors.text,
  marginRight: 8,
  minWidth: 60,
},
filterChip: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 16,
  backgroundColor: theme.colors.surface,
  marginRight: 8,
  borderWidth: 1,
  borderColor: theme.colors.border,
},
filterChipActive: {
  backgroundColor: theme.colors.primary,
  borderColor: theme.colors.primary,
},
filterChipText: {
  fontSize: 13,
  color: theme.colors.textSecondary,
},
filterChipTextActive: {
  color: '#fff',
  fontWeight: '600',
},
```

---

### Task 8: Persist Tab and Filter State

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Load tab/filter state on mount**

Add to useEffect that loads shows:

```typescript
useEffect(() => {
  loadShows();
  loadFilterState();
}, []);

const loadFilterState = async () => {
  try {
    const savedTab = await AsyncStorage.getItem('activeTab');
    const savedSearch = await AsyncStorage.getItem('searchQuery');
    const savedGenre = await AsyncStorage.getItem('selectedGenre');
    const savedStatus = await AsyncStorage.getItem('selectedStatus');

    if (savedTab) setActiveTab(savedTab as any);
    if (savedSearch) setSearchQuery(savedSearch);
    if (savedGenre) setSelectedGenre(savedGenre);
    if (savedStatus) setSelectedStatus(savedStatus);
  } catch (error) {
    console.error('Error loading filter state:', error);
  }
};
```

**Step 2: Save filter state on changes**

```typescript
useEffect(() => {
  AsyncStorage.setItem('activeTab', activeTab);
}, [activeTab]);

useEffect(() => {
  AsyncStorage.setItem('searchQuery', searchQuery);
}, [searchQuery]);

useEffect(() => {
  AsyncStorage.setItem('selectedGenre', selectedGenre);
}, [selectedGenre]);

useEffect(() => {
  AsyncStorage.setItem('selectedStatus', selectedStatus);
}, [selectedStatus]);
```

---

## Phase 3: Backup System Enhancement

### Task 9: Update Data Management Screen

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/data-management.tsx`

**Step 1: Update imports**

```typescript
import { DataManager } from '../utils/dataManager';
import type { BackupMetadata, MediaItem } from '../types';
```

**Step 2: Add backup list state**

```typescript
const [backups, setBackups] = useState<BackupMetadata[]>([]);
const [refreshing, setRefreshing] = useState(false);
```

**Step 3: Add loadBackups function**

```typescript
const loadBackups = async () => {
  setRefreshing(true);
  const backupList = await DataManager.listBackups();
  // Sort by export date (newest first)
  backupList.sort((a, b) =>
    new Date(b.exportDate).getTime() - new Date(a.exportDate).getTime()
  );
  setBackups(backupList);
  setRefreshing(false);
};

useEffect(() => {
  loadBackups();
}, []);
```

**Step 4: Add restore handler**

```typescript
const handleRestore = async (backup: BackupMetadata) => {
  Alert.alert(
    'Restore Backup',
    `This will replace all current data with the backup from ${new Date(backup.exportDate).toLocaleDateString()}. Continue?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          const restoredData = await DataManager.restoreFromBackup(backup.uri);
          if (restoredData) {
            // Save to AsyncStorage
            await AsyncStorage.setItem('showTrackerData', JSON.stringify(restoredData));
            Alert.alert('Success', 'Backup restored successfully. Please restart the app.');
          }
        }
      }
    ]
  );
};
```

**Step 5: Add delete handler**

```typescript
const handleDeleteBackup = async (backup: BackupMetadata) => {
  Alert.alert(
    'Delete Backup',
    `Delete ${backup.filename}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await DataManager.deleteBackup(backup.uri);
          if (success) {
            await loadBackups();
          }
        }
      }
    ]
  );
};
```

**Step 6: Add share handler**

```typescript
const handleShareBackup = async (backup: BackupMetadata) => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(backup.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Share Backup',
    });
  } else {
    Alert.alert('Error', 'Sharing is not available on this device');
  }
};
```

**Step 7: Update export handler to refresh backups**

Update handleExport:

```typescript
const handleExport = async () => {
  setExportModalVisible(true);
};

const confirmExport = async () => {
  const filename = customFilename.trim() || undefined;
  await DataManager.exportData(shows, categories, filename);
  setExportModalVisible(false);
  setCustomFilename('');

  // Refresh backup list
  await loadBackups();
};
```

**Step 8: Add backup list UI**

Add before the Export/Import buttons:

```jsx
{/* Current Data Summary */}
<View style={styles.summaryCard}>
  <Text style={styles.summaryTitle}>Current Data</Text>
  <View style={styles.summaryStats}>
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {shows.filter((s: MediaItem) => s.mediaType === 'movie').length}
      </Text>
      <Text style={styles.statLabel}>Movies</Text>
    </View>
    <View style={styles.stat}>
      <Text style={styles.statNumber}>
        {shows.filter((s: MediaItem) => s.mediaType === 'show').length}
      </Text>
      <Text style={styles.statLabel}>TV Shows</Text>
    </View>
  </View>
</View>

{/* Backup List */}
<Text style={styles.sectionTitle}>Saved Backups</Text>
<ScrollView
  style={styles.backupList}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={loadBackups} />
  }
>
  {backups.length === 0 ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No backups found</Text>
      <Text style={styles.emptySubtext}>Export your data to create a backup</Text>
    </View>
  ) : (
    backups.map((backup, index) => (
      <View key={index} style={styles.backupCard}>
        <View style={styles.backupHeader}>
          <Ionicons name="document-text" size={24} color={theme.colors.primary} />
          <View style={styles.backupInfo}>
            <Text style={styles.backupFilename}>{backup.filename}</Text>
            <Text style={styles.backupDate}>
              {new Date(backup.exportDate).toLocaleString()}
            </Text>
            <View style={styles.backupStats}>
              <Text style={styles.backupStat}>
                🎬 {backup.movieCount} movies
              </Text>
              <Text style={styles.backupStat}>
                📺 {backup.showCount} shows
              </Text>
              <Text style={styles.backupStat}>
                v{backup.version}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.backupActions}>
          <TouchableOpacity
            style={[styles.backupButton, styles.restoreButton]}
            onPress={() => handleRestore(backup)}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.backupButtonText}>Restore</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.shareButton]}
            onPress={() => handleShareBackup(backup)}
          >
            <Ionicons name="share" size={16} color="#fff" />
            <Text style={styles.backupButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.deleteButton]}
            onPress={() => handleDeleteBackup(backup)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.backupButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))
  )}
</ScrollView>
```

**Step 9: Add backup list styles**

```typescript
summaryCard: {
  backgroundColor: theme.colors.surface,
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
},
summaryTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: theme.colors.text,
  marginBottom: 12,
},
summaryStats: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
stat: {
  alignItems: 'center',
},
statNumber: {
  fontSize: 32,
  fontWeight: '700',
  color: theme.colors.primary,
},
statLabel: {
  fontSize: 14,
  color: theme.colors.textSecondary,
  marginTop: 4,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: theme.colors.text,
  marginBottom: 12,
},
backupList: {
  flex: 1,
},
emptyState: {
  alignItems: 'center',
  paddingVertical: 48,
},
emptyText: {
  fontSize: 16,
  fontWeight: '600',
  color: theme.colors.textSecondary,
},
emptySubtext: {
  fontSize: 14,
  color: theme.colors.textSecondary,
  marginTop: 4,
},
backupCard: {
  backgroundColor: theme.colors.surface,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
},
backupHeader: {
  flexDirection: 'row',
  marginBottom: 12,
},
backupInfo: {
  flex: 1,
  marginLeft: 12,
},
backupFilename: {
  fontSize: 14,
  fontWeight: '600',
  color: theme.colors.text,
  marginBottom: 4,
},
backupDate: {
  fontSize: 12,
  color: theme.colors.textSecondary,
  marginBottom: 6,
},
backupStats: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},
backupStat: {
  fontSize: 12,
  color: theme.colors.textSecondary,
},
backupActions: {
  flexDirection: 'row',
  gap: 8,
},
backupButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 8,
  gap: 4,
},
restoreButton: {
  backgroundColor: theme.colors.primary,
},
shareButton: {
  backgroundColor: '#2196F3',
},
deleteButton: {
  backgroundColor: '#f44336',
},
backupButtonText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '600',
},
```

---

## Phase 4: Polish & Testing

### Task 10: Update Version to 3.0.0

**Files:**
- Modify: `/workspaces/ShowTracker/version.json`

**Step 1: Update version number**

```json
{
  "version": "3.0.0"
}
```

**Step 2: Verify version displays correctly**

Run: `npm start`
Navigate to Settings screen
Expected: Shows "Version 3.0.0"

---

### Task 11: Add Empty State for Main Screen

**Files:**
- Modify: `/workspaces/ShowTracker/app/(drawer)/(tabs)/index.tsx`

**Step 1: Add empty state component**

```jsx
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="film-outline" size={64} color={theme.colors.textSecondary} />
    <Text style={styles.emptyTitle}>No items yet</Text>
    <Text style={styles.emptySubtitle}>
      Tap the + button to add your first {activeTab === 'movies' ? 'movie' : activeTab === 'shows' ? 'TV show' : 'item'}
    </Text>
  </View>
);
```

**Step 2: Use empty state in FlatList**

```jsx
<FlatList
  data={filteredItems}
  renderItem={({ item }) => (
    <ExpandableShowCard
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )}
  keyExtractor={(item) => item.id.toString()}
  ListEmptyComponent={<EmptyState />}
  contentContainerStyle={filteredItems.length === 0 ? styles.emptyList : undefined}
  // ... rest of props
/>
```

**Step 3: Add empty state styles**

```typescript
emptyContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 64,
},
emptyTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: theme.colors.text,
  marginTop: 16,
},
emptySubtitle: {
  fontSize: 14,
  color: theme.colors.textSecondary,
  marginTop: 8,
  textAlign: 'center',
  paddingHorizontal: 32,
},
emptyList: {
  flexGrow: 1,
},
```

---

### Task 12: Manual Testing Checklist

**Step 1: Test v2.0 to v3.0 migration**

1. If you have old v2.0 data, verify it migrates on app launch
2. Check AsyncStorage contains `mediaItems` instead of `shows`
3. Verify all old shows have `mediaType: 'show'`

**Step 2: Test adding movies**

1. Tap + button
2. Select "Movie" type
3. Enter only name
4. Save
5. Verify season/episode fields were hidden
6. Verify card shows "🎬 Movie" in expanded view

**Step 3: Test adding shows with optional fields**

1. Add TV show with only name
2. Verify it saves successfully
3. Edit and add rating later
4. Verify optional fields display correctly (dimmed when empty)

**Step 4: Test filtering**

1. Add multiple movies and shows
2. Test "All" tab shows everything
3. Test "Movies" tab shows only movies
4. Test "TV Shows" tab shows only shows
5. Test search filter
6. Test genre filter
7. Test status filter
8. Test combined filters

**Step 5: Test backup system**

1. Export data
2. Verify backup appears in list
3. Verify movie/show counts are correct
4. Test share backup
5. Test delete backup (with confirmation)
6. Test restore backup (with confirmation)

**Step 6: Test import old v2.0 backup**

1. Select old v2.0 backup file
2. Verify migration notice appears
3. Verify all shows imported as `mediaType: 'show'`
4. Verify data merged correctly

**Step 7: Test edge cases**

1. Movie with no rating (should show "-")
2. Show with no season/episode (should show "Not started")
3. Item with no genres (should show "No tags")
4. Changing show to movie (season/episode should be removed)
5. Changing movie to show (season/episode fields should appear)

---

### Task 13: Update Documentation

**Files:**
- Modify: `/workspaces/ShowTracker/README.md`

**Step 1: Update README with v3.0 features**

Add to features section:

```markdown
## Features

### v3.0 (Latest)
- **Movies & TV Shows**: Track both movies and TV shows in one app
- **Flexible Data Entry**: Only name and media type required, all other fields optional
- **Smart Filtering**: Filter by media type (All/Movies/TV Shows), search, genre, and status
- **Enhanced Backups**: View backup list with movie/show counts, restore/share/delete backups
- **Auto-Migration**: Seamlessly imports v2.0 backups with automatic conversion
- **Optional Fields**: Add ratings, tags, notes, and watch dates as needed
- **Dark Theme**: Full dark/light/system theme support

### Core Features
- Expandable cards with detailed information
- Category management (genres, statuses)
- Import/Export functionality
- Persistent tab and filter state
- Clean, modern UI
```

**Step 2: Update installation/usage instructions**

```markdown
## Quick Start

1. Add a movie or TV show with the + button
2. Fill in the name and select type (required)
3. Optionally add rating, tags, status, and notes
4. Use tabs to filter by media type
5. Search and filter by genre/status
6. Export backups from Data Management screen
```

---

## Execution Options

**Plan complete and saved to `docs/plans/2025-11-18-v3-movies-and-shows-implementation.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach would you like?
