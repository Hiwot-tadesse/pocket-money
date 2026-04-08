import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FINANCIAL_TIPS, SMART_ALERT_TYPES, APP_VERSION_INFO, getDailyTipIndex } from '../constants/smartAlerts';

const SmartAlertsContext = createContext();

const STORAGE_KEY = 'smart_alerts_data';

const DEFAULT_DATA = {
  // Expense reminder settings
  expenseReminder: {
    enabled: false,
    title: '',
  },
  // Local alerts generated
  localAlerts: [],
  // Track what was shown today
  lastTipDate: null,
  lastVersionShown: null,
  lastBudgetCheckDate: null,
  // Dismissed alert IDs
  dismissedIds: [],
  // Read alert IDs
  readIds: [],
};

export const SmartAlertsProvider = ({ children }) => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) saveData();
  }, [data, loaded]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData({ ...DEFAULT_DATA, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load smart alerts:', e);
    } finally {
      setLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save smart alerts:', e);
    }
  };

  // ---- Expense Reminder ----
  const setExpenseReminder = useCallback((enabled, title) => {
    setData((prev) => ({
      ...prev,
      expenseReminder: { enabled, title: title || '' },
    }));
  }, []);

  // ---- Generate daily tip ----
  const generateDailyTip = useCallback((lang = 'en') => {
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      if (prev.lastTipDate === today) return prev;
      const tipIndex = getDailyTipIndex();
      const tip = FINANCIAL_TIPS[tipIndex];
      const newAlert = {
        id: `tip_${today}`,
        type: SMART_ALERT_TYPES.DAILY_TIP,
        title: { en: 'Daily Financial Tip', am: 'ዕለታዊ የገንዘብ ምክር', om: 'Gorsa Maallaqaa Guyyaa' },
        message: tip,
        date: new Date().toISOString(),
        isRead: false,
      };
      return {
        ...prev,
        lastTipDate: today,
        localAlerts: [newAlert, ...prev.localAlerts.filter((a) => a.id !== newAlert.id)].slice(0, 50),
      };
    });
  }, []);

  // ---- Generate version alert ----
  const generateVersionAlert = useCallback(() => {
    setData((prev) => {
      if (prev.lastVersionShown === APP_VERSION_INFO.version) return prev;
      const newAlert = {
        id: `version_${APP_VERSION_INFO.version}`,
        type: SMART_ALERT_TYPES.VERSION_UPDATE,
        title: { en: `New Version ${APP_VERSION_INFO.version}`, am: `አዲስ ስሪት ${APP_VERSION_INFO.version}`, om: `Gosa Haaraa ${APP_VERSION_INFO.version}` },
        message: {
          en: APP_VERSION_INFO.features.en.join('\n• '),
          am: APP_VERSION_INFO.features.am.join('\n• '),
          om: APP_VERSION_INFO.features.om.join('\n• '),
        },
        date: new Date().toISOString(),
        isRead: false,
      };
      return {
        ...prev,
        lastVersionShown: APP_VERSION_INFO.version,
        localAlerts: [newAlert, ...prev.localAlerts.filter((a) => a.id !== newAlert.id)].slice(0, 50),
      };
    });
  }, []);

  // ---- Generate expense reminder alert ----
  const generateExpenseReminder = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      if (!prev.expenseReminder.enabled) return prev;
      const reminderId = `expense_reminder_${today}`;
      if (prev.localAlerts.some((a) => a.id === reminderId)) return prev;
      const customTitle = prev.expenseReminder.title || '';
      const newAlert = {
        id: reminderId,
        type: SMART_ALERT_TYPES.EXPENSE_REMINDER,
        title: {
          en: customTitle || 'Add Your Expenses',
          am: customTitle || 'ወጪዎን ያስገቡ',
          om: customTitle || 'Baasii Kee Galchi',
        },
        message: {
          en: 'Don\'t forget to log your expenses today! Tracking daily keeps you on budget.',
          am: 'ዛሬ ወጪዎን ማስገባት አይርሱ! ዕለታዊ ክትትል ከበጀት እንዳይወጡ ይረዳዎታል።',
          om: 'Har\'a baasii kee galchuu hin dagatin! Guyyaa guyyaan hordofuun bajata keessa akka turtu si gargaara.',
        },
        date: new Date().toISOString(),
        isRead: false,
      };
      return {
        ...prev,
        localAlerts: [newAlert, ...prev.localAlerts.filter((a) => a.id !== reminderId)].slice(0, 50),
      };
    });
  }, []);

  // ---- Budget warning alerts ----
  const checkBudgetAlerts = useCallback((budgets) => {
    if (!budgets || budgets.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      if (prev.lastBudgetCheckDate === today) return prev;
      const newAlerts = [];

      budgets.forEach((b) => {
        const pct = b.percentageUsed || 0;
        if (pct >= 100) {
          newAlerts.push({
            id: `budget_exceeded_${b.category}_${today}`,
            type: SMART_ALERT_TYPES.BUDGET_EXCEEDED,
            title: {
              en: `Budget Exceeded: ${b.category}`,
              am: `ከበጀት በላይ: ${b.category}`,
              om: `Bajata Ol: ${b.category}`,
            },
            message: {
              en: `You've spent ${pct.toFixed(0)}% of your ${b.category} budget. Consider cutting back on spending.`,
              am: `የ${b.category} በጀትዎን ${pct.toFixed(0)}% አውጥተዋል። ወጪን ለመቀነስ ያስቡ።`,
              om: `Bajata ${b.category} kee ${pct.toFixed(0)}% baasiteetta. Baasii hir\'isuu yaadi.`,
            },
            date: new Date().toISOString(),
            isRead: false,
          });
        } else if (pct >= 80) {
          newAlerts.push({
            id: `budget_warning_${b.category}_${today}`,
            type: SMART_ALERT_TYPES.BUDGET_WARNING,
            title: {
              en: `Budget Warning: ${b.category}`,
              am: `የበጀት ማስጠንቀቂያ: ${b.category}`,
              om: `Akeekkachiisa Bajataa: ${b.category}`,
            },
            message: {
              en: `You've used ${pct.toFixed(0)}% of your ${b.category} budget. Be careful with spending!`,
              am: `የ${b.category} በጀትዎን ${pct.toFixed(0)}% ተጠቅመዋል። ወጪን ይጠንቀቁ!`,
              om: `Bajata ${b.category} kee ${pct.toFixed(0)}% fayyadamteetta. Baasii of eeggadhu!`,
            },
            date: new Date().toISOString(),
            isRead: false,
          });
        }
      });

      if (newAlerts.length === 0) return { ...prev, lastBudgetCheckDate: today };

      const existingIds = new Set(prev.localAlerts.map((a) => a.id));
      const filtered = newAlerts.filter((a) => !existingIds.has(a.id));

      return {
        ...prev,
        lastBudgetCheckDate: today,
        localAlerts: [...filtered, ...prev.localAlerts].slice(0, 50),
      };
    });
  }, []);

  // ---- No savings alert ----
  const checkNoSavingsAlert = useCallback((summary) => {
    if (!summary) return;
    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      const alertId = `no_savings_${today}`;
      if (prev.localAlerts.some((a) => a.id === alertId)) return prev;

      if (summary.totalIncome > 0 && summary.balance <= 0) {
        const newAlert = {
          id: alertId,
          type: SMART_ALERT_TYPES.NO_SAVINGS,
          title: {
            en: 'No Savings Alert',
            am: 'ቁጠባ የለም ማስጠንቀቂያ',
            om: 'Akeekkachiisa Qusannaa Dhabuu',
          },
          message: {
            en: 'Your expenses have exceeded your income. Try to cut back on non-essential spending and build your savings.',
            am: 'ወጪዎ ከገቢዎ በልጧል። አስፈላጊ ያልሆኑ ወጪዎችን ለመቀነስ ይሞክሩ እና ቁጠባዎን ይገንቡ።',
            om: 'Baasiin kee galii kee caaleera. Baasii hin barbaachisne hir\'isuu yaali fi qusannaa kee ijaari.',
          },
          date: new Date().toISOString(),
          isRead: false,
        };
        return {
          ...prev,
          localAlerts: [newAlert, ...prev.localAlerts].slice(0, 50),
        };
      }
      return prev;
    });
  }, []);

  // ---- Inactivity alert ----
  const checkInactivityAlert = useCallback((lastTransactionDate) => {
    if (!lastTransactionDate) return;
    const daysSince = Math.floor((Date.now() - new Date(lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 3) return;

    const today = new Date().toISOString().split('T')[0];
    setData((prev) => {
      const alertId = `inactivity_${today}`;
      if (prev.localAlerts.some((a) => a.id === alertId)) return prev;
      const newAlert = {
        id: alertId,
        type: SMART_ALERT_TYPES.INACTIVITY,
        title: {
          en: 'We Miss You!',
          am: 'ናፍቀንዎታል!',
          om: 'Si yaadanna!',
        },
        message: {
          en: `You haven't logged any transactions in ${daysSince} days. Keep tracking to stay on top of your finances!`,
          am: `ለ${daysSince} ቀናት ምንም ግብይት አላስገቡም። ገንዘብዎን ለመቆጣጠር መከታተልዎን ይቀጥሉ!`,
          om: `Guyyaa ${daysSince}f sochii hin galchine. Maallaqaa kee too\'achuuf hordofuu itti fufi!`,
        },
        date: new Date().toISOString(),
        isRead: false,
      };
      return {
        ...prev,
        localAlerts: [newAlert, ...prev.localAlerts].slice(0, 50),
      };
    });
  }, []);

  // ---- Mark alert as read ----
  const markAlertRead = useCallback((alertId) => {
    setData((prev) => ({
      ...prev,
      localAlerts: prev.localAlerts.map((a) => a.id === alertId ? { ...a, isRead: true } : a),
      readIds: [...new Set([...prev.readIds, alertId])],
    }));
  }, []);

  // ---- Mark all as read ----
  const markAllAlertsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      localAlerts: prev.localAlerts.map((a) => ({ ...a, isRead: true })),
      readIds: [...new Set([...prev.readIds, ...prev.localAlerts.map((a) => a.id)])],
    }));
  }, []);

  // ---- Delete alert ----
  const deleteAlert = useCallback((alertId) => {
    setData((prev) => ({
      ...prev,
      localAlerts: prev.localAlerts.filter((a) => a.id !== alertId),
      dismissedIds: [...new Set([...prev.dismissedIds, alertId])],
    }));
  }, []);

  const unreadCount = data.localAlerts.filter((a) => !a.isRead).length;

  return (
    <SmartAlertsContext.Provider
      value={{
        localAlerts: data.localAlerts,
        expenseReminder: data.expenseReminder,
        unreadCount,
        setExpenseReminder,
        generateDailyTip,
        generateVersionAlert,
        generateExpenseReminder,
        checkBudgetAlerts,
        checkNoSavingsAlert,
        checkInactivityAlert,
        markAlertRead,
        markAllAlertsRead,
        deleteAlert,
      }}
    >
      {children}
    </SmartAlertsContext.Provider>
  );
};

export const useSmartAlerts = () => {
  const context = useContext(SmartAlertsContext);
  if (!context) {
    throw new Error('useSmartAlerts must be used within SmartAlertsProvider');
  }
  return context;
};
