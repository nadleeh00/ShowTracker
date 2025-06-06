import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { AppData, Show, Categories } from '../types';
import versionInfo from '../version.json'; 

export class DataManager {
  private static readonly VERSION = versionInfo.version.split('.').slice(0, 2).join('.'); // "2.0" from "2.0.0"

  // Add this public getter method
  static getVersion(): string {
    return this.VERSION;
  }

  static getFullVersion(): string {
    return versionInfo.version; // "2.0.0"
  }

  static async exportData(shows: Show[], categories: Categories, customFilename?: string): Promise<void> {
    try {
      const dataToExport: AppData = {
        shows,
        categories,
        exportDate: new Date().toISOString(),
        version: this.VERSION
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
        type: ['application/json', 'text/plain', '*/*'], // More permissive types
        copyToCacheDirectory: true,
      });
  
      if (result.canceled) {
        return null;
      }
  
      let fileContent: string;
      const asset = result.assets[0];
      
      try {
        // Try direct read first
        fileContent = await FileSystem.readAsStringAsync(asset.uri);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (directReadError: unknown) {
        console.log('Direct read failed, trying copy method...');
        
        // If direct read fails, use copy method
        const fileName = asset.name || 'import.json';
        const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: tempUri
        });
        
        fileContent = await FileSystem.readAsStringAsync(tempUri);
        
        // Clean up
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      }
  
      // Parse and validate
      const importedData = JSON.parse(fileContent) as AppData;
  
      if (!this.validateImportData(importedData)) {
        Alert.alert('Import Error', 'Invalid file format. Please select a valid ShowTracker backup file.');
        return null;
      }
  
      return importedData;
    } catch (error) {
      console.error('Import error:', error);
      
      // Type guard for error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // error messages
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
