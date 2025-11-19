import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { AppData, MediaItem, Categories, ImportableAppData, BackupMetadata } from '../types';
import { DataMigrator } from './dataMigrator';
import versionInfo from '../version.json'; 

export class DataManager {
  private static readonly VERSION = '3.0'; // Updated for v3.0

  // Add this public getter method
  static getVersion(): string {
    return this.VERSION;
  }

  static getFullVersion(): string {
    return versionInfo.version; // "2.0.0"
  }

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
}
