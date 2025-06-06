import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, themeMode, setThemeMode } = useTheme();

  const showAbout = () => {
    Alert.alert(
      'About Show Tracker',
      'Version 1.0.0\n\nA personal TV show tracking app built with React Native and Expo.\n\nFeatures:\n• Expandable show cards\n• Dark mode support\n• Export/Import functionality\n• Custom categories',
      [{ text: 'OK' }]
    );
  };

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const getThemeModeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  const getThemeModeDescription = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light': return 'Always use light theme';
      case 'dark': return 'Always use dark theme';
      case 'system': return 'Follow system preference';
      default: return 'Follow system preference';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          
          <View style={[styles.settingGroup, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <Text style={[styles.groupTitle, { color: theme.colors.text }]}>Theme Mode</Text>
            <Text style={[styles.groupDescription, { color: theme.colors.textSecondary }]}>Choose how the app appears</Text>
            
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.themeOption}
                onPress={() => handleThemeModeChange(mode)}
                activeOpacity={0.7}
              >
                <View style={[styles.themeOptionContent, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: theme.mode === 'dark' ? 1 : 0,
                }]}>
                  <View style={styles.themeOptionInfo}>
                    <Ionicons 
                      name={
                        mode === 'system' ? 'phone-portrait-outline' :
                        mode === 'light' ? 'sunny-outline' : 'moon-outline'
                      } 
                      size={20} 
                      color={theme.colors.textSecondary} 
                    />
                    <View style={styles.themeOptionText}>
                      <Text style={[styles.themeOptionLabel, { color: theme.colors.text }]}>
                        {getThemeModeLabel(mode)}
                      </Text>
                      <Text style={[styles.themeOptionDescription, { color: theme.colors.textSecondary }]}>
                        {getThemeModeDescription(mode)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.radioButton, { borderColor: theme.colors.primary }]}>
                    {themeMode === mode && (
                      <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Current Theme Preview */}
          <View style={[styles.themePreview, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>Current Theme</Text>
            <View style={[styles.previewCard, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: theme.mode === 'dark' ? 1 : 0,
            }]}>
              <View style={styles.previewHeader}>
                <Text style={[styles.previewTitle, { color: theme.colors.text }]}>Sample Show</Text>
                <View style={[styles.previewRating, { backgroundColor: theme.colors.ratingExcellent }]}>
                  <Text style={styles.previewRatingText}>8.5</Text>
                </View>
              </View>
              <View style={styles.previewStatus}>
                <View style={[styles.previewBadge, { backgroundColor: theme.colors.statusCompleted }]}>
                  <Text style={styles.previewBadgeText}>Completed</Text>
                </View>
                <Text style={[styles.previewEpisode, { color: theme.colors.textSecondary }]}>S3E12</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data & Privacy</Text>
          
          <TouchableOpacity style={[styles.settingItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Data Storage</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>All data stored locally on device</Text>
              </View>
            </View>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Privacy</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>No data collection or tracking</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Features</Text>
          
          <View style={[styles.featureItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.featureInfo}>
              <Ionicons name="list-outline" size={20} color={theme.colors.success} />
              <View style={styles.featureText}>
                <Text style={[styles.featureLabel, { color: theme.colors.text }]}>Expandable Cards</Text>
                <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>Tap to expand show details</Text>
              </View>
            </View>
            <View style={[styles.featureBadge, { backgroundColor: theme.colors.successLight }]}>
              <Text style={[styles.featureBadgeText, { color: theme.colors.success }]}>Active</Text>
            </View>
          </View>

          <View style={[styles.featureItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.featureInfo}>
              <Ionicons name="download-outline" size={20} color={theme.colors.success} />
              <View style={styles.featureText}>
                <Text style={[styles.featureLabel, { color: theme.colors.text }]}>Export/Import</Text>
                <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>Backup your show data</Text>
              </View>
            </View>
            <View style={[styles.featureBadge, { backgroundColor: theme.colors.successLight }]}>
              <Text style={[styles.featureBadgeText, { color: theme.colors.success }]}>Active</Text>
            </View>
          </View>

          <View style={[styles.featureItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.featureInfo}>
              <Ionicons name="color-palette-outline" size={20} color={theme.colors.success} />
              <View style={styles.featureText}>
                <Text style={[styles.featureLabel, { color: theme.colors.text }]}>Dark Mode</Text>
                <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>System-aware theming</Text>
              </View>
            </View>
            <View style={[styles.featureBadge, { backgroundColor: theme.colors.successLight }]}>
              <Text style={[styles.featureBadgeText, { color: theme.colors.success }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
          
          <TouchableOpacity style={[styles.settingItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]} onPress={showAbout}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>About Show Tracker</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Version 1.0.0 • Built with Expo</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: theme.mode === 'dark' ? 1 : 0,
          }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Made for Personal Use</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>Track your shows, your way</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for safe area */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  
  // Theme selection styles
  settingGroup: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  themeOption: {
    marginBottom: 8,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  themeOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  themeOptionDescription: {
    fontSize: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Theme preview
  themePreview: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 8,
    padding: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewRating: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  previewEpisode: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Regular setting items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },

  // Feature items
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
