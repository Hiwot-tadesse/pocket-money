import React, { useState, useMemo, useEffect } from 'react';
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
import { useTheme } from '../../context/ThemeContext';

const CATEGORY_KEYWORDS = {
  'Food & Drinks': ['food','burger','pizza','coffee','tea','lunch','dinner','breakfast','snack','restaurant','cafe','drink','juice','water','bread','rice','pasta','soda','milk','egg','meat','chicken','fish','vegetable','fruit','grocery','market','shiro','injera','tibs','kitfo','firfir','wot','enjera'],
  Transport: ['taxi','uber','bus','train','metro','fuel','gas','petrol','fare','trip','ride','transport','car','vehicle','minibus','bajaj','ferry','flight','ticket','highway','toll'],
  Entertainment: ['movie','cinema','game','concert','show','netflix','spotify','music','fun','play','event','ticket','theater','party','festival'],
  Shopping: ['shop','mall','clothes','shirt','shoes','bag','dress','fashion','buy','purchase','store','supermarket','market','gift','jewelry','cosmetic'],
  Education: ['school','college','university','tuition','book','course','class','training','study','exam','fee','library','pen','notebook'],
  Health: ['hospital','clinic','medicine','doctor','pharmacy','drug','health','medical','dental','eye','prescription','therapy','gym','fitness'],
  'Bills & Utilities': ['bill','electric','water','internet','phone','rent','utility','subscription','wifi','cable','gas','insurance','maintenance','service'],
  Gifts: ['gift','present','donate','donation','charity','wedding','birthday','anniversary'],
  Savings: ['save','saving','deposit','investment','piggy','bank','wallet'],
};

const EXPENSE_CATEGORIES = [
  'Food & Drinks', 'Transport', 'Entertainment', 'Shopping',
  'Education', 'Health', 'Bills & Utilities', 'Gifts',
  'Savings', 'Other Expense',
];

const INCOME_SOURCES = [
  'Salary', 'Allowance', 'Family Support', 'NGO/Grant',
  'Bank Loan', 'Part-time Job', 'Freelance', 'Other Income',
];

const FREQUENCY_OPTIONS = [
  { label: 'Monthly', value: 'monthly', icon: 'calendar' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' },
  { label: 'Daily', value: 'daily', icon: 'sunny-outline' },
  { label: 'Yearly', value: 'yearly', icon: 'globe-outline' },
  { label: 'One-time', value: 'one-time', icon: 'radio-button-on' },
  { label: 'Custom', value: 'custom', icon: 'create-outline' },
];

const AddTransactionScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { onTransactionAdded } = useGamification();
  const { getCategories, addCustomCategory } = useCustomCategories();
  const { theme } = useTheme();
  const existing = route.params?.transaction;
  const isEdit = !!existing;
  const initialType = existing?.type || route.params?.type || 'expense';
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState(existing?.amount?.toString() || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [tags, setTags] = useState(existing?.tags?.join(', ') || '');
  const [frequency, setFrequency] = useState(existing?.recurringInterval || 'monthly');
  const [customFrequency, setCustomFrequency] = useState(existing?.recurringCustomLabel || '');
  const [loading, setLoading] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-detect category from description keywords
  useEffect(() => {
    if (type !== 'expense' || !description.trim() || isEdit) return;
    const lower = description.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        setCategory(cat);
        setAutoDetected(true);
        return;
      }
    }
    setAutoDetected(false);
  }, [description, type]);

  const isOtherSelected = category === 'Other Expense' || category === 'Other Income';

  const categories = useMemo(() => {
    if (type === 'income') {
      const custom = getCategories('income');
      return [...INCOME_SOURCES.filter(c => c !== 'Other Income'), ...custom, 'Other Income'];
    }
    const custom = getCategories('expense');
    return [...EXPENSE_CATEGORIES.filter(c => c !== 'Other Expense'), ...custom, 'Other Expense'];
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
        tags: type === 'expense'
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (type === 'income') {
        data.isRecurring = frequency !== 'one-time';
        data.recurringInterval = frequency;
        if (frequency === 'custom') {
          data.recurringCustomLabel = customFrequency.trim();
        }
      }

      if (isEdit) {
        await transactionAPI.update(existing._id, data);
      } else {
        await transactionAPI.create(data);
        onTransactionAdded(type, parseFloat(amount));
      }
      Alert.alert(t('success'), isEdit ? 'Transaction updated!' : t('transactionAdded'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

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
          <Text style={styles.headerTitle}>{isEdit ? t('editTransaction') : t('addTransaction')}</Text>
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
          <Text style={styles.formCardTitle}>{type === 'income' ? 'Income Details' : t('details')}</Text>

          <Text style={styles.fieldLabel}>
            {type === 'income' ? 'Where did you get this money?' : t('description')}
            {type === 'income' && <Text style={styles.optionalTag}> (Optional)</Text>}
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={type === 'income' ? 'e.g. Monthly salary from ABC Company' : t('whatWasThisFor')}
              placeholderTextColor={COLORS.placeholder}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />
          </View>

          {type === 'expense' && (
            <>
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
            </>
          )}
        </View>

        {/* Frequency Picker — income only */}
        {type === 'income' && (
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>How Often Do You Get This?</Text>
            <View style={styles.frequencyGrid}>
              {FREQUENCY_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.freqChip, frequency === f.value && styles.freqChipActive]}
                  onPress={() => setFrequency(f.value)}
                >
                  <Ionicons
                    name={f.icon}
                    size={16}
                    color={frequency === f.value ? COLORS.white : COLORS.income}
                  />
                  <Text style={[styles.freqChipText, frequency === f.value && styles.freqChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {frequency === 'custom' && (
              <View style={[styles.inputContainer, { marginTop: 14, borderWidth: 1.5, borderColor: COLORS.income, borderStyle: 'dashed' }]}>
                <Ionicons name="create-outline" size={20} color={COLORS.income} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Describe your schedule (e.g. Every 2 weeks)"
                  placeholderTextColor={COLORS.placeholder}
                  value={customFrequency}
                  onChangeText={setCustomFrequency}
                  autoFocus
                  maxLength={60}
                />
              </View>
            )}
          </View>
        )}

        {/* Category / Source Selection */}
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.formCardTitle}>{type === 'income' ? 'Income Source' : t('category')}</Text>
            {autoDetected && type === 'expense' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '18', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, gap: 4 }}>
                <Ionicons name="flash" size={12} color={COLORS.primary} />
                <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '700' }}>Auto-detected</Text>
              </View>
            )}
          </View>
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
                {isEdit ? 'Update Transaction' : (type === 'income' ? t('addIncome') : t('addExpense'))}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 32,
    paddingHorizontal: SIZES.paddingLg, borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32, ...SHADOWS.large, zIndex: 10,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  typeToggle: {
    flexDirection: 'row', marginHorizontal: SIZES.margin, marginTop: -20,
    backgroundColor: theme.surface, borderRadius: 24, padding: 6, ...SHADOWS.small, zIndex: 11,
  },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 20, gap: 8 },
  typeBtnActiveIncome: { backgroundColor: COLORS.income },
  typeBtnActiveExpense: { backgroundColor: COLORS.expense },
  typeText: { fontSize: SIZES.md, fontWeight: '700', color: theme.textSecondary },
  typeTextActive: { color: '#FFFFFF' },
  amountCard: { backgroundColor: theme.surface, marginHorizontal: SIZES.margin, marginTop: 20, marginBottom: 8, borderRadius: SIZES.borderRadiusLg, padding: 24, alignItems: 'center', ...SHADOWS.medium },
  amountCardLabel: { fontSize: SIZES.sm, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountUnderline: { width: '60%', height: 3, borderRadius: 2, marginTop: 12, opacity: 0.6 },
  formCard: { backgroundColor: theme.surface, marginHorizontal: SIZES.margin, marginTop: 16, borderRadius: SIZES.borderRadiusLg, padding: 20, ...SHADOWS.small },
  formCardTitle: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12, gap: 6 },
  selectedBadgeText: { fontSize: SIZES.sm, fontWeight: '700' },
  currencySymbol: { fontSize: 28, fontWeight: '800', color: theme.textSecondary, marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: '800', minWidth: 140, textAlign: 'center', letterSpacing: -1 },
  inputGroup: { paddingHorizontal: SIZES.margin, marginBottom: 24 },
  label: { fontSize: SIZES.sm, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background,
    borderRadius: SIZES.borderRadiusLg, paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: theme.border,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: SIZES.base, fontWeight: '600', color: theme.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  freqChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: theme.surface, borderWidth: 1.5, borderColor: COLORS.income + '60', gap: 6 },
  freqChipActive: { backgroundColor: COLORS.income, borderColor: COLORS.income },
  freqChipText: { fontSize: SIZES.sm, color: COLORS.income, fontWeight: '700' },
  freqChipTextActive: { color: '#FFFFFF' },
  optionalTag: { fontWeight: '400', color: theme.textLight, fontStyle: 'italic' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border, gap: 8 },
  categoryChipText: { fontSize: SIZES.sm, color: theme.text, fontWeight: '700' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SIZES.margin, marginTop: 16, paddingVertical: 18, borderRadius: SIZES.borderRadiusLg, gap: 8, ...SHADOWS.medium },
  submitText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
  customCatContainer: { marginTop: 16 },
  customCatInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: SIZES.borderRadiusLg, paddingHorizontal: 16, height: 56, borderWidth: 2, borderColor: '#6366F1', borderStyle: 'dashed' },
  customCatHint: { fontSize: SIZES.xs, color: theme.textLight, marginTop: 8, marginLeft: 4, fontWeight: '500' },
});

export default AddTransactionScreen;
