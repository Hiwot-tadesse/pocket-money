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

const BudgetsScreen = ({ navigation }) => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBudgets = async () => {
    try {
      const response = await budgetAPI.getAll({ active: 'true' });
      setBudgets(response.data);
      setSummary(response.summary);
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
    Alert.alert('Delete Budget', `Delete the budget for ${category}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await budgetAPI.delete(id);
            setBudgets((prev) => prev.filter((b) => b._id !== id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;

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
              <Text style={styles.budgetPeriod}>{item.period} budget</Text>
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
          <Text style={[styles.percentText, { color: progressColor }]}>{percentage}% used</Text>
          <Text style={styles.remainingText}>
            {item.remaining > 0 ? `${formatCurrency(item.remaining)} left` : 'Over budget!'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddBudget')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {summary && (
        <View style={[styles.summaryCard, SHADOWS.medium]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.totalBudget)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
                {formatCurrency(summary.totalSpent)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: COLORS.income }]}>
                {formatCurrency(summary.totalRemaining)}
              </Text>
            </View>
          </View>
        </View>
      )}

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
              <Ionicons name="pie-chart-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No budgets set</Text>
              <Text style={styles.emptySubtext}>Tap + to create your first budget</Text>
            </View>
          }
        />
      )}

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.hintText}>Long press to delete a budget</Text>
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
    paddingBottom: 16,
    paddingHorizontal: SIZES.paddingLg,
  },
  headerTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.margin,
    marginTop: 16,
    borderRadius: SIZES.borderRadius,
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
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.margin,
    paddingTop: 12,
    paddingBottom: 24,
  },
  budgetCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategory: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  budgetPeriod: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  budgetSpent: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  budgetLimit: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
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
    marginTop: 8,
  },
  percentText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    backgroundColor: COLORS.background,
  },
  hintText: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
});

export default BudgetsScreen;
