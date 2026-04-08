import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomCategoriesContext = createContext();

const STORAGE_KEY = 'custom_categories';

const DEFAULT_DATA = {
  expense: [],
  income: [],
};

export const CustomCategoriesProvider = ({ children }) => {
  const [customCategories, setCustomCategories] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (loaded) saveData();
  }, [customCategories, loaded]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomCategories({ ...DEFAULT_DATA, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load custom categories:', e);
    } finally {
      setLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
    } catch (e) {
      console.error('Failed to save custom categories:', e);
    }
  };

  const addCustomCategory = useCallback((type, name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setCustomCategories((prev) => {
      const list = prev[type] || [];
      if (list.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return { ...prev, [type]: [...list, trimmed] };
    });
    return true;
  }, []);

  const removeCustomCategory = useCallback((type, name) => {
    setCustomCategories((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((c) => c !== name),
    }));
  }, []);

  const getCategories = useCallback((type) => {
    return customCategories[type] || [];
  }, [customCategories]);

  return (
    <CustomCategoriesContext.Provider
      value={{
        customCategories,
        addCustomCategory,
        removeCustomCategory,
        getCategories,
      }}
    >
      {children}
    </CustomCategoriesContext.Provider>
  );
};

export const useCustomCategories = () => {
  const context = useContext(CustomCategoriesContext);
  if (!context) {
    throw new Error('useCustomCategories must be used within CustomCategoriesProvider');
  }
  return context;
};
