import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Store
import store, { persistor } from './src/store';

// Theme
import theme from './src/theme';

// Navigation
import Navigation from './src/navigation';

// Initialize services
import { checkAuthStatus } from './src/store/slices/authSlice';

const App = () => {
  useEffect(() => {
    // Check authentication status on app launch
    store.dispatch(checkAuthStatus());
  }, []);

  return (
    <StoreProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar
              backgroundColor={theme.colors.primary}
              barStyle="light-content"
            />
            <Navigation />
          </SafeAreaProvider>
        </PaperProvider>
      </PersistGate>
    </StoreProvider>
  );
};

export default App;
