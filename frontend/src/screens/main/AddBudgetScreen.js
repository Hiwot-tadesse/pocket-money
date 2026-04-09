import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { budgetAPI } from '../../services/api';
import { COLORS, SIZES, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useCustomCategories } from '../../context/CustomCategoriesContext';

const BUDGET_CATEGORIES = [
  'Food & Drinks', 'Transport', 'Entertainment', 'Shopping',
  'Education', 'Health', 'Bills & Utilities', 'Gifts',
  'Savings', 'Other Expense',
];

const PERIOD_KEYS = [
  { labelKey: 'daily', value: 'daily' },
  { labelKey: 'weekly', value: 'weekly' },
  { labelKey: 'monthly', value: 'monthly' },
];

const AddBudgetScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { onBudgetCreated } = useGamification();
  const { getCategories, addCustomCategory } = useCustomCategories();
  const [category, setCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const isOtherSelected = category === 'Other Expense';

  const allBudgetCategories = useMemo(() => {
    const custom = getCategories('expense');
    const withoutOther = BUDGET_CATEGORIES.filter((c) => c !== 'Other Expense');
    return [...withoutOther, ...custom, 'Other Expense'];
  }, [getCategories]);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert(t('error'), t('selectCategory'));
      return;
    }
    let finalCategory = category;
    if (isOtherSelected) {
      if (!customCategoryName.trim()) {
        Alert.alert(t('error'), t('enterCustomCategory'));
        return;
      }
      finalCategory = customCategoryName.trim();
      addCustomCategory('expense', finalCategory);
    }
    if (!limit || parseFloat(limit) <= 0) {
      Alert.alert(t('error'), t('enterValidBudgetLimit'));
      return;
    }

    setLoading(true);
    try {
      await budgetAPI.create({
        category: finalCategory,
        limit: parseFloat(limit),
        period,
      });
      onBudgetCreated();
      Alert.alert(t('success'), t('budgetCreated'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('newBudget')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Budget Limit */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>{t('setBudgetLimit')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>ETB</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.placeholder}
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Period Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('budgetPeriod')}</Text>
          <View style={styles.periodRow}>
            {PERIOD_KEYS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
                onPress={() => setPeriod(p.value)}
              >
                <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                  {t(p.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.categoryGrid}>
            {allBudgetCategories.map((cat) => {
              const catInfo = CATEGORIES[cat] || { icon: 'ellipse', color: COLORS.textLight };
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: catInfo.color, borderColor: catInfo.color },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Ionicons
                    name={catInfo.icon}
                    size={16}
                    color={isSelected ? COLORS.white : catInfo.color}
                  />
                  <Text
                    style={[styles.categoryChipText, isSelected && { color: COLORS.white }]}
                    numberOfLines={1}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom category input when "Other" is selected */}
          {isOtherSelected && (
            <View style={{ marginTop: 12 }}>
              <View style={[styles.inputContainer, { borderWidth: 1.5, borderColor: '#6366F1', borderStyle: 'dashed' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#6366F1" style={{ marginRight: 12 }} />
                <TextInput
                  style={{ flex: 1, fontSize: SIZES.base, color: COLORS.text }}
                  placeholder={t('customCategoryPlaceholder')}
                  placeholderTextColor={COLORS.placeholder}
                  value={customCategoryName}
                  onChangeText={setCustomCategoryName}
                  autoFocus
                  maxLength={30}
                />
              </View>
              <Text style={{ fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 6, marginLeft: 4 }}>
                {t('customCategoryHint')}
              </Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.submitText}>{t('createBudget')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.large,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    paddingHorizontal: SIZES.margin,
  },
  amountLabel: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 140,
    textAlign: 'center',
    letterSpacing: -1,
  },
  inputGroup: {
    paddingHorizontal: SIZES.margin,
    marginBottom: 24,
  },
  label: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 6,
    ...SHADOWS.small,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    gap: 8,
  },
  categoryChipText: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.small,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.margin,
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: SIZES.borderRadiusLg,
    backgroundColor: COLORS.primary,
    gap: 8,
    ...SHADOWS.medium,
  },
  submitText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '800',
  },
});

export default AddBudgetScreen;
