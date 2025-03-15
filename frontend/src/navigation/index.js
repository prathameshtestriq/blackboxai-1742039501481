import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import MatchDetailsScreen from '../screens/matches/MatchDetailsScreen';
import PlayerListScreen from '../screens/players/PlayerListScreen';
import PlayerDetailsScreen from '../screens/players/PlayerDetailsScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Profile Related Screens
import PortfolioScreen from '../screens/profile/PortfolioScreen';
import TransactionHistoryScreen from '../screens/profile/TransactionHistoryScreen';
import BankAccountsScreen from '../screens/profile/BankAccountsScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import SecuritySettingsScreen from '../screens/profile/SecuritySettingsScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import AboutScreen from '../screens/profile/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MatchesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MatchesList"
      component={MatchesScreen}
      options={{ headerTitle: 'Matches' }}
    />
    <Stack.Screen
      name="MatchDetails"
      component={MatchDetailsScreen}
      options={{ headerTitle: 'Match Details' }}
    />
  </Stack.Navigator>
);

const PlayersStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="PlayersList"
      component={PlayerListScreen}
      options={{ headerTitle: 'Players' }}
    />
    <Stack.Screen
      name="PlayerDetails"
      component={PlayerDetailsScreen}
      options={{ headerTitle: 'Player Details' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerTitle: 'Profile' }}
    />
    <Stack.Screen
      name="Portfolio"
      component={PortfolioScreen}
      options={{ headerTitle: 'Portfolio' }}
    />
    <Stack.Screen
      name="TransactionHistory"
      component={TransactionHistoryScreen}
      options={{ headerTitle: 'Transaction History' }}
    />
    <Stack.Screen
      name="BankAccounts"
      component={BankAccountsScreen}
      options={{ headerTitle: 'Bank Accounts' }}
    />
    <Stack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
      options={{ headerTitle: 'Notifications' }}
    />
    <Stack.Screen
      name="SecuritySettings"
      component={SecuritySettingsScreen}
      options={{ headerTitle: 'Security' }}
    />
    <Stack.Screen
      name="Support"
      component={SupportScreen}
      options={{ headerTitle: 'Help & Support' }}
    />
    <Stack.Screen
      name="About"
      component={AboutScreen}
      options={{ headerTitle: 'About' }}
    />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Matches':
              iconName = focused ? 'cricket' : 'cricket';
              break;
            case 'Players':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'Wallet':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.backdrop,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerTitle: 'Wallet' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: true, headerTitle: 'Forgot Password' }}
            />
          </>
        ) : (
          // Main App Stack
          <Stack.Screen name="MainApp" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
