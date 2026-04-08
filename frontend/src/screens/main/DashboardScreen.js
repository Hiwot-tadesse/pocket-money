import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGamification } from '../../context/GamificationContext';
import { useSmartAlerts } from '../../context/SmartAlertsContext';
import { reportAPI, transactionAPI, alertAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';
import GamificationBanner from '../../components/GamificationBanner';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'am', label: 'አማርኛ', flag: 'AM' },
  { code: 'om', label: 'Afaan Oromoo', flag: 'OM' },
];

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { onDailyLogin, onBudgetUnderControl } = useGamification();
  const {
    generateDailyTip, generateVersionAlert, generateExpenseReminder,
    checkBudgetAlerts, checkNoSavingsAlert, checkInactivityAlert, unreadCount: smartUnread,
  } = useSmartAlerts();
  const [langModalVisible, setLangModalVisible] = useState(false);
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
      setUnreadAlerts((alertsRes.unreadCount || 0));

      // Smart alerts
      generateDailyTip();
      generateVersionAlert();
      generateExpenseReminder();
      if (summaryRes.data) checkNoSavingsAlert(summaryRes.data);
      if (transactionsRes.data && transactionsRes.data.length > 0) {
        checkInactivityAlert(transactionsRes.data[0].date);
      }
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
      onDailyLogin();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount) => {
    return `ETB ${(amount || 0).toFixed(2)}`;
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
      {/* Language Selector Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>Select Language</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                onPress={() => { setLanguage(lang.code); setLangModalVisible(false); }}
              >
                <Text style={[styles.langFlag, language === lang.code && styles.langFlagActive]}>{lang.flag}</Text>
                <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>{lang.label}</Text>
                {language === lang.code && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('hello')}, {user?.username || 'User'}!</Text>
          <Text style={styles.headerSubtext}>{t('financialOverview')}</Text>
        </View>
        <TouchableOpacity style={styles.langButton} onPress={() => setLangModalVisible(true)}>
          <Ionicons name="language" size={18} color={COLORS.white} />
          <Text style={styles.langButtonText}>{LANGUAGES.find(l => l.code === language)?.flag}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.alertButton} onPress={() => navigation.navigate('Alerts')}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          {(unreadAlerts + smartUnread) > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{unreadAlerts + smartUnread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Gamification Banner */}
      <GamificationBanner />

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t('currentBalance')}</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(summary?.balance)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceStat}>
            <View style={[styles.statDot, { backgroundColor: COLORS.income }]} />
            <Text style={styles.statLabel}>{t('income')}</Text>
            <Text style={styles.statValue}>{formatCurrency(summary?.totalIncome)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceStat}>
            <View style={[styles.statDot, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.statLabel}>{t('expenses')}</Text>
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
          <Text style={styles.actionText}>{t('addIncome')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.expense }]}
          onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
        >
          <Ionicons name="remove-circle" size={24} color={COLORS.white} />
          <Text style={styles.actionText}>{t('addExpense')}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
          <Text style={styles.statCardValue}>{summary?.transactionCount || 0}</Text>
          <Text style={styles.statCardLabel}>{t('transactions')}</Text>
        </View>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="trending-up" size={24} color={COLORS.income} />
          <Text style={styles.statCardValue}>{formatCurrency(summary?.avgIncome)}</Text>
          <Text style={styles.statCardLabel}>{t('avgIncome')}</Text>
        </View>
        <View style={[styles.statCard, SHADOWS.small]}>
          <Ionicons name="trending-down" size={24} color={COLORS.expense} />
          <Text style={styles.statCardValue}>{formatCurrency(summary?.avgExpense)}</Text>
          <Text style={styles.statCardLabel}>{t('avgExpense')}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentTransactions')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAllText}>{t('seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>{t('noTransactionsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('startTrackingPocket')}</Text>
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
                    {tx.description || t('noDescription')}
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
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 10,
    gap: 4,
  },
  langButtonText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModal: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  langModalTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: SIZES.borderRadius,
    marginBottom: 6,
    gap: 12,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '10',
  },
  langFlag: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    width: 30,
    textAlign: 'center',
  },
  langFlagActive: {
    color: COLORS.primary,
  },
  langLabel: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  langLabelActive: {
    fontWeight: '600',
    color: COLORS.primary,
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
