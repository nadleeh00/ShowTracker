const IS_DEV = process.env.EAS_BUILD_PROFILE === 'development';

export default {
  expo: {
    name: IS_DEV ? "Show-Tracker-Dev" : "Show Tracker",
    slug: IS_DEV ? "ShowTrackerDev" : "showtracker",
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "showtracker",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      buildNumber: "2",
      bundleIdentifier: IS_DEV ? "com.anonymous.ShowTracker.dev" : "com.anonymous.ShowTracker"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
    //   package: IS_DEV ? "com.anonymous.ShowTracker.dev" : "com.anonymous.ShowTracker",
    //   versionCode: 2
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: IS_DEV ? "def3891f-ba7f-492e-bdb9-194a1ddfcfb8" :"bcbc2397-ad20-4e3e-9f3f-9bb52b02e15e" 
      }
    }
  }
};
