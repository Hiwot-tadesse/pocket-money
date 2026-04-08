import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { reportAPI, transactionAPI, alertAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, transactionsRes, alertsRes] = await Promise.all([
        reportAPI.getSummary(),
        transactionAPI.getAll({ limit: 5, sort: '-date' }),
        alertAPI.getAll({ unreadOnly: 'true', limit: 1 }),
      ]);
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data);
      setUnreadAlerts(alertsRes.unreadCount || 0);
    } catch (error) {
      console.error('Dashboard fetch error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.username || 'User'}!</Text>
          <Text style={styles.headerSubtext}>Here's your financial overview</Text>
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={() => navigation.navigate('Alerts')}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          {unreadAlerts > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{unreadAlerts}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(summary?.balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <View style={[styles.statDot, { backgroundColor: COLORS.income }]} />
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatCurrency(summary?.totalIncome)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <View style={[styles.statDot, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>{formatCurrency(summary?.totalExpense)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.income }]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
        >
          <Ionicons name="add-circle" size={24} color={COLORS.white} />
          <Text style={styles.actionText}>Add Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.expense }]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
        >
          <Ionicons name="remove-circle" size={24} color={COLORS.white} />
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statCardValue}>{summary?.transactionCount || 0}</Text>
          <Text style={styles.statCardLabel}>Transactions</Text>
        </View>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="trending-up" size={24} color={COLORS.income} />
          <Text style={styles.statCardValue}>{formatCurrency(summary?.avgIncome)}</Text>
          <Text style={styles.statCardLabel}>Avg Income</Text>
        </View>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="trending-down" size={24} color={COLORS.expense} />
          <Text style={styles.statCardValue}>{formatCurrency(summary?.avgExpense)}</Text>
          <Text style={styles.statCardLabel}>Avg Expense</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your pocket money!</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const catInfo = CATEGORIES[tx.category] || { icon: 'ellipse', color: COLORS.textLight };
            return (
              <View key={tx._id} style={[styles.transactionItem, SHADOWS.small]}>
                <View style={[styles.txIcon, { backgroundColor: catInfo.color + '20' }]}>
                  <Ionicons name={catInfo.icon} size={20} color={catInfo.color} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txCategory}>{tx.category}</Text>
                  <Text style={styles.txDescription} numberOfLines={1}>
                    {tx.description || 'No description'}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === 'income' ? COLORS.income : COLORS.expense },
                    ]}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: SIZES.paddingLg,
  },
  greeting: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtext: {
    fontSize: SIZES.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  alertButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: COLORS.primaryDark,
    marginHorizontal: SIZES.margin,
    marginTop: -1,
    borderRadius: SIZES.borderRadiusLg,
    padding: SIZES.paddingLg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: SIZES.md,
    marginBottom: 4,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  balanceStat: {
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: SIZES.xs,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.margin,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: SIZES.borderRadius,
    gap: 8,
  },
  actionText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.margin,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
  },
  statCardLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: SIZES.margin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txCategory: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  txDescription: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
  txDate: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default DashboardScreen;
