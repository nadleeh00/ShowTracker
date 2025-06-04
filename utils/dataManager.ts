import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { AppData, Show, Categories } from '../types';

export class DataManager {
  private static readonly VERSION = "1.0";

  static async exportData(shows: Show[], categories: Categories): Promise<void> {
    try {
      const dataToExport: AppData = {
        shows,
        categories,
        exportDate: new Date().toISOString(),
        version: this.VERSION
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const filename = `showtracker-backup-${new Date().toISOString().split('T')[0]}.json`;
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
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  }

  static async importData(): Promise<AppData | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return null;
      }

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const importedData = JSON.parse(fileContent) as AppData;

      // Validate data structure
      if (!this.validateImportData(importedData)) {
        Alert.alert('Import Error', 'Invalid file format. Please select a valid ShowTracker backup file.');
        return null;
      }

      return importedData;
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'Failed to import data. Please check the file format and try again.');
      return null;
    }
  }

  private static validateImportData(data: any): data is AppData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.shows) &&
      data.categories &&
      Array.isArray(data.categories.genres) &&
      Array.isArray(data.categories.statuses)
    );
  }
}
