import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import AddTransactionScreen from '../screens/main/AddTransactionScreen';
import BudgetsScreen from '../screens/main/BudgetsScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import AddBudgetScreen from '../screens/main/AddBudgetScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import AddGoalScreen from '../screens/main/AddGoalScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ForecastDetailsScreen from '../screens/main/ForecastDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Deep link configuration for password reset (and future links)
const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: ['pocketmoney://', 'exp://', Linking.createURL('/')],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // Add other deep-linkable screens here if needed
    },
  },
};

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="DashboardHome" component={DashboardScreen} />
    <HomeStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <HomeStack.Screen name="Alerts" component={AlertsScreen} />
    <HomeStack.Screen name="Chat" component={ChatScreen} />
    <HomeStack.Screen name="Reports" component={ReportsScreen} />
    <HomeStack.Screen name="ForecastDetails" component={ForecastDetailsScreen} />
  </HomeStack.Navigator>
);

const BudgetStackNavigator = () => {
  const BudgetStack = createNativeStackNavigator();
  return (
    <BudgetStack.Navigator screenOptions={{ headerShown: false }}>
      <BudgetStack.Screen name="BudgetsList" component={BudgetsScreen} />
      <BudgetStack.Screen name="AddBudget" component={AddBudgetScreen} />
    </BudgetStack.Navigator>
  );
};

const TransactionStackNavigator = () => {
  const TxStack = createNativeStackNavigator();
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TxStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    </TxStack.Navigator>
  );
};

const GoalStackNavigator = () => {
  const GoalStack = createNativeStackNavigator();
  return (
    <GoalStack.Navigator screenOptions={{ headerShown: false }}>
      <GoalStack.Screen name="GoalsList" component={GoalsScreen} />
      <GoalStack.Screen name="AddGoal" component={AddGoalScreen} />
    </GoalStack.Navigator>
  );
};

const MainTabs = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  // Normal solid-docked tab bar height (60px height + safe area bottom inset)
  const TAB_BAR_HEIGHT = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Budgets':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Goals':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textLight,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: bottomInset > 0 ? bottomInset - 4 : 8,
          paddingTop: 8,
          height: TAB_BAR_HEIGHT,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeStackNavigator} options={{ tabBarLabel: t('tabDashboard') }} />
      <Tab.Screen name="Transactions" component={TransactionStackNavigator} options={{ tabBarLabel: t('tabTransactions') }} />
      <Tab.Screen name="Budgets" component={BudgetStackNavigator} options={{ tabBarLabel: t('tabBudgets') }} />
      <Tab.Screen name="Goals" component={GoalStackNavigator} options={{ tabBarLabel: t('goals') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('tabSettings') }} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading, logout } = useAuth();

  // Handle deep links (e.g. password reset from email)
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event?.url;
      if (!url) return;

      // pocketmoney://reset-password?token=XXXX
      if (url.includes('reset-password')) {
        const parsed = Linking.parse(url);
        const token = parsed?.queryParams?.token;

        if (token) {
          // Security: if user is logged in, log them out before showing reset screen
          if (isAuthenticated) {
            await logout();
          }

          // Navigate to ResetPassword with the secure token
          // We use a small timeout to ensure navigation is ready after possible logout
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('ResetPassword', { token });
            }
          }, 50);
        }
      }
    };

    // Listen for links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle link that opened the app from cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated, logout]);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
