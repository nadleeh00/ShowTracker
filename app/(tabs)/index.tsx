import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataManager } from '../../utils/dataManager';
import type { Show, Categories, FormData } from '../../types';

export default function ShowTracker() {
  const insets = useSafeAreaInsets();
  const [shows, setShows] = useState<Show[]>([]);
  const [categories, setCategories] = useState<Categories>({
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [categoryModal, setCategoryModal] = useState<boolean>(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    genres: [],
    status: '',
    rating: '',
    season: '',
    episode: '',
    dateWatched: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever shows or categories change
  useEffect(() => {
    if (shows.length > 0 || categories.genres.length > 5) {
      saveData();
    }
  }, [shows, categories]);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('showTrackerData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setShows(data.shows || []);
        setCategories(data.categories || categories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      const dataToSave = { shows, categories };
      await AsyncStorage.setItem('showTrackerData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || formData.genres.length === 0 || !formData.status || !formData.rating || !formData.season || !formData.episode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newShow = {
      id: editingShow ? editingShow.id : Date.now(),
      ...formData,
      rating: parseInt(formData.rating),
      season: parseInt(formData.season),
      episode: parseInt(formData.episode)
    };

    if (editingShow) {
      setShows(shows.map(show => show.id === editingShow.id ? newShow : show));
    } else {
      setShows([...shows, newShow]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genres: [],
      status: '',
      rating: '',
      season: '',
      episode: '',
      dateWatched: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingShow(null);
    setShowModal(false);
  };

  const editShow = (show) => {
    setFormData({
      name: show.name,
      genres: show.genres || [],
      status: show.status,
      rating: show.rating.toString(),
      season: show.season.toString(),
      episode: show.episode.toString(),
      dateWatched: show.dateWatched,
      notes: show.notes || ''
    });
    setEditingShow(show);
    setShowModal(true);
  };

  const deleteShow = (id) => {
    Alert.alert(
      'Delete Show',
      'Are you sure you want to delete this show?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setShows(shows.filter(show => show.id !== id));
        }}
      ]
    );
  };

  const addCategory = (type, value) => {
    if (value && !categories[type].includes(value)) {
      setCategories({
        ...categories,
        [type]: [...categories[type], value]
      });
    }
  };

  const removeCategory = (type, value) => {
    setCategories({
      ...categories,
      [type]: categories[type].filter(cat => cat !== value)
    });
  };

  const exportData = async (): Promise<void> => {
    await DataManager.exportData(shows, categories);
  };
  
  const importData = async (): Promise<void> => {
    const importedData = await DataManager.importData();
    if (importedData) {
      setShows(importedData.shows);
      setCategories(importedData.categories);
      Alert.alert('Success', 'Data imported successfully!');
    }
  };

  const toggleGenre = (genre) => {
    if (formData.genres.includes(genre)) {
      setFormData({
        ...formData,
        genres: formData.genres.filter(g => g !== genre)
      });
    } else {
      setFormData({
        ...formData,
        genres: [...formData.genres, genre]
      });
    }
  };

  const CategoryManager = () => {
    const [newGenre, setNewGenre] = useState('');
    const [newStatus, setNewStatus] = useState('');

    const handleAddGenre = () => {
      if (newGenre.trim()) {
        addCategory('genres', newGenre.trim());
        setNewGenre('');
      }
    };

    const handleAddStatus = () => {
      if (newStatus.trim()) {
        addCategory('statuses', newStatus.trim());
        setNewStatus('');
      }
    };

    return (
      <Modal visible={categoryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Categories</Text>
            <TouchableOpacity onPress={() => setCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Genres</Text>
              {categories.genres.map(genre => (
                <View key={genre} style={styles.categoryItem}>
                  <Text style={styles.categoryText}>{genre}</Text>
                  <TouchableOpacity
                    onPress={() => removeCategory('genres', genre)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addCategoryRow}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="Add new genre"
                  value={newGenre}
                  onChangeText={setNewGenre}
                />
                <TouchableOpacity onPress={handleAddGenre} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categorySection}>
              <Text style={styles.categoryTitle}>Statuses</Text>
              {categories.statuses.map(status => (
                <View key={status} style={styles.categoryItem}>
                  <Text style={styles.categoryText}>{status}</Text>
                  <TouchableOpacity
                    onPress={() => removeCategory('statuses', status)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addCategoryRow}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="Add new status"
                  value={newStatus}
                  onChangeText={setNewStatus}
                />
                <TouchableOpacity onPress={handleAddStatus} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const StatusPicker = () => {
    const [pickerVisible, setPickerVisible] = useState(false);

    return (
      <>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={formData.status ? styles.pickerText : styles.pickerPlaceholder}>
            {formData.status || 'Select Status'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        <Modal visible={pickerVisible} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {categories.statuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({...formData, status});
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{status}</Text>
                    {formData.status === status && (
                      <Ionicons name="checkmark" size={20} color="#10b981" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Show Tracker</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setCategoryModal(true)}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={[styles.headerButton, styles.addButton]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Show</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exportButtons}>
        <TouchableOpacity onPress={exportData} style={styles.exportButton}>
          <Ionicons name="download" size={16} color="#fff" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={importData} style={[styles.exportButton, styles.importButton]}>
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.exportButtonText}>Import</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {shows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No shows tracked yet. Add your first show!</Text>
          </View>
        ) : (
          shows.map(show => (
            <View key={show.id} style={styles.showCard}>
              <View style={styles.showHeader}>
                <Text style={styles.showTitle}>{show.name}</Text>
                <View style={styles.showActions}>
                  <TouchableOpacity onPress={() => editShow(show)} style={styles.actionButton}>
                    <Ionicons name="create" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteShow(show.id)} style={styles.actionButton}>
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.showDetails}>
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Genres: </Text>
                  {show.genres ? show.genres.join(', ') : 'None'}
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Status: </Text>
                  {show.status}
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Rating: </Text>
                  {show.rating}/10
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Last Watched: </Text>
                  S{show.season}E{show.episode}
                </Text>
                <Text style={styles.detail}>
                  <Text style={styles.detailLabel}>Date: </Text>
                  {show.dateWatched}
                </Text>
                {show.notes && (
                  <Text style={styles.detail}>
                    <Text style={styles.detailLabel}>Notes: </Text>
                    {show.notes}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingShow ? 'Edit Show' : 'Add New Show'}
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Show Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter show name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Genres (select multiple)</Text>
              <View style={styles.genreGrid}>
                {categories.genres.map(genre => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreOption,
                      formData.genres.includes(genre) && styles.genreOptionSelected
                    ]}
                    onPress={() => toggleGenre(genre)}
                  >
                    <Text style={[
                      styles.genreOptionText,
                      formData.genres.includes(genre) && styles.genreOptionTextSelected
                    ]}>
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <StatusPicker />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rating (1-10)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter rating"
                value={formData.rating}
                onChangeText={(text) => setFormData({...formData, rating: text})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Season</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Season"
                  value={formData.season}
                  onChangeText={(text) => setFormData({...formData, season: text})}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Episode</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Episode"
                  value={formData.episode}
                  onChangeText={(text) => setFormData({...formData, episode: text})}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date Watched</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.dateWatched}
                onChangeText={(text) => setFormData({...formData, dateWatched: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any additional notes..."
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>
                {editingShow ? 'Update Show' : 'Add Show'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <CategoryManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#10b981',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  exportButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6b7280',
    borderRadius: 6,
  },
  importButton: {
    backgroundColor: '#3b82f6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  showCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  showTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  showActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  showDetails: {
    gap: 4,
  },
  detail: {
    fontSize: 14,
    color: '#4b5563',
  },
  detailLabel: {
    fontWeight: '500',
    color: '#1f2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
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
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 80,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  genreOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  genreOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  genreOptionTextSelected: {
    color: '#fff',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#1f2937',
  },
  deleteButton: {
    padding: 4,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addCategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});
