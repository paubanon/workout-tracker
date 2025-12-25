# Android APK Build Guide

This guide explains how to generate a local APK for your Workout Tracker app.

## Prerequisites

- **EAS CLI**: Ensure you have the EAS CLI installed globally:
  ```bash
  npm install -g eas-cli
  ```
- **Login**: You must be logged into your Expo account:
  ```bash
  eas login
  ```
- **Android SDK**: Ensure `ANDROID_HOME` is set in your environment. You can add this to your `~/.zshrc` file:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export PATH=$PATH:$JAVA_HOME/bin
  ```
  *After adding this, restart your terminal or run `source ~/.zshrc`.*

## Build Process

### Step 1: Prebuild (regenerate native files)
Run this to ensure the Android folder is up to date with your `app.json` and dependencies:
```bash
npx expo prebuild --platform android --clean
```
Answer "yes" if prompted about uncommitted changes.

### Step 2: Build the APK
Run this command from your project root:
```bash
ANDROID_HOME=$HOME/Library/Android/sdk JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./android/gradlew -p android :app:createBundleReleaseJsAndAssets :app:assembleRelease
```

### Step 3: Copy to root (optional)
```bash
cp android/app/build/outputs/apk/release/app-release.apk ./app-release.apk
```

### Why these commands?
- `prebuild --clean`: Regenerates the Android project from scratch based on your Expo config.
- `createBundleReleaseJsAndAssets`: Bundles your JavaScript code and assets into the APK.
- `assembleRelease`: Compiles the native Android code and creates the final APK.

## Finding the APK
Once the build finishes successfully, the APK is located at:
`android/app/build/outputs/apk/release/app-release.apk`

## Credentials & Keystore
- The first time you build, EAS may ask to generate or download credentials.
- **Always reuse existing keystores** if you've already published to the Play Store.
- Never create a new keystore if you have one for an existing published version.

## Troubleshooting
- **Java/Gradle errors**: Ensure Android Studio is installed and JAVA_HOME points to its JBR.
- **SDK not found**: Make sure ANDROID_HOME is set correctly.
- **App crashes on launch**: Check crash logs with:
  ```bash
  adb logcat -d | grep -iE "(Fatal|Exception|workout)"
  ```
