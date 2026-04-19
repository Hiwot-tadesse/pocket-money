import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
import { SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const FILTER_OPTIONS_KEYS = [
  { labelKey: 'all', value: null },
  { labelKey: 'income', value: 'income' },
  { labelKey: 'expense', value: 'expense' },
];

const TransactionsScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
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

  useFocusEffect(useCallback(() => {
    setPage(1);
    fetchTransactions(1);
  }, [activeFilter]));

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchTransactions(1); };

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
        text: t('delete'), style: 'destructive',
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
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderTransaction = ({ item }) => {
    const catInfo = CATEGORIES[item.category] || { icon: 'ellipse', color: theme.textLight };
    const isIncome = item.type === 'income';
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: SIZES.borderRadius, padding: 16, marginBottom: 12 }, SHADOWS.small]}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: catInfo.color + '15' }}>
          <Ionicons name={catInfo.icon} size={22} color={catInfo.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ fontSize: SIZES.base, fontWeight: '700', color: theme.text }}>{item.category}</Text>
          <Text style={{ fontSize: SIZES.sm, color: theme.textSecondary, marginTop: 4 }} numberOfLines={1}>
            {item.description || t('noDescription')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: theme.textLight, fontWeight: '500' }}>{formatDate(item.date)}</Text>
            {item.recurringInterval && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.primary + '12', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Ionicons name="repeat" size={10} color={theme.primary} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: theme.primary }}>{item.recurringInterval}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ fontSize: SIZES.base, fontWeight: '800', color: isIncome ? theme.income : theme.expense }}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary + '12', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
            >
              <Ionicons name="pencil-outline" size={14} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.expense + '12', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={14} color={theme.expense} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ backgroundColor: theme.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: SIZES.paddingLg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...SHADOWS.large }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.white, letterSpacing: -0.5 }}>{t('transactions')}</Text>
      </View>

      <View style={{ marginTop: -20, marginBottom: 8, zIndex: 11 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SIZES.margin, paddingVertical: 12, gap: 8 }}>
          {FILTER_OPTIONS_KEYS.map((option) => (
            <TouchableOpacity
              key={option.labelKey}
              style={[{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24, backgroundColor: theme.surface, ...SHADOWS.small },
                activeFilter === option.value && { backgroundColor: theme.primary }]}
              onPress={() => { setActiveFilter(option.value); setPage(1); setLoading(true); fetchTransactions(1, option.value); }}
            >
              <Text style={[{ fontSize: SIZES.md, color: theme.textSecondary, fontWeight: '600' },
                activeFilter === option.value && { color: theme.white, fontWeight: '700' }]}>
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: SIZES.margin, paddingBottom: 40, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...SHADOWS.small }}>
                <Ionicons name="receipt-outline" size={48} color={theme.primaryLight} />
              </View>
              <Text style={{ fontSize: SIZES.base, fontWeight: '700', color: theme.textSecondary }}>{t('noTransactionsFound')}</Text>
            </View>
          }
          ListFooterComponent={hasMore && transactions.length > 0 ? <ActivityIndicator style={{ padding: 16 }} color={theme.primary} /> : null}
        />
      )}
    </View>
  );
};

export default TransactionsScreen;
