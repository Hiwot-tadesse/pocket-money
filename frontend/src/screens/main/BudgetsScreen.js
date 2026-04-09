import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { budgetAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useSmartAlerts } from '../../context/SmartAlertsContext';

const BudgetsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { onBudgetUnderControl } = useGamification();
  const { checkBudgetAlerts } = useSmartAlerts();
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = async () => {
    try {
      const response = await budgetAPI.getAll({ active: 'true' });
      setBudgets(response.data);
      setSummary(response.summary);
      // Check if all budgets are under control for gamification
      if (response.data.length > 0 && response.data.every((b) => (b.percentageUsed || 0) < 100)) {
        onBudgetUnderControl();
      }
      // Smart budget alerts
      checkBudgetAlerts(response.data);
    } catch (error) {
      console.error('Fetch budgets error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
  };

  const handleDelete = (id, category) => {
    Alert.alert(t('deleteBudget'), `${t('deleteBudgetConfirm')} ${category}?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await budgetAPI.delete(id);
            setBudgets((prev) => prev.filter((b) => b._id !== id));
          } catch (error) {
            Alert.alert(t('error'), error.message);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) => `ETB ${(amount || 0).toFixed(2)}`;

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return COLORS.danger;
    if (percentage >= 80) return COLORS.warning;
    return COLORS.success;
  };

  const renderBudget = ({ item }) => {
    const catInfo = CATEGORIES[item.category] || { icon: 'ellipse', color: COLORS.textLight };
    const percentage = item.percentageUsed || 0;
    const progressColor = getProgressColor(percentage);
    const progressWidth = Math.min(percentage, 100);

    return (
      <TouchableOpacity
        style={[styles.budgetCard, SHADOWS.small]}
        onLongPress={() => handleDelete(item._id, item.category)}
        activeOpacity={0.7}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetCatRow}>
            <View style={[styles.catIcon, { backgroundColor: catInfo.color + '20' }]}>
              <Ionicons name={catInfo.icon} size={20} color={catInfo.color} />
            </View>
            <View>
              <Text style={styles.budgetCategory}>{item.category}</Text>
              <Text style={styles.budgetPeriod}>{item.period} {t('budget')}</Text>
            </View>
          </View>
          <View style={styles.budgetAmounts}>
            <Text style={styles.budgetSpent}>{formatCurrency(item.spent)}</Text>
            <Text style={styles.budgetLimit}>/ {formatCurrency(item.limit)}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progressWidth}%`, backgroundColor: progressColor }]}
          />
        </View>

        <View style={styles.budgetFooter}>
          <Text style={[styles.percentText, { color: progressColor }]}>{percentage}% {t('used')}</Text>
          <Text style={styles.remainingText}>
            {item.remaining > 0 ? `${formatCurrency(item.remaining)} ${t('left')}` : t('overBudget')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('budgets')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddBudget')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryWrapper}>
        {summary && (
          <View style={[styles.summaryCard, SHADOWS.medium]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('totalBudget')}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(summary.totalBudget)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('totalSpent')}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t('remaining')}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.income }]}>
                  {formatCurrency(summary.totalRemaining)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Budgets List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudget}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="pie-chart-outline" size={48} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyText}>{t('noBudgetsSet')}</Text>
              <Text style={styles.emptySubtext}>{t('tapToCreateBudget')}</Text>
            </View>
          }
        />
      )}

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.hintText}>{t('longPressDeleteBudget')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.large,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryWrapper: {
    marginTop: -28,
    marginHorizontal: SIZES.margin,
    zIndex: 11,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    padding: SIZES.padding,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.divider,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.margin,
    paddingTop: 16,
    paddingBottom: 24,
  },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategory: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  budgetPeriod: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
    fontWeight: '500',
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  budgetSpent: {
    fontSize: SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  budgetLimit: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  percentText: {
    fontSize: SIZES.xs,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: COLORS.background,
  },
  hintText: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    fontWeight: '500',
  },
});

export default BudgetsScreen;
