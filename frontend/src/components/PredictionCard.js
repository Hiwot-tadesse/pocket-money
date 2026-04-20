import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { predictionAPI } from '../services/api';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

const TrendIcon = ({ trend, type }) => {
  if (trend === 'increasing') {
    const color = type === 'income' ? COLORS.income : '#F87171';
    return <Ionicons name="trending-up" size={14} color={color} />;
  }
  if (trend === 'decreasing') {
    const color = type === 'income' ? '#F87171' : COLORS.income;
    return <Ionicons name="trending-down" size={14} color={color} />;
  }
  return <Ionicons name="remove" size={14} color={COLORS.textLight} />;
};

const PredictionCard = () => {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictionAPI.get();
      setData(res.data);
    } catch (e) {
      setError(e.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmt = (n) => `ETB ${(n || 0).toFixed(2)}`;

  const savingsColor =
    !data || !data.predicted
      ? COLORS.primary
      : data.predicted.savings >= 0
      ? COLORS.income
      : '#F87171';

  return (
    <View style={[styles.card, SHADOWS.medium]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Ionicons name="analytics" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>{t('predictionTitle') || 'Next Month Forecast'}</Text>
            {data?.monthsAnalyzed ? (
              <Text style={styles.subtitle}>
                {t('predictionSubtitle')
                  ? t('predictionSubtitle', { months: data.monthsAnalyzed })
                  : `Based on ${data.monthsAnalyzed} month${data.monthsAnalyzed > 1 ? 's' : ''} of data`}
              </Text>
            ) : null}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('analyzing') || 'Analyzing your finances…'}</Text>
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No Data */}
      {!loading && !error && data && !data.hasData && (
        <View style={styles.center}>
          <Ionicons name="hourglass-outline" size={32} color={COLORS.textLight} />
          <Text style={styles.noDataText}>{data.message}</Text>
        </View>
      )}

      {/* Prediction content */}
      {!loading && !error && data?.hasData && (
        <>
          {/* Summary row — always visible */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelRow}>
                <TrendIcon trend={data.trends?.income} type="income" />
                <Text style={styles.summaryLabel}>{t('income') || 'Income'}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: COLORS.income }]}>
                {fmt(data.predicted?.income)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelRow}>
                <TrendIcon trend={data.trends?.expense} type="expense" />
                <Text style={styles.summaryLabel}>{t('expenses') || 'Expenses'}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#F87171' }]}>
                {fmt(data.predicted?.expense)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelRow}>
                <Ionicons
                  name={data.predicted?.savings >= 0 ? 'save' : 'alert-circle'}
                  size={14}
                  color={savingsColor}
                />
                <Text style={styles.summaryLabel}>{t('savings') || 'Savings'}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: savingsColor }]}>
                {fmt(data.predicted?.savings)}
              </Text>
            </View>
          </View>

          {/* Expanded details */}
          {expanded && (
            <>
              {/* Top spending categories */}
              {data.topCategories?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t('topSpendingCategories') || 'Top Predicted Expenses'}
                  </Text>
                  {data.topCategories.map((cat, i) => {
                    const max = data.topCategories[0].amount || 1;
                    const barWidth = `${Math.round((cat.amount / max) * 100)}%`;
                    return (
                      <View key={cat.category} style={styles.catRow}>
                        <Text style={styles.catRank}>{i + 1}</Text>
                        <View style={styles.catInfo}>
                          <View style={styles.catLabelRow}>
                            <Text style={styles.catName}>{cat.category}</Text>
                            <Text style={styles.catAmount}>{fmt(cat.amount)}</Text>
                          </View>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: barWidth }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* AI Insight */}
              {data.aiInsight && (
                <View style={styles.insightBox}>
                  <View style={styles.insightHeader}>
                    <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    <Text style={styles.insightTitle}>{t('aiInsight') || 'AI Insight'}</Text>
                  </View>
                  <Text style={styles.insightText}>{data.aiInsight}</Text>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface || '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider || '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.base || 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: SIZES.xs || 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  center: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: SIZES.sm || 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  errorText: {
    fontSize: SIZES.sm || 13,
    color: '#F87171',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  retryText: {
    fontSize: SIZES.sm || 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: SIZES.sm || 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: SIZES.xs || 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: SIZES.sm || 13,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.divider || '#f0f0f0',
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.xs || 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  catRank: {
    width: 18,
    fontSize: SIZES.xs || 11,
    color: COLORS.textLight,
    fontWeight: '700',
    textAlign: 'center',
  },
  catInfo: {
    flex: 1,
  },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  catName: {
    fontSize: SIZES.sm || 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  catAmount: {
    fontSize: SIZES.sm || 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 5,
    backgroundColor: COLORS.divider || '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  insightBox: {
    margin: 16,
    marginTop: 4,
    padding: 14,
    backgroundColor: COLORS.primary + '0D',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: SIZES.sm || 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  insightText: {
    fontSize: SIZES.sm || 13,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default PredictionCard;
