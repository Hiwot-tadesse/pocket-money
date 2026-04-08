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
import { transactionAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';

const FILTER_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

const TransactionsScreen = ({ navigation }) => {
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
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionAPI.delete(id);
            setTransactions((prev) => prev.filter((t) => t._id !== id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;

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
    return (
      <TouchableOpacity
        style={[styles.transactionCard, SHADOWS.small]}
        onLongPress={() => handleDelete(item._id)}
        activeOpacity={0.7}
      >
        <View style={[styles.txIcon, { backgroundColor: catInfo.color + '20' }]}>
          <Ionicons name={catInfo.icon} size={22} color={catInfo.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCategory}>{item.category}</Text>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
          <Text style={styles.txDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txAmount,
              { color: item.type === 'income' ? COLORS.income : COLORS.expense },
            ]}
          >
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagRow}>
              {item.tags.slice(0, 2).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
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
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
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
              <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && transactions.length > 0 ? (
              <ActivityIndicator style={{ padding: 16 }} color={COLORS.primary} />
            ) : null
          }
        />
      )}

      {/* Floating hint */}
      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.hintText}>Long press to delete a transaction</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.margin,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.margin,
    paddingBottom: 40,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  txDate: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  tag: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    marginTop: 12,
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

export default TransactionsScreen;
