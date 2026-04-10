import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { transactionAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

const FILTER_OPTIONS_KEYS = [
  { labelKey: 'all', value: null },
  { labelKey: 'income', value: 'income' },
  { labelKey: 'expense', value: 'expense' },
];

const TransactionsScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (pageNum = 1, filter = activeFilter, append = false) => {
    try {
      const params = { page: pageNum, limit: 20, sort: '-date' };
      if (filter) params.type = filter;

      const response = await transactionAPI.getAll(params);

      if (append) {
        setTransactions((prev) => [...prev, ...response.data]);
      } else {
        setTransactions(response.data);
      }
      setHasMore(pageNum < response.pagination.pages);
    } catch (error) {
      console.error('Fetch transactions error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchTransactions(1);
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTransactions(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, activeFilter, true);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(t('deleteTransaction'), t('deleteTransactionConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionAPI.delete(id);
            setTransactions((prev) => prev.filter((tx) => tx._id !== id));
          } catch (error) {
            Alert.alert(t('error'), error.message);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) => `ETB ${(amount || 0).toFixed(2)}`;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }) => {
    const catInfo = CATEGORIES[item.category] || { icon: 'ellipse', color: COLORS.textLight };
    const isIncome = item.type === 'income';
    return (
      <View style={[styles.transactionCard, SHADOWS.small]}>
        <View style={[styles.txIcon, { backgroundColor: catInfo.color + '15' }]}>
          <Ionicons name={catInfo.icon} size={22} color={catInfo.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCategory}>{item.category}</Text>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description || t('noDescription')}
          </Text>
          <View style={styles.txMeta}>
            <Text style={styles.txDate}>{formatDate(item.date)}</Text>
            {item.recurringInterval && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={10} color={COLORS.primary} />
                <Text style={styles.recurringText}>{item.recurringInterval}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isIncome ? COLORS.income : COLORS.expense }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <View style={styles.txActionRow}>
            <TouchableOpacity
              style={styles.txActionBtn}
              onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
            >
              <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.txActionBtn, styles.txDeleteBtn]}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.expense} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('transactions')}</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_OPTIONS_KEYS.map((option) => (
            <TouchableOpacity
              key={option.labelKey}
              style={[
                styles.filterTab,
                activeFilter === option.value && styles.filterTabActive,
              ]}
              onPress={() => {
                setActiveFilter(option.value);
                setPage(1);
                setLoading(true);
                fetchTransactions(1, option.value);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === option.value && styles.filterTextActive,
                ]}
              >
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyText}>{t('noTransactionsFound')}</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && transactions.length > 0 ? (
              <ActivityIndicator style={{ padding: 16 }} color={COLORS.primary} />
            ) : null
          }
        />
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 24,
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
  filterContainer: {
    marginTop: -20,
    marginBottom: 8,
    zIndex: 11,
  },
  filterRow: {
    paddingHorizontal: SIZES.margin,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.margin,
    paddingBottom: 40,
    paddingTop: 8,
  },
  transactionCard: {
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
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  txDate: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  recurringBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primary + '12', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  recurringText: { fontSize: 9, fontWeight: '700', color: COLORS.primary },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmount: { fontSize: SIZES.base, fontWeight: '800' },
  txActionRow: { flexDirection: 'row', gap: 6 },
  txActionBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  txDeleteBtn: { backgroundColor: COLORS.expense + '12' },
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
    color: COLORS.textSecondary,
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

export default TransactionsScreen;
