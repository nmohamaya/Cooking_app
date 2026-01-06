require('dotenv/config');

module.exports = {
  expo: {
    name: 'MyRecipeApp',
    slug: 'MyRecipeApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.cookingapp.myrecipeapp",
      versionCode: 1,
      minSdkVersion: 23,
      targetSdkVersion: 34,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      githubToken: process.env.GITHUB_TOKEN,
      eas: {
        projectId: "41ca11bf-7f02-4bd4-94c7-1ea1405446be"
      }
    },
  },
};
