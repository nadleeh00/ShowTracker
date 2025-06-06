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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import type { Show, Categories, FormData } from '../../../types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableShowCardProps {
  show: Show;
  onEdit: (show: Show) => void;
  onDelete: (id: number) => void;
}

const ExpandableShowCard: React.FC<ExpandableShowCardProps> = ({ show, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return theme.colors.ratingExcellent;
    if (rating >= 6) return theme.colors.ratingGood;
    return theme.colors.ratingPoor;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Currently Watching': return theme.colors.statusWatching;
      case 'Completed': return theme.colors.statusCompleted;
      case 'On Hold': return theme.colors.statusOnHold;
      case 'Plan to Watch': return theme.colors.statusPlanToWatch;
      default: return theme.colors.statusPlanToWatch;
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.showCard}>
      <TouchableOpacity 
        onPress={toggleExpanded}
        style={styles.cardHeader}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.showTitle} numberOfLines={expanded ? 0 : 2}>
              {show.name}
            </Text>
            <View style={styles.headerIndicators}>
              <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(show.rating) }]}>
                <Text style={styles.ratingText}>{show.rating}</Text>
              </View>
              <Ionicons 
                name={expanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </View>
          
          {!expanded && (
            <View style={styles.compactInfo}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(show.status) }]}>
                <Text style={styles.statusText}>{show.status}</Text>
              </View>
              <Text style={styles.episodeInfo}>S{show.season}E{show.episode}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Genres</Text>
              <View style={styles.genreContainer}>
                {show.genres && show.genres.length > 0 ? (
                  show.genres.map((genre, index) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.detailValue}>None</Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(show.status) }]}>
                <Text style={styles.statusText}>{show.status}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating</Text>
              <View style={styles.ratingContainer}>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(show.rating) }]}>
                  <Text style={styles.ratingText}>{show.rating}</Text>
                </View>
                <Text style={styles.ratingScale}>/ 10</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Progress</Text>
              <Text style={styles.detailValue}>Season {show.season}, Episode {show.episode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Watched</Text>
              <Text style={styles.detailValue}>{show.dateWatched}</Text>
            </View>

            {show.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.notesText}>{show.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity 
              onPress={() => onEdit(show)} 
              style={[styles.actionButton, styles.editButton]}
            >
              <Ionicons name="create" size={16} color={theme.colors.secondary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => onDelete(show.id)} 
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Ionicons name="trash" size={16} color={theme.colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default function ShowTracker() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
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

  const styles = createStyles(theme);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Modal visible={pickerVisible} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
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
                      <Ionicons name="checkmark" size={20} color={theme.colors.success} />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {shows.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="tv-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={styles.emptyText}>No shows tracked yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first show!</Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your Shows</Text>
              <Text style={styles.listSubtitle}>{shows.length} show{shows.length !== 1 ? 's' : ''} tracked</Text>
            </View>
            
            {shows.map(show => (
              <ExpandableShowCard
                key={show.id}
                show={show}
                onEdit={editShow}
                onDelete={deleteShow}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal with theme support */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingShow ? 'Edit Show' : 'Add New Show'}
            </Text>
            <TouchableOpacity onPress={resetForm}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Show Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter show name"
                placeholderTextColor={theme.colors.textTertiary}
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
                placeholderTextColor={theme.colors.textTertiary}
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
                  placeholderTextColor={theme.colors.textTertiary}
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
                  placeholderTextColor={theme.colors.textTertiary}
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
                placeholderTextColor={theme.colors.textTertiary}
                value={formData.dateWatched}
                onChangeText={(text) => setFormData({...formData, dateWatched: text})}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any additional notes..."
                placeholderTextColor={theme.colors.textTertiary}
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

// Dynamic styles function that adapts to theme
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listHeader: {
    paddingVertical: 20,
    paddingBottom: 16,
  },
  listTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  
  // Themed card styles
  showCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: theme.mode === 'dark' ? 1 : 0,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    padding: 16,
  },
  headerContent: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  showTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  headerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  episodeInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  
  // Expanded content styles
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  detailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    flex: 1,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'right',
  },
  genreContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  genreTag: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: theme.mode === 'dark' ? 1 : 0,
    borderColor: theme.colors.border,
  },
  genreText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScale: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.primaryLight : '#eff6ff',
    borderColor: theme.colors.secondary,
  },
  editButtonText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.errorLight : '#fef2f2',
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal styles with theme support
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  genreOptionSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  genreOptionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  genreOptionTextSelected: {
    color: '#fff',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: theme.colors.textTertiary,
  },
  pickerModal: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: theme.colors.surface,
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
    borderBottomColor: theme.colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
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
