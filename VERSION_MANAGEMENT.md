# Version Management

ShowTracker uses a centralized version system:

## Single Source of Truth
- `version.json` - Contains version numbers
- `utils/dataManager.ts` - Imports and exposes version via `getVersion()`

## Files to Update When Incrementing Version

### Automatic (via DataManager.getVersion())
- Export file metadata
- Settings screen about dialog
- Settings screen version display

### Manual Update Required
- `version.json` - Update all version fields
- `app.json` - Update `version`, `buildNumber`, `versionCode`
- `package.json` - Update `version`

## Update Process
1. Update `version.json` with new version
2. Update `app.json` version fields to match
3. Update `package.json` version to match
4. DataManager and Settings will automatically use new version
