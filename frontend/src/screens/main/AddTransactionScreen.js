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
import { transactionAPI } from '../../services/api';
import { COLORS, SIZES, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

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
  const initialType = route.params?.type || 'expense';
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!category) {
      Alert.alert(t('error'), t('selectCategory'));
      return;
    }

    setLoading(true);
    try {
      const data = {
        type,
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await transactionAPI.create(data);
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
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>ETB</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.placeholder}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('description')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('whatWasThisFor')}
              placeholderTextColor={COLORS.placeholder}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('category')}</Text>
          <View style={styles.categoryGrid}>
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
        </View>

        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('tagsCommaSeparated')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="pricetag-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('tagsPlaceholder')}
              placeholderTextColor={COLORS.placeholder}
              value={tags}
              onChangeText={setTags}
            />
          </View>
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
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: SIZES.margin,
    marginTop: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: SIZES.borderRadiusSm,
    gap: 6,
  },
  typeBtnActiveIncome: {
    backgroundColor: COLORS.income,
  },
  typeBtnActiveExpense: {
    backgroundColor: COLORS.expense,
  },
  typeText: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.white,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    paddingHorizontal: SIZES.margin,
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
    marginBottom: 16,
  },
  label: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
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
    gap: 8,
  },
  submitText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
});

export default AddTransactionScreen;
