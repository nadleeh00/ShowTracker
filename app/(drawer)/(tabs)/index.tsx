import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Categories, FormData, MediaItem } from '../../../types';
import { DataMigrator } from '../../../utils/dataMigrator';
import { useTheme } from '../../contexts/ThemeContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableShowCardProps {
  item: MediaItem;  // Changed from show: MediaItem
  onEdit: (item: MediaItem) => void;
  onDelete: (id: number) => void;
}

const ExpandableShowCard: React.FC<ExpandableShowCardProps> = ({ item, onEdit, onDelete }) => {
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
              {item.name}
            </Text>
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
          </View>

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
        </View>
      </TouchableOpacity>

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
    </View>
  );
};

export default function ShowTracker() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [shows, setShows] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Categories>({
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingShow, setEditingShow] = useState<MediaItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    mediaType: 'show',
    genres: [],
    status: '',
    rating: '',
    season: '',
    episode: '',
    dateWatched: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Task 7 Step 1: Add filter state
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'shows'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const styles = createStyles(theme);

  // Task 7 Step 2: Create filtered items computation
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

  const loadData = useCallback(async () => {
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
          setCategories({
            genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
            statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const saveData = useCallback(async () => {
    try {
      const dataToSave = {
        mediaItems: shows,
        categories: categories,
        exportDate: new Date().toISOString(),
        version: '3.0.0'
      };
      await AsyncStorage.setItem('showTrackerData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [shows, categories]);

  // Task 8 Step 1: Load filter state on mount
  const loadFilterState = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
    loadFilterState();
  }, [loadData, loadFilterState]);

  useEffect(() => {
    if (shows.length > 0 || categories.genres.length > 5) {
      saveData();
    }
  }, [shows, categories, saveData]);

  // Task 8 Step 2: Save filter state on changes
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

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const newItem: MediaItem = {
      id: editingShow ? editingShow.id : Date.now(),
      name: formData.name.trim(),
      mediaType: formData.mediaType,

      // Optional fields - only include if not empty
      ...(formData.genres.length > 0 && { genres: formData.genres }),
      ...(formData.status && { status: formData.status }),
      ...(formData.rating && { rating: parseFloat(formData.rating) }),
      ...(formData.dateWatched && { dateWatched: formData.dateWatched }),
      ...(formData.notes.trim() && { notes: formData.notes.trim() }),

      // Show-specific fields (only for TV shows)
      ...(formData.mediaType === 'show' && formData.season && { season: parseInt(formData.season) }),
      ...(formData.mediaType === 'show' && formData.episode && { episode: parseInt(formData.episode) }),
    };

    if (editingShow) {
      setShows(shows.map(show => show.id === editingShow.id ? newItem : show));
    } else {
      setShows([...shows, newItem]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mediaType: 'show',
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

  const editShow = (show: MediaItem) => {
    setFormData({
      name: show.name,
      mediaType: show.mediaType,
      genres: show.genres || [],
      status: show.status || '',
      rating: show.rating == null ? '' : show.rating.toString(),
      season: show.season == null ? '' : show.season.toString(),
      episode: show.episode == null ? '' : show.episode.toString(),
      dateWatched: show.dateWatched || new Date().toISOString().split('T')[0],
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
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Task 7 Step 3: Add tab selector and filters */}
      <View style={styles.content}>
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
      </View>

      <ScrollView
        style={styles.contentList}
        contentContainerStyle={filteredItems.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add your first {activeTab === 'movies' ? 'movie' : activeTab === 'shows' ? 'TV show' : 'item'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {activeTab === 'all' ? 'All Media' : activeTab === 'movies' ? 'Movies' : 'TV Shows'}
              </Text>
              <Text style={styles.listSubtitle}>
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                {shows.length !== filteredItems.length && ` (${shows.length} total)`}
              </Text>
            </View>

            {filteredItems.map(show => (
              <ExpandableShowCard
                key={show.id}
                item={show}
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
            {/* Media Type Selector */}
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
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

            {/* Season/Episode fields - only for TV shows */}
            {formData.mediaType === 'show' && (
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Season</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Optional"
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
                    placeholder="Optional"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={formData.episode}
                    onChangeText={(text) => setFormData({...formData, episode: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentList: {
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
    bottom: 20,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
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
  dimmedText: {
    opacity: 0.5,
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
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: theme.colors.secondary,
  },
  deleteButton: {
    backgroundColor: '#f44336',
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
    backgroundColor: theme.mode === 'dark' ? theme.colors.primaryLight : theme.colors.primary + '20',
  },
  mediaTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  mediaTypeTextActive: {
    color: theme.colors.primary,
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

  // Task 7 Step 5: Add filter styles
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
    paddingVertical: 5,
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
});
