import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { POINTS, ACHIEVEMENTS, getLevelForPoints, getNextLevel } from '../constants/gamification';

const GamificationContext = createContext();

const STORAGE_KEY = 'gamification_data';

const DEFAULT_DATA = {
  totalPoints: 0,
  streak: 0,
  lastActiveDate: null,
  totalTransactions: 0,
  totalIncome: 0,
  totalBudgets: 0,
  budgetUnderControl: false,
  unlockedAchievements: [],
  pointsHistory: [],
  newAchievement: null,
  lastPointsEarned: null,
};

export const GamificationProvider = ({ children }) => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) {
      saveData();
    }
  }, [data, loaded]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData({ ...DEFAULT_DATA, ...parsed, newAchievement: null, lastPointsEarned: null });
      }
    } catch (e) {
      console.error('Failed to load gamification data:', e);
    } finally {
      setLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      const toSave = { ...data, newAchievement: null, lastPointsEarned: null };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save gamification data:', e);
    }
  };

  const addPoints = useCallback((amount, reason) => {
    setData((prev) => ({
      ...prev,
      totalPoints: prev.totalPoints + amount,
      lastPointsEarned: { amount, reason },
      pointsHistory: [
        ...prev.pointsHistory.slice(-49),
        { amount, reason, date: new Date().toISOString() },
      ],
    }));
  }, []);

  const unlockAchievement = useCallback((achievementId) => {
    setData((prev) => {
      if (prev.unlockedAchievements.includes(achievementId)) return prev;
      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      return {
        ...prev,
        unlockedAchievements: [...prev.unlockedAchievements, achievementId],
        newAchievement: achievement || null,
      };
    });
  }, []);

  const clearNewAchievement = useCallback(() => {
    setData((prev) => ({ ...prev, newAchievement: null }));
  }, []);

  const clearLastPoints = useCallback(() => {
    setData((prev) => ({ ...prev, lastPointsEarned: null }));
  }, []);

  const checkAndUpdateStreak = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      if (prev.lastActiveDate === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (prev.lastActiveDate === yesterdayStr) {
        newStreak = prev.streak + 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastActiveDate: today,
      };
    });
  }, []);

  const checkAchievements = useCallback((updatedData) => {
    const d = updatedData || data;
    const unlocked = d.unlockedAchievements || [];

    if (d.totalTransactions >= 1 && !unlocked.includes('first_transaction')) {
      unlockAchievement('first_transaction');
      addPoints(POINTS.FIRST_TRANSACTION, 'first_transaction');
    }
    if (d.totalTransactions >= 10 && !unlocked.includes('ten_transactions')) {
      unlockAchievement('ten_transactions');
      addPoints(POINTS.REACH_10_TRANSACTIONS, 'reach_10_transactions');
    }
    if (d.totalTransactions >= 50 && !unlocked.includes('fifty_transactions')) {
      unlockAchievement('fifty_transactions');
      addPoints(POINTS.REACH_50_TRANSACTIONS, 'reach_50_transactions');
    }
    if (d.totalBudgets >= 1 && !unlocked.includes('first_budget')) {
      unlockAchievement('first_budget');
      addPoints(POINTS.FIRST_BUDGET, 'first_budget');
    }
    if (d.streak >= 3 && !unlocked.includes('streak_3')) {
      unlockAchievement('streak_3');
    }
    if (d.streak >= 7 && !unlocked.includes('streak_7')) {
      unlockAchievement('streak_7');
      addPoints(POINTS.STREAK_BONUS_7, 'streak_7');
    }
    if (d.streak >= 30 && !unlocked.includes('streak_30')) {
      unlockAchievement('streak_30');
      addPoints(POINTS.STREAK_BONUS_30, 'streak_30');
    }
    if (d.budgetUnderControl && !unlocked.includes('budget_hero')) {
      unlockAchievement('budget_hero');
      addPoints(POINTS.BUDGET_UNDER_CONTROL, 'budget_under_control');
    }
    if (d.totalIncome >= 100 && !unlocked.includes('saver_100')) {
      unlockAchievement('saver_100');
    }
  }, [data, unlockAchievement, addPoints]);

  const onTransactionAdded = useCallback((type, amount) => {
    checkAndUpdateStreak();
    setData((prev) => {
      const updated = {
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        totalPoints: prev.totalPoints + (type === 'income' ? POINTS.ADD_INCOME : POINTS.ADD_EXPENSE),
        totalIncome: type === 'income' ? prev.totalIncome + amount : prev.totalIncome,
        lastPointsEarned: {
          amount: type === 'income' ? POINTS.ADD_INCOME : POINTS.ADD_EXPENSE,
          reason: type === 'income' ? 'add_income' : 'add_expense',
        },
      };
      setTimeout(() => checkAchievements(updated), 100);
      return updated;
    });
  }, [checkAndUpdateStreak, checkAchievements]);

  const onBudgetCreated = useCallback(() => {
    setData((prev) => {
      const updated = {
        ...prev,
        totalBudgets: prev.totalBudgets + 1,
      };
      setTimeout(() => checkAchievements(updated), 100);
      return updated;
    });
  }, [checkAchievements]);

  const onBudgetUnderControl = useCallback(() => {
    setData((prev) => {
      if (prev.budgetUnderControl) return prev;
      const updated = { ...prev, budgetUnderControl: true };
      setTimeout(() => checkAchievements(updated), 100);
      return updated;
    });
  }, [checkAchievements]);

  const onDailyLogin = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      if (prev.lastActiveDate === today) return prev;
      checkAndUpdateStreak();
      return {
        ...prev,
        totalPoints: prev.totalPoints + POINTS.DAILY_LOGIN,
        lastPointsEarned: { amount: POINTS.DAILY_LOGIN, reason: 'daily_login' },
      };
    });
  }, [checkAndUpdateStreak]);

  const currentLevel = getLevelForPoints(data.totalPoints);
  const nextLevel = getNextLevel(data.totalPoints);

  return (
    <GamificationContext.Provider
      value={{
        ...data,
        currentLevel,
        nextLevel,
        onTransactionAdded,
        onBudgetCreated,
        onBudgetUnderControl,
        onDailyLogin,
        clearNewAchievement,
        clearLastPoints,
        addPoints,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
