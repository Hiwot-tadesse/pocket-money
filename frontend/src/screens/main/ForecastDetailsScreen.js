import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const fmt = (n) => `ETB ${(n || 0).toFixed(2)}`;

const trendText = (category, index) => {
  if (index === 0) return `${category} may be higher next month too, so it is a good idea to plan this spending first.`;
  if (index === 1) return `${category} is also expected to be one of your bigger expenses next month.`;
  return `${category} may continue taking part of your budget next month.`;
};

const ForecastDetailsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const data = route.params?.prediction;
  const styles = getStyles(theme);

  if (!data?.hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forecast Details</Text>
        </View>
        <View style={styles.emptyCard}>
          <Ionicons name="hourglass-outline" size={42} color={theme.textLight} />
          <Text style={styles.emptyText}>Add more transactions so the app can explain your next month forecast.</Text>
        </View>
      </View>
    );
  }

  const savingsPositive = data.predicted?.savings >= 0;
  const topCategory = data.topCategories?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Next Month Forecast</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="analytics" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>What this forecast means</Text>
          <Text style={styles.heroText}>
            The app looked at your last {data.monthsAnalyzed} months of transactions and estimated what may happen next month.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-up" size={22} color={COLORS.income} />
            <Text style={styles.summaryLabel}>Predicted Income</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>{fmt(data.predicted?.income)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-down" size={22} color="#F87171" />
            <Text style={styles.summaryLabel}>Predicted Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#F87171' }]}>{fmt(data.predicted?.expense)}</Text>
          </View>
          <View style={styles.summaryCardWide}>
            <Ionicons name={savingsPositive ? 'wallet' : 'warning'} size={22} color={savingsPositive ? COLORS.income : '#F87171'} />
            <Text style={styles.summaryLabel}>Predicted Savings</Text>
            <Text style={[styles.summaryValue, { color: savingsPositive ? COLORS.income : '#F87171' }]}>{fmt(data.predicted?.savings)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Simple explanation</Text>
          <Text style={styles.paragraph}>
            {savingsPositive
              ? `You may still save around ${fmt(data.predicted?.savings)} next month if your income and expenses continue like the last few months.`
              : `Your expenses may be higher than your income next month, so try to reduce your biggest spending categories early.`}
          </Text>
          {topCategory && (
            <Text style={styles.paragraph}>
              {trendText(topCategory.category, 0)} It is predicted to be about {fmt(topCategory.amount)}.
            </Text>
          )}
        </View>

        {data.topCategories?.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top predicted expenses</Text>
            {data.topCategories.map((item, index) => (
              <View key={item.category} style={styles.categoryRow}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{item.category}</Text>
                    <Text style={styles.categoryAmount}>{fmt(item.amount)}</Text>
                  </View>
                  <Text style={styles.categoryDescription}>{trendText(item.category, index)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={22} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Demo tip</Text>
            <Text style={styles.tipText}>For your presentation, explain that the numbers are calculated from real transaction history, while this page converts the math into easy language.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 22, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, ...SHADOWS.medium },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 36 },
  heroCard: { backgroundColor: theme.surface, borderRadius: 22, padding: 20, alignItems: 'center', marginBottom: 16, ...SHADOWS.medium },
  heroIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  heroText: { fontSize: SIZES.md, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, minWidth: '47%', backgroundColor: theme.surface, borderRadius: 18, padding: 16, ...SHADOWS.small },
  summaryCardWide: { width: '100%', backgroundColor: theme.surface, borderRadius: 18, padding: 16, ...SHADOWS.small },
  summaryLabel: { fontSize: SIZES.sm, color: theme.textSecondary, fontWeight: '700', marginTop: 8 },
  summaryValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  sectionCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 18, marginBottom: 16, ...SHADOWS.small },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 12 },
  paragraph: { fontSize: SIZES.md, color: theme.textSecondary, lineHeight: 23, marginBottom: 10 },
  categoryRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  rankCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: COLORS.primary, fontWeight: '900' },
  categoryInfo: { flex: 1 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  categoryName: { fontSize: SIZES.md, color: theme.text, fontWeight: '800', flex: 1 },
  categoryAmount: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: '800' },
  categoryDescription: { fontSize: SIZES.sm, color: theme.textSecondary, lineHeight: 20 },
  tipCard: { flexDirection: 'row', gap: 12, backgroundColor: '#FEF3C7', borderRadius: 18, padding: 16, marginBottom: 8 },
  tipTitle: { fontSize: SIZES.md, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  tipText: { fontSize: SIZES.sm, color: '#92400E', lineHeight: 20 },
  emptyCard: { margin: 20, backgroundColor: theme.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  emptyText: { color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },
});

export default ForecastDetailsScreen;
