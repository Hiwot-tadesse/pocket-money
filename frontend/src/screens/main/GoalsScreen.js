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
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { goalAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contributeModal, setContributeModal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await goalAPI.getAll();
      setGoals(res.data || []);
    } catch (e) {
      console.error('Goals fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchGoals(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchGoals(); };

  const handleDelete = (id, title) => {
    Alert.alert('Delete Goal', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await goalAPI.delete(id);
            setGoals((prev) => prev.filter((g) => g._id !== id));
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleContribute = async () => {
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setContributing(true);
    try {
      const res = await goalAPI.contribute(contributeModal._id, amt);
      setGoals((prev) => prev.map((g) => g._id === res.data._id ? res.data : g));
      setContributeModal(null);
      setContributeAmount('');
      if (res.data.isCompleted) {
        Alert.alert('🎉 Goal Achieved!', `You reached your goal: ${res.data.title}!`);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setContributing(false);
    }
  };

  const formatCurrency = (n) => `ETB ${(n || 0).toFixed(2)}`;

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today!';
    return `${diff}d left`;
  };

  const renderGoal = ({ item }) => {
    const progress = Math.min((item.currentAmount / item.targetAmount) * 100, 100);
    const daysLeft = getDaysLeft(item.deadline);

    return (
      <View style={[styles.goalCard, SHADOWS.medium]}>
        {/* Top row */}
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconBg, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon || 'star'} size={26} color={item.color || COLORS.primary} />
          </View>
          <View style={styles.goalMeta}>
            <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.goalDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
            {daysLeft && (
              <View style={[styles.deadlineBadge, { backgroundColor: daysLeft === 'Overdue' ? COLORS.expense + '15' : COLORS.primary + '12' }]}>
                <Ionicons name="time-outline" size={11} color={daysLeft === 'Overdue' ? COLORS.expense : COLORS.primary} />
                <Text style={[styles.deadlineText, { color: daysLeft === 'Overdue' ? COLORS.expense : COLORS.primary }]}>{daysLeft}</Text>
              </View>
            )}
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddGoal', { goal: item })}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(item._id, item.title)}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: item.isCompleted ? COLORS.income : (item.color || COLORS.primary) },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressCurrent}>{formatCurrency(item.currentAmount)}</Text>
            <Text style={styles.progressPct}>{progress.toFixed(0)}%</Text>
            <Text style={styles.progressTarget}>{formatCurrency(item.targetAmount)}</Text>
          </View>
        </View>

        {/* Actions */}
        {item.isCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.income} />
            <Text style={styles.completedText}>Goal Achieved!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.contributeBtn, { backgroundColor: item.color || COLORS.primary }]}
            onPress={() => { setContributeModal(item); setContributeAmount(''); }}
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.contributeBtnText}>Add Money</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Goals</Text>
          <Text style={styles.headerSubtitle}>{goals.length} saving{goals.length !== 1 ? 's' : ''} target{goals.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddGoal', {})}
        >
          <Ionicons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoal}
          keyExtractor={(g) => g._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="flag-outline" size={52} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to set your first savings goal</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddGoal', {})}
              >
                <Text style={styles.emptyAddBtnText}>Create a Goal</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Contribute Modal */}
      <Modal visible={!!contributeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBg, { backgroundColor: (contributeModal?.color || COLORS.primary) + '20' }]}>
                <Ionicons name={contributeModal?.icon || 'star'} size={24} color={contributeModal?.color || COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Money</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{contributeModal?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setContributeModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalRemaining}>
              Still need: {formatCurrency((contributeModal?.targetAmount || 0) - (contributeModal?.currentAmount || 0))}
            </Text>

            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>ETB</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="decimal-pad"
                value={contributeAmount}
                onChangeText={setContributeAmount}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: contributeModal?.color || COLORS.primary }]}
              onPress={handleContribute}
              disabled={contributing}
            >
              {contributing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalBtnText}>Save to Goal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.large,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: SIZES.margin, paddingTop: 20, paddingBottom: 40 },
  goalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadiusLg,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  goalIconBg: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  goalMeta: { flex: 1 },
  goalTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  goalDesc: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 3 },
  deadlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 6,
  },
  deadlineText: { fontSize: 10, fontWeight: '700' },
  goalActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  progressSection: { marginBottom: 14 },
  progressBar: {
    height: 10, borderRadius: 5, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCurrent: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  progressPct: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.textSecondary },
  progressTarget: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textLight },
  contributeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: SIZES.borderRadius, gap: 6,
  },
  contributeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.md },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.income + '12', gap: 8,
  },
  completedText: { fontWeight: '800', color: COLORS.income, fontSize: SIZES.md },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconBg: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...SHADOWS.small,
  },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 24 },
  emptyAddBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: SIZES.borderRadiusLg, ...SHADOWS.medium,
  },
  emptyAddBtnText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.md },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 28, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconBg: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  modalSubtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  modalRemaining: {
    fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600',
    textAlign: 'center', marginBottom: 20,
  },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  modalCurrency: { fontSize: 24, fontWeight: '800', color: COLORS.textSecondary, marginRight: 8 },
  modalInput: {
    fontSize: 48, fontWeight: '800', color: COLORS.text,
    minWidth: 120, textAlign: 'center',
  },
  modalBtn: {
    paddingVertical: 16, borderRadius: SIZES.borderRadiusLg,
    alignItems: 'center', ...SHADOWS.medium,
  },
  modalBtnText: { color: COLORS.white, fontWeight: '800', fontSize: SIZES.lg },
});

export default GoalsScreen;
