import React, { useState } from 'react';
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
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert(t('error'), t('selectCategory'));
      return;
    }
    if (!limit || parseFloat(limit) <= 0) {
      Alert.alert(t('error'), t('enterValidBudgetLimit'));
      return;
    }

    setLoading(true);
    try {
      await budgetAPI.create({
        category,
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
            {BUDGET_CATEGORIES.map((cat) => {
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
    paddingBottom: 16,
    paddingHorizontal: SIZES.paddingLg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'center',
  },
  inputGroup: {
    paddingHorizontal: SIZES.margin,
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipText: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.margin,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  submitText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
});

export default AddBudgetScreen;
