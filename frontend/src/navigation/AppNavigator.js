import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
import GoalsScreen from '../screens/main/GoalsScreen';
import AddGoalScreen from '../screens/main/AddGoalScreen';

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
      <Tab.Screen name="Dashboard" component={HomeStackNavigator} options={{ tabBarLabel: t('tabDashboard') }} />
      <Tab.Screen name="Transactions" component={TransactionStackNavigator} options={{ tabBarLabel: t('tabTransactions') }} />
      <Tab.Screen name="Budgets" component={BudgetStackNavigator} options={{ tabBarLabel: t('tabBudgets') }} />
      <Tab.Screen name="Goals" component={GoalStackNavigator} options={{ tabBarLabel: 'Goals' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('tabSettings') }} />
    </Tab.Navigator>
  );
};

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
