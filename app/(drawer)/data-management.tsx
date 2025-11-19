import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { DataManager } from '@/utils/dataManager';
import { MediaItem, BackupMetadata } from '@/types';
import { useTheme } from '@/app/contexts/ThemeContext';

// This will be connected to your main data later
export default function DataManagementScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [filenameModal, setFilenameModal] = useState<boolean>(false);
  const [exportFilename, setExportFilename] = useState<string>('');
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Placeholder data - will be connected to real data
  const shows: MediaItem[] = [];
  const categories = {
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  };

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

  const exportData = async (): Promise<void> => {
    const defaultName = `showtracker-backup-${new Date().toISOString().split('T')[0]}`;
    setExportFilename(defaultName);
    setFilenameModal(true);
  };

  const handleExportWithFilename = async (): Promise<void> => {
    const sanitizedFilename = exportFilename.trim().replace(/[<>:"/\\|?*]/g, '-') ||
      `showtracker-backup-${new Date().toISOString().split('T')[0]}`;

    setFilenameModal(false);
    await DataManager.exportData(shows, categories, sanitizedFilename);
    setExportFilename('');

    // Refresh backup list
    await loadBackups();
  };

  const importData = async (): Promise<void> => {
    const importedData = await DataManager.importData();
    if (importedData) {
      // This will be connected to your main data state
      Alert.alert('Success', 'Data imported successfully!');
    }
  };

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

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadBackups} />
        }
      >
        {/* Current Data Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Current Data</Text>
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shows.filter((s: MediaItem) => s.mediaType === 'movie').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Movies</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                {shows.filter((s: MediaItem) => s.mediaType === 'show').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>TV Shows</Text>
            </View>
          </View>
        </View>

        {/* Backup List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Saved Backups</Text>
        {backups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No backups found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
              Export your data to create a backup
            </Text>
          </View>
        ) : (
          backups.map((backup, index) => (
            <View key={index} style={[styles.backupCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.backupHeader}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                <View style={styles.backupInfo}>
                  <Text style={[styles.backupFilename, { color: theme.colors.text }]}>{backup.filename}</Text>
                  <Text style={[styles.backupDate, { color: theme.colors.textSecondary }]}>
                    {new Date(backup.exportDate).toLocaleString()}
                  </Text>
                  <View style={styles.backupStats}>
                    <Text style={[styles.backupStat, { color: theme.colors.textSecondary }]}>
                      🎬 {backup.movieCount} movies
                    </Text>
                    <Text style={[styles.backupStat, { color: theme.colors.textSecondary }]}>
                      📺 {backup.showCount} shows
                    </Text>
                    <Text style={[styles.backupStat, { color: theme.colors.textSecondary }]}>
                      v{backup.version}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.backupActions}>
                <TouchableOpacity
                  style={[styles.backupButton, styles.restoreButton, { backgroundColor: theme.colors.primary }]}
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

        {/* Export/Import Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Export Data</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Export your shows and categories to a JSON file for backup or sharing.
          </Text>
          <TouchableOpacity onPress={exportData} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Export Shows</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Import Data</Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Import shows and categories from a previously exported JSON file.
          </Text>
          <TouchableOpacity onPress={importData} style={[styles.actionButton, styles.importButton]}>
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Import Shows</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Filename Modal */}
      <Modal visible={filenameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Export Filename</Text>
              <TouchableOpacity onPress={() => setFilenameModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Enter filename (without .json extension):</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.background }]}
                placeholder="Enter filename"
                placeholderTextColor={theme.colors.textSecondary}
                value={exportFilename}
                onChangeText={setExportFilename}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setFilenameModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportWithFilename}
                  style={[styles.modalButton, styles.confirmButton]}
                >
                  <Text style={styles.confirmButtonText}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  backupCard: {
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
    marginBottom: 4,
  },
  backupDate: {
    fontSize: 12,
    marginBottom: 6,
  },
  backupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupStat: {
    fontSize: 12,
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
    // backgroundColor set dynamically via theme
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
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  importButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '40%',
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
