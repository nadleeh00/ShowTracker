import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataManager } from '@/utils/dataManager';
import { Show } from '@/types';

// This will be connected to your main data later
export default function DataManagementScreen() {
  const insets = useSafeAreaInsets();
  const [filenameModal, setFilenameModal] = useState<boolean>(false);
  const [exportFilename, setExportFilename] = useState<string>('');

  // Placeholder data - will be connected to real data
  const shows: Show[] = [];
  const categories = {
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  };

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
  };

  const importData = async (): Promise<void> => {
    const importedData = await DataManager.importData();
    if (importedData) {
      // This will be connected to your main data state
      Alert.alert('Success', 'Data imported successfully!');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.sectionDescription}>
            Export your shows and categories to a JSON file for backup or sharing.
          </Text>
          <TouchableOpacity onPress={exportData} style={styles.actionButton}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Export Shows</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Data</Text>
          <Text style={styles.sectionDescription}>
            Import shows and categories from a previously exported JSON file.
          </Text>
          <TouchableOpacity onPress={importData} style={[styles.actionButton, styles.importButton]}>
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Import Shows</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filename Modal */}
      <Modal visible={filenameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Filename</Text>
              <TouchableOpacity onPress={() => setFilenameModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.label}>Enter filename (without .json extension):</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter filename"
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
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
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
