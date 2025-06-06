import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Categories } from '@/types';

// This will be connected to your main data later
export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Categories>({
    genres: ['Drama', 'Comedy', 'Sci-Fi', 'Action', 'Documentary'],
    statuses: ['Currently Watching', 'Completed', 'On Hold', 'Plan to Watch']
  });
  const [newGenre, setNewGenre] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const addCategory = (type: keyof Categories, value: string) => {
    if (value && !categories[type].includes(value)) {
      setCategories({
        ...categories,
        [type]: [...categories[type], value]
      });
    }
  };

  const removeCategory = (type: string, value: string) => {
    setCategories({
      ...categories,
      [type]: categories[type].filter((cat: string) => cat !== value)
    });
  };

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content}>
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
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryText: {
    fontSize: 16,
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
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
