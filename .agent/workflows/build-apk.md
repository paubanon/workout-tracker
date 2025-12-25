---
description: Build a local Android APK release
---

// turbo
1. Run the local Android APK production build:
   `ANDROID_HOME=$HOME/Library/Android/sdk JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./android/gradlew -p android :app:createBundleReleaseJsAndAssets :app:assembleRelease`

2. If prompted to generate or use existing credentials, follow the on-screen instructions (usually choosing the default 'yes' to reuse existing keystores).

3. Once complete, the APK will be located at:
   `android/app/build/outputs/apk/release/app-release.apk`

4. Copy the file to the root for convenience:
   `cp android/app/build/outputs/apk/release/app-release.apk ./app-release.apk`
