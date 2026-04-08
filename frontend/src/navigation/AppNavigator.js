import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import AddTransactionScreen from '../screens/main/AddTransactionScreen';
import BudgetsScreen from '../screens/main/BudgetsScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import AddBudgetScreen from '../screens/main/AddBudgetScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="DashboardHome" component={DashboardScreen} />
    <HomeStack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <HomeStack.Screen name="Alerts" component={AlertsScreen} />
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

const MainTabs = () => (
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
          case 'Reports':
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'ellipse';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.border,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={HomeStackNavigator} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} />
    <Tab.Screen name="Budgets" component={BudgetStackNavigator} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
