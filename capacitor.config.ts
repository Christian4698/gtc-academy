import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.generaltech.gtcacademy',
  appName: 'GTC Academy',
  webDir: 'out',
  backgroundColor: '#030C1E',
  loggingBehavior: 'debug',
  server: {
    androidScheme: 'https',
  },
  android: {
    path: 'capacitor/android',
    backgroundColor: '#030C1E',
    zoomEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1400,
      launchAutoHide: true,
      backgroundColor: '#030C1E',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#030C1E',
      overlaysWebView: false,
    },
  },
};

export default config;
