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
import { transactionAPI } from '../../services/api';
import { COLORS, SIZES, CATEGORIES, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useCustomCategories } from '../../context/CustomCategoriesContext';

const EXPENSE_CATEGORIES = [
  'Food & Drinks', 'Transport', 'Entertainment', 'Shopping',
  'Education', 'Health', 'Bills & Utilities', 'Gifts',
  'Savings', 'Other Expense',
];

const INCOME_CATEGORIES = [
  'Allowance', 'Part-time Job', 'Freelance', 'Gifts',
  'Savings', 'Other Income',
];

const AddTransactionScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { onTransactionAdded } = useGamification();
  const { getCategories, addCustomCategory } = useCustomCategories();
  const initialType = route.params?.type || 'expense';
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const isOtherSelected = category === 'Other Expense' || category === 'Other Income';

  const categories = useMemo(() => {
    const base = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const custom = getCategories(type);
    const otherKey = type === 'income' ? 'Other Income' : 'Other Expense';
    const withoutOther = base.filter((c) => c !== otherKey);
    return [...withoutOther, ...custom, otherKey];
  }, [type, getCategories]);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
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
      addCustomCategory(type, finalCategory);
    }

    setLoading(true);
    try {
      const data = {
        type,
        amount: parseFloat(amount),
        category: finalCategory,
        description: description.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await transactionAPI.create(data);
      onTransactionAdded(type, parseFloat(amount));
      Alert.alert(t('success'), t('transactionAdded'), [
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
          <Text style={styles.headerTitle}>{t('addTransaction')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
            onPress={() => { setType('income'); setCategory(''); }}
          >
            <Ionicons name="trending-up" size={18} color={type === 'income' ? COLORS.white : COLORS.income} />
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>{t('income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
            onPress={() => { setType('expense'); setCategory(''); }}
          >
            <Ionicons name="trending-down" size={18} color={type === 'expense' ? COLORS.white : COLORS.expense} />
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>{t('expense')}</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>{t('amount')}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>ETB</Text>
            <TextInput
              style={[styles.amountInput, { color: type === 'income' ? COLORS.income : COLORS.expense }]}
              placeholder="0.00"
              placeholderTextColor={COLORS.placeholder}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <View style={[styles.amountUnderline, { backgroundColor: type === 'income' ? COLORS.income : COLORS.expense }]} />
        </View>

        {/* Details Card */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t('details')}</Text>

          <Text style={styles.fieldLabel}>{t('description')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('whatWasThisFor')}
              placeholderTextColor={COLORS.placeholder}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('tagsCommaSeparated')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('tagsPlaceholder')}
              placeholderTextColor={COLORS.placeholder}
              value={tags}
              onChangeText={setTags}
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t('category')}</Text>
          {category !== '' && (
            <View style={[styles.selectedBadge, { backgroundColor: (CATEGORIES[category]?.color || COLORS.primary) + '15' }]}>
              <Ionicons name={CATEGORIES[category]?.icon || 'ellipse'} size={14} color={CATEGORIES[category]?.color || COLORS.primary} />
              <Text style={[styles.selectedBadgeText, { color: CATEGORIES[category]?.color || COLORS.primary }]}>{category}</Text>
            </View>
          )}
          <View style={[styles.categoryGrid, { marginTop: 12 }]}>
            {categories.map((cat) => {
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
                    style={[
                      styles.categoryChipText,
                      isSelected && { color: COLORS.white },
                    ]}
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
            <View style={styles.customCatContainer}>
              <View style={styles.customCatInput}>
                <Ionicons name="add-circle-outline" size={20} color="#6366F1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('customCategoryPlaceholder')}
                  placeholderTextColor={COLORS.placeholder}
                  value={customCategoryName}
                  onChangeText={setCustomCategoryName}
                  autoFocus
                  maxLength={30}
                />
              </View>
              <Text style={styles.customCatHint}>{t('customCategoryHint')}</Text>
            </View>
          )}

        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: type === 'income' ? COLORS.income : COLORS.expense },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.submitText}>
                {type === 'income' ? t('addIncome') : t('addExpense')}
              </Text>
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
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: SIZES.margin,
    marginTop: -20,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 6,
    ...SHADOWS.small,
    zIndex: 11,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
  },
  typeBtnActiveIncome: {
    backgroundColor: COLORS.income,
  },
  typeBtnActiveExpense: {
    backgroundColor: COLORS.expense,
  },
  typeText: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.white,
  },
  amountCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: SIZES.borderRadiusLg,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  amountCardLabel: {
    fontSize: SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountUnderline: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    opacity: 0.6,
  },
  formCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    marginTop: 16,
    borderRadius: SIZES.borderRadiusLg,
    padding: 20,
    ...SHADOWS.small,
  },
  formCardTitle: {
    fontSize: SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  selectedBadgeText: {
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '800',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 16,
    height: 56,
    ...SHADOWS.small,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.text,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.margin,
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: SIZES.borderRadiusLg,
    gap: 8,
    ...SHADOWS.medium,
  },
  submitText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '800',
  },
  customCatContainer: {
    marginTop: 16,
  },
  customCatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  customCatHint: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AddTransactionScreen;
