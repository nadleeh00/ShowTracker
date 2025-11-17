# ShowTracker Documentation

## Project Overview

ShowTracker is a React Native mobile app for tracking movies and TV shows with support for ratings, progress tracking, genres, and backup management.

**Current Version:** 2.0.0
**Next Version:** 3.0.0 (In Planning)

## Project Status

### ✅ Current Features (v2.0.0)
- TV show tracking with expandable cards
- Rating system (1-10 scale)
- Season/episode progress tracking
- Genre tagging
- Status tracking (Currently Watching, Completed, On Hold, Plan to Watch)
- Import/Export functionality (JSON files)
- Dark/Light theme support
- Category management

### 🚧 In Progress (v3.0.0)
**Design Complete** - See `docs/plans/2025-11-17-movies-and-shows-design.md`

Key features planned:
- Movie and TV show distinction
- Optional fields (only name + media type required)
- Tabbed filtering (All/Movies/TV Shows)
- Inline search and genre/status filters
- Backup list screen with metadata
- Backward compatibility with v2.0 backups
- Tag-based movie collections

### 📋 Backlog
- Statistics dashboard
- Cloud sync
- TMDB/IMDB API integration
- Advanced sorting options

## Architecture

**Technology Stack:**
- React Native 0.79.2 with Expo 53.0.9
- Expo Router for navigation
- AsyncStorage for persistence
- TypeScript 5.8.3

**Key Services:**
- `DataManager` - Import/Export/Storage operations
- `ThemeContext` - Theme management (light/dark/system)

**Data Model:**
- Shows stored as JSON in AsyncStorage
- Categories (genres/statuses) managed separately
- All data encrypted before storage

## Documentation Structure

```
docs/
├── README.md                                      # This file - project overview
├── plans/
│   └── 2025-11-17-movies-and-shows-design.md    # v3.0 feature design
└── (future)
    ├── architecture.md                           # System architecture deep dive
    └── api.md                                    # Service/API documentation
```

## Next Steps

### Immediate: Implement v3.0 Features

1. **Create Implementation Plan**
   - Use `/superpowers:write-plan` to create detailed implementation tasks
   - Break down design into bite-sized development steps

2. **Set Up Development Workspace**
   - Create git worktree for isolated development
   - Branch: `feature/movies-and-shows-v3`

3. **Execute Implementation**
   - Follow implementation plan
   - Test backward compatibility thoroughly
   - Update version.json to 3.0.0

### Future: Post-v3.0 Enhancements
- Statistics screen implementation
- Cloud backup integration
- External API metadata fetching

## Contributing

When working on ShowTracker:

1. **Always commit with conventional commits format**
   - Use `git-commit-enforcer` skill for clean commit messages
   - No Claude attribution in commits

2. **Update documentation**
   - Keep this README current with project status
   - Document major architectural changes

3. **Test backward compatibility**
   - Always test import of old backup files
   - Validate migration logic thoroughly

## Resources

- Design Document: `docs/plans/2025-11-17-movies-and-shows-design.md`
- Version File: `version.json`
- Data Manager: `utils/dataManager.ts`
- Type Definitions: `types/index.ts`

---

**Last Updated:** November 17, 2025
**Status:** Design phase complete, ready for implementation planning
