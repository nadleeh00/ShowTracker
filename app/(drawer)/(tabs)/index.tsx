import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Show, Categories, FormData } from '../../../types';

export default function ShowTracker() {
  const insets = useSafeAreaInsets();
  const [shows, setShows] = useState<Show[]>([]);
  const [categories, setCategories] = useState<Categories>({
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  });
  const [showModal, setShowModal] = useState<boolean>(false);
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

  const loadData = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem('showTrackerData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setShows(data.shows || []);
        setCategories(data.categories || {
          genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
          statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const saveData = useCallback(async () => {
    try {
      const dataToSave = { shows, categories };
      await AsyncStorage.setItem('showTrackerData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [shows, categories]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data on changes
  useEffect(() => {
    if (shows.length > 0 || categories.genres.length > 5) {
      saveData();
    }
  }, [shows, categories, saveData]);

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

  const editShow = (show: Show) => {
    setFormData({
      name: show.name,
      genres: show.genres || [],
      status: show.status,
      rating: show.rating == null ? '' : show.rating.toString(),
      season: show.season == null ? '' : show.season.toString(),
      episode: show.episode == null ? '' : show.episode.toString(),
      dateWatched: show.dateWatched,
      notes: show.notes || ''
    });
    setEditingShow(show);
    setShowModal(true);
  };

  const deleteShow = (id: number) => {
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

  const toggleGenre = (genre: string) => {
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={styles.fab}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        {shows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="tv-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No shows tracked yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first show!</Text>
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

      {/* Show Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
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
    paddingTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  showCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    padding: 8,
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
});
