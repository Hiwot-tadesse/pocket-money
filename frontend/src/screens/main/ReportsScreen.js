import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { reportAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS, CATEGORIES } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';

const TAB_KEYS = [
  { labelKey: 'daily', value: 'daily' },
  { labelKey: 'weekly', value: 'weekly' },
  { labelKey: 'monthly', value: 'monthly' },
];

const fmt = (n) => `ETB ${(n || 0).toFixed(2)}`;

const ReportsScreen = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState('monthly');
  const [summary, setSummary] = useState(null);
  const [periodData, setPeriodData] = useState([]);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (p = tab) => {
    try {
      const [s, c] = await Promise.all([
        reportAPI.getSummary(),
        reportAPI.getByCategory({ type: 'expense' }),
      ]);
      setSummary(s.data);
      setCatData(c.data);
      let r;
      if (p === 'daily') r = await reportAPI.getDaily({ days: 14 });
      else if (p === 'weekly') r = await reportAPI.getWeekly({ weeks: 8 });
      else r = await reportAPI.getMonthly({ months: 6 });
      setPeriodData(r.data);
    } catch (e) {
      console.error('Reports error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [tab]));

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const maxVal = Math.max(...periodData.map((d) => Math.max(d.income || 0, d.expense || 0)), 1);

  return (
    <ScrollView style={s.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[COLORS.primary]} />
    }>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('reports')}</Text>
      </View>

      {/* Summary */}
      <View style={s.sumRow}>
        <View style={[s.sumCard, SHADOWS.small]}>
          <Ionicons name="trending-up" size={22} color={COLORS.income} />
          <Text style={s.sumLabel}>{t('income')}</Text>
          <Text style={[s.sumVal, { color: COLORS.income }]}>{fmt(summary?.totalIncome)}</Text>
        </View>
        <View style={[s.sumCard, SHADOWS.small]}>
          <Ionicons name="trending-down" size={22} color={COLORS.expense} />
          <Text style={s.sumLabel}>{t('expenses')}</Text>
          <Text style={[s.sumVal, { color: COLORS.expense }]}>{fmt(summary?.totalExpense)}</Text>
        </View>
      </View>

      <View style={[s.balCard, SHADOWS.small]}>
        <Text style={s.balLabel}>{t('netBalance')}</Text>
        <Text style={[s.balVal, { color: (summary?.balance || 0) >= 0 ? COLORS.income : COLORS.expense }]}>
          {fmt(summary?.balance)}
        </Text>
      </View>

      {/* Period Tabs */}
      <View style={s.tabs}>
        {TAB_KEYS.map((item) => (
          <TouchableOpacity key={item.value} style={[s.tab, tab === item.value && s.tabActive]}
            onPress={() => { setTab(item.value); setLoading(true); }}>
            <Text style={[s.tabText, tab === item.value && s.tabTextActive]}>{t(item.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={[s.card, SHADOWS.small]}>
        <Text style={s.cardTitle}>{t('incomeVsExpenses')}</Text>
        {periodData.length === 0 ? <Text style={s.noData}>{t('noDataPeriod')}</Text> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.barChart}>
              {periodData.slice(-10).map((item, i) => {
                const lbl = (item.date || item.week || item.month || '').slice(-5);
                const ih = Math.max(4, ((item.income || 0) / maxVal) * 100);
                const eh = Math.max(4, ((item.expense || 0) / maxVal) * 100);
                return (
                  <View key={i} style={s.barGroup}>
                    <View style={s.barPair}>
                      <View style={[s.bar, { height: ih, backgroundColor: COLORS.income }]} />
                      <View style={[s.bar, { height: eh, backgroundColor: COLORS.expense }]} />
                    </View>
                    <Text style={s.barLabel}>{lbl}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.income }]} /><Text style={s.legendText}>{t('income')}</Text></View>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.expense }]} /><Text style={s.legendText}>{t('expense')}</Text></View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={[s.card, SHADOWS.small]}>
        <Text style={s.cardTitle}>{t('spendingByCategory')}</Text>
        {catData.length === 0 ? <Text style={s.noData}>{t('noExpenseData')}</Text> : (
          catData.map((c, i) => {
            const ci = CATEGORIES[c.category] || { icon: 'ellipse', color: COLORS.textLight };
            return (
              <View key={i} style={s.catRow}>
                <View style={[s.catIcon, { backgroundColor: ci.color + '20' }]}>
                  <Ionicons name={ci.icon} size={18} color={ci.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.catNameRow}>
                    <Text style={s.catName}>{c.category}</Text>
                    <Text style={s.catAmt}>{fmt(c.total)}</Text>
                  </View>
                  <View style={s.catBarBg}>
                    <View style={[s.catBarFill, { width: `${c.percentage}%`, backgroundColor: ci.color }]} />
                  </View>
                  <View style={s.catMeta}>
                    <Text style={s.catPct}>{c.percentage}%</Text>
                    <Text style={s.catCount}>{c.count} {t('txns')}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Period Table */}
      <View style={[s.card, SHADOWS.small, { marginBottom: 30 }]}>
        <Text style={s.cardTitle}>{t(tab)} {t('breakdown')}</Text>
        {periodData.length === 0 ? <Text style={s.noData}>{t('noData')}</Text> : (
          <>
            <View style={s.tblHeader}>
              <Text style={[s.tblH, { flex: 1.5 }]}>{t('period')}</Text>
              <Text style={[s.tblH, { flex: 1, textAlign: 'right' }]}>{t('income')}</Text>
              <Text style={[s.tblH, { flex: 1, textAlign: 'right' }]}>{t('expense')}</Text>
              <Text style={[s.tblH, { flex: 1, textAlign: 'right' }]}>{t('net')}</Text>
            </View>
            {periodData.slice(-10).reverse().map((item, i) => {
              const lbl = item.date || item.week || item.month || '';
              return (
                <View key={i} style={[s.tblRow, i % 2 === 0 && { backgroundColor: COLORS.background }]}>
                  <Text style={[s.tblCell, { flex: 1.5 }]}>{lbl}</Text>
                  <Text style={[s.tblCell, { flex: 1, textAlign: 'right', color: COLORS.income }]}>{fmt(item.income)}</Text>
                  <Text style={[s.tblCell, { flex: 1, textAlign: 'right', color: COLORS.expense }]}>{fmt(item.expense)}</Text>
                  <Text style={[s.tblCell, { flex: 1, textAlign: 'right', color: (item.net || 0) >= 0 ? COLORS.income : COLORS.expense }]}>{fmt(item.net)}</Text>
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: SIZES.paddingLg },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.white },
  sumRow: { flexDirection: 'row', paddingHorizontal: SIZES.margin, marginTop: 16, gap: 10 },
  sumCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.borderRadius, padding: 14, alignItems: 'center' },
  sumLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 6 },
  sumVal: { fontSize: SIZES.lg, fontWeight: 'bold', marginTop: 2 },
  balCard: { backgroundColor: COLORS.white, marginHorizontal: SIZES.margin, marginTop: 10, borderRadius: SIZES.borderRadius, padding: 16, alignItems: 'center' },
  balLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  balVal: { fontSize: SIZES.xxl, fontWeight: 'bold', marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: SIZES.margin, marginTop: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  card: { backgroundColor: COLORS.white, marginHorizontal: SIZES.margin, marginTop: 16, borderRadius: SIZES.borderRadius, padding: SIZES.padding },
  cardTitle: { fontSize: SIZES.base, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  noData: { fontSize: SIZES.sm, color: COLORS.textLight, textAlign: 'center', paddingVertical: 20 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 12, paddingHorizontal: 4 },
  barGroup: { alignItems: 'center', width: 36 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 14, borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, color: COLORS.textLight, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  catIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catNameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.text },
  catAmt: { fontSize: SIZES.sm, fontWeight: 'bold', color: COLORS.text },
  catBarBg: { height: 6, backgroundColor: COLORS.divider, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  catPct: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  catCount: { fontSize: 10, color: COLORS.textLight },
  tblHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: COLORS.border },
  tblH: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  tblRow: { flexDirection: 'row', paddingVertical: 10, borderRadius: 4 },
  tblCell: { fontSize: SIZES.xs, color: COLORS.text },
});

export default ReportsScreen;
