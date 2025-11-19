# ShowTracker

A modern, feature-rich media tracker for movies and TV shows built with React Native and Expo.

## Features

### v3.0 (Latest)
- **Movies & TV Shows**: Track both movies and TV shows in one app
- **Flexible Data Entry**: Only name and media type required, all other fields optional
- **Smart Filtering**: Filter by media type (All/Movies/TV Shows), search, genre, and status
- **Enhanced Backups**: View backup list with movie/show counts, restore/share/delete backups
- **Auto-Migration**: Seamlessly imports v2.0 backups with automatic conversion
- **Optional Fields**: Add ratings, tags, notes, and watch dates as needed
- **Dark Theme**: Full dark/light/system theme support

### Core Features
- Expandable cards with detailed information
- Category management (genres, statuses)
- Import/Export functionality
- Persistent tab and filter state
- Clean, modern UI

## Quick Start

1. Add a movie or TV show with the + button
2. Fill in the name and select type (required)
3. Optionally add rating, tags, status, and notes
4. Use tabs to filter by media type
5. Search and filter by genre/status
6. Export backups from Data Management screen

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo Go app (for mobile testing)

### Steps

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Usage

### Adding Media Items

1. Tap the **+** button in the top-right corner
2. Select the media type (Movie or TV Show)
3. Enter the name (required)
4. Optionally fill in:
   - Tags/Genres
   - Status (Watching, Completed, Plan to Watch, etc.)
   - Rating (0-10)
   - Season & Episode (TV Shows only)
   - Date Watched
   - Notes

### Filtering and Search

- Use the **All/Movies/TV Shows** tabs to filter by media type
- Use the search bar to find items by name
- Filter by genre using the genre chips
- Filter by status using the status chips
- All filters work together for powerful searching

### Data Management

Navigate to the **Data Management** screen from the drawer menu to:

- View current data statistics (movie and show counts)
- See all saved backups with metadata
- Export new backups with custom filenames
- Import backups from files
- Restore previous backups
- Share backups with others
- Delete old backups

### Backup Migration

ShowTracker v3.0 automatically migrates v2.0 backups:

- Import any v2.0 backup file
- App automatically converts shows to new format
- All data preserved with proper media type assignment
- Migration notice displayed upon successful conversion

## Tech Stack

- **React Native** 0.79.2
- **Expo** 53
- **TypeScript** 5.8.3
- **AsyncStorage** for local data persistence
- **expo-file-system** for backup management
- **expo-document-picker** for file imports
- **expo-sharing** for backup exports

## Project Structure

```
ShowTracker/
├── app/                      # App screens (file-based routing)
│   ├── (drawer)/            # Drawer navigation screens
│   │   ├── (tabs)/          # Tab navigation screens
│   │   │   ├── index.tsx    # Main media list screen
│   │   │   └── categories.tsx # Category management
│   │   ├── settings.tsx     # Settings screen
│   │   └── data-management.tsx # Backup management
│   └── _layout.tsx          # Root layout
├── types/                   # TypeScript interfaces
│   └── index.ts            # MediaItem, AppData, etc.
├── utils/                   # Utility functions
│   ├── dataManager.ts      # Import/export logic
│   └── dataMigrator.ts     # v2.0 to v3.0 migration
├── themes/                  # Theme definitions
│   └── index.tsx           # Light/dark themes
└── version.json            # App version info
```

## Development

### Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Type Checking

```bash
npx tsc --noEmit
```

### Build for Production

```bash
npx expo build:android
npx expo build:ios
```

## Learn More

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the Community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Version History

### v3.0.0 (Current)
- Added movie support alongside TV shows
- Implemented flexible optional fields
- Added smart filtering with tabs
- Enhanced backup system with metadata
- Automatic v2.0 migration support
- Persistent filter state

### v2.0.0
- Dark theme support
- Settings screen
- Improved UI with expandable cards
- Category management

### v1.0.0
- Initial release
- TV show tracking
- Basic import/export
