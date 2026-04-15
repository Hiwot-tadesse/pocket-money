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
        <TouchableOpacity
          style={[styles.chatFab, { bottom: 28 }]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Ionicons name="sparkles" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.scrollView}
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

      {/* Header and Balance Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t('hello')}, {user?.username || 'User'}!</Text>
            <Text style={styles.headerSubtext}>{t('financialOverview')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langButton} onPress={() => setLangModalVisible(true)}>
              <Ionicons name="globe-outline" size={16} color={COLORS.white} />
              <Text style={styles.langButtonText}>{LANGUAGES.find(l => l.code === language)?.flag}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat')}>
              <Ionicons name="sparkles" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertButton} onPress={() => navigation.navigate('Alerts')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              {(unreadAlerts + smartUnread) > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{unreadAlerts + smartUnread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Area */}
        <View style={styles.balanceArea}>
          <Text style={styles.balanceLabel}>{t('currentBalance')}</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(summary?.balance)}</Text>
          
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <View style={styles.statLabelRow}>
                <Ionicons name="arrow-down-circle" size={16} color="#34D399" />
                <Text style={styles.statLabel}>{t('income')}</Text>
              </View>
              <Text style={styles.statValue}>{formatCurrency(summary?.totalIncome)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <View style={styles.statLabelRow}>
                <Ionicons name="arrow-up-circle" size={16} color="#F87171" />
                <Text style={styles.statLabel}>{t('expenses')}</Text>
              </View>
              <Text style={styles.statValue}>{formatCurrency(summary?.totalExpense)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Gamification Banner */}
        <View style={styles.bannerWrapper}>
          <GamificationBanner />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.income }, SHADOWS.medium]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
          >
            <Ionicons name="add-circle" size={22} color={COLORS.white} />
            <Text style={styles.actionText}>{t('addIncome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.expense }, SHADOWS.medium]}
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          >
            <Ionicons name="remove-circle" size={22} color={COLORS.white} />
            <Text style={styles.actionText}>{t('addExpense')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statCardValue}>{summary?.transactionCount || 0}</Text>
            <Text style={styles.statCardLabel}>{t('transactions')}</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.income + '15' }]}>
              <Ionicons name="trending-up" size={20} color={COLORS.income} />
            </View>
            <Text style={styles.statCardValue}>{formatCurrency(summary?.avgIncome)}</Text>
            <Text style={styles.statCardLabel}>{t('avgIncome')}</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIconWrapper, { backgroundColor: COLORS.expense + '15' }]}>
              <Ionicons name="trending-down" size={20} color={COLORS.expense} />
            </View>
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
              <View style={styles.emptyIconBg}>
                <Ionicons name="wallet-outline" size={40} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyText}>{t('noTransactionsYet')}</Text>
              <Text style={styles.emptySubtext}>{t('startTrackingPocket')}</Text>
            </View>
          ) : (
            recentTransactions.map((tx) => {
              const catInfo = CATEGORIES[tx.category] || { icon: 'ellipse', color: COLORS.textLight };
              return (
                <View key={tx._id} style={[styles.transactionItem, SHADOWS.small]}>
                  <View style={[styles.txIcon, { backgroundColor: catInfo.color + '15' }]}>
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
                        { color: tx.type === 'income' ? COLORS.income : COLORS.text },
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

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>

    {/* AI Chat FAB */}
    <TouchableOpacity
      style={styles.chatFab}
      onPress={() => navigation.navigate('Chat')}
      activeOpacity={0.85}
    >
      <Ionicons name="sparkles" size={24} color={COLORS.white} />
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  chatFab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: SIZES.paddingLg,
    ...SHADOWS.large,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerSubtext: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    gap: 6,
  },
  langButtonText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langModal: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    ...SHADOWS.large,
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
    marginBottom: 8,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
    borderWidth: 1,
  },
  langFlag: {
    fontSize: SIZES.base,
    width: 30,
    textAlign: 'center',
  },
  langLabel: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
    fontWeight: '500',
  },
  langLabelActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  alertButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  alertBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  balanceArea: {
    alignItems: 'center',
    marginTop: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: SIZES.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: -1,
  },
  balanceRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: SIZES.borderRadiusLg,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: SIZES.sm,
    fontWeight: '500',
  },
  statValue: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  mainContent: {
    flex: 1,
    marginTop: -20,
  },
  bannerWrapper: {
    marginHorizontal: SIZES.margin,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.margin,
    marginTop: 20,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.borderRadiusLg,
    gap: 8,
  },
  actionText: {
    color: COLORS.white,
    fontSize: SIZES.base,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.margin,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: SIZES.base,
    fontWeight: '800',
    color: COLORS.text,
  },
  statCardLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: SIZES.margin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    ...SHADOWS.small,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    marginBottom: 12,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 16,
  },
  txCategory: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  txDescription: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: SIZES.base,
    fontWeight: '800',
  },
  txDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    fontWeight: '500',
  },
});

export default DashboardScreen;
