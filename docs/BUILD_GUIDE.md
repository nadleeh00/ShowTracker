# ShowTracker Build Guide

## Overview

ShowTracker uses **EAS Build** (Expo Application Services) for creating development, preview, and production builds. This guide explains the differences between build types and how to create them.

---

## Build Profiles

### 1. Development Build

**Purpose:** Testing native code changes and features that require native modules (like file system access, AsyncStorage, etc.)

**Characteristics:**
- Includes the Expo development client
- Allows hot-reloading and debugging
- Connects to Metro bundler on your computer
- **NOT** suitable for sharing with testers
- Android: Creates debug APK

**When to use:**
- Testing v3.0 features that use native modules (file system, document picker, sharing)
- Debugging native code issues
- Development workflow with fast refresh

**How to create:**
```bash
# Android development build
eas build --profile development --platform android

# iOS development build (requires Mac + Xcode)
eas build --profile development --platform ios
```

**How to install & use:**
1. Download the APK/IPA from EAS dashboard or email
2. Install on your device
3. Run `npm start` on your computer
4. Press 'a' for Android or 'i' for iOS
5. App connects to your dev server for live updates

---

### 2. Preview Build

**Purpose:** Internal testing and sharing with testers before production

**Characteristics:**
- Release mode build (optimized, minified)
- **Standalone** - doesn't need dev server
- Internal distribution (not App Store/Play Store)
- Android: Creates release APK
- Perfect for QA testing and stakeholder review

**When to use:**
- Testing the full v3.0 implementation
- Sharing with beta testers
- Final verification before production
- Testing on devices without development setup

**How to create:**
```bash
# Android preview build
eas build --profile preview --platform android

# iOS preview build (requires Apple Developer account)
eas build --profile preview --platform ios
```

**How to install & use:**
1. Download the APK/IPA from EAS dashboard
2. Install directly on device
3. App runs independently - no dev server needed
4. Test all features as end users would experience them

---

### 3. Production Build

**Purpose:** Submitting to Google Play Store and Apple App Store

**Characteristics:**
- Fully optimized release build
- Auto-increments version numbers
- Signed for store distribution
- Android: Creates AAB (Android App Bundle)
- iOS: Creates IPA ready for App Store Connect

**When to use:**
- Final v3.0 release
- App Store/Play Store submissions
- Official public releases

**How to create:**
```bash
# Android production build
eas build --profile production --platform android

# iOS production build
eas build --profile production --platform ios
```

**How to submit:**
```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

---

## Quick Reference

| Build Type | Mode | Needs Dev Server | Distribution | Use Case |
|------------|------|------------------|--------------|----------|
| **Development** | Debug | ✅ Yes | Internal | Active development with native modules |
| **Preview** | Release | ❌ No | Internal | Testing before production |
| **Production** | Release | ❌ No | App Stores | Public release |

---

## For v3.0 Testing - Recommended Approach

Since v3.0 uses native modules (file system, document picker, sharing), you **cannot test with Expo Go**. Choose one of these:

### Option A: Development Build (Fastest for iterative testing)
```bash
eas build --profile development --platform android
```
- Install once
- Make code changes
- Run `npm start`
- Changes reload instantly
- Best for active development

### Option B: Preview Build (Best for final testing)
```bash
eas build --profile preview --platform android
```
- Fully standalone
- Test exactly as users will experience
- No dev server needed
- Best for QA and stakeholder review

---

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Project (if first time)
```bash
eas build:configure
```

---

## Build Commands

### Android Builds

```bash
# Development build (recommended for v3.0 testing)
eas build --profile development --platform android

# Preview build (for final testing)
eas build --profile preview --platform android

# Production build (for Play Store)
eas build --profile production --platform android
```

### iOS Builds

```bash
# Development build
eas build --profile development --platform ios

# Preview build
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
```

### Both Platforms

```bash
# Build for both platforms
eas build --profile development --platform all
```

---

## Build Process

1. **Trigger Build:**
   ```bash
   eas build --profile preview --platform android
   ```

2. **Wait for Build:**
   - EAS uploads code to cloud
   - Build runs on EAS servers (5-15 minutes)
   - You'll receive email when complete

3. **Download Build:**
   - Check EAS dashboard: https://expo.dev
   - Download APK/IPA from dashboard or email link
   - Or use QR code to install directly

4. **Install:**
   - Android: Install APK directly
   - iOS: Use TestFlight or ad-hoc provisioning

---

## Local Builds (Alternative)

If you prefer building locally instead of EAS cloud:

```bash
# Android local build
eas build --profile preview --platform android --local

# Requires: Android SDK, Java, Gradle installed locally
```

---

## Troubleshooting

### Build Fails
- Check `eas.json` configuration
- Verify `app.json` is valid
- Check EAS dashboard for detailed logs

### Native Module Errors
- Use development or preview builds (not Expo Go)
- Verify all native dependencies are installed
- Check `package.json` for incompatible versions

### Version Conflicts
- Update `version.json`, `app.json`, and `package.json` to match
- See `VERSION_MANAGEMENT.md` for details

---

## Version Management for Builds

Before creating production builds, ensure versions are synchronized:

1. Update `version.json`:
   ```json
   {
     "version": "3.0.0",
     "buildNumber": 3,
     "versionCode": 3
   }
   ```

2. Update `app.json`:
   ```json
   {
     "version": "3.0.0",
     "android": {
       "versionCode": 3
     },
     "ios": {
       "buildNumber": "3"
     }
   }
   ```

3. Update `package.json`:
   ```json
   {
     "version": "3.0.0"
   }
   ```

---

## For Testing v3.0 Right Now

### Recommended: Preview Build

```bash
# 1. Create Android preview build
eas build --profile preview --platform android

# 2. Wait for build (you'll get email when done)

# 3. Download and install APK on your Android device

# 4. Test all v3.0 features:
#    - Adding movies and TV shows
#    - Filtering (All/Movies/TV Shows tabs)
#    - Search and genre/status filters
#    - Backup list with restore/share/delete
#    - Migration from v2.0 (if you have old data)
```

### Alternative: Development Build (if you want live updates)

```bash
# 1. Create development build
eas build --profile development --platform android

# 2. Install on device

# 3. Run dev server
npm start

# 4. Connect device to dev server
# Changes will hot-reload automatically
```

---

## Cost

- **Free tier:** 30 builds/month for Android and iOS combined
- **Paid plans:** Available if you need more builds
- **Local builds:** Unlimited (but requires local Android SDK setup)

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Dashboard](https://expo.dev/accounts/[your-account]/projects/ShowTracker/builds)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

---

**Last Updated:** November 18, 2025
**Current Version:** 3.0.0
**Build Configuration:** `eas.json`
