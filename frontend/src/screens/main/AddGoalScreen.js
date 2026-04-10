import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goalAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const GOAL_ICONS = [
  { name: 'airplane', label: 'Vacation' },
  { name: 'laptop', label: 'Tech' },
  { name: 'car', label: 'Car' },
  { name: 'home', label: 'Home' },
  { name: 'school', label: 'Education' },
  { name: 'heart', label: 'Health' },
  { name: 'gift', label: 'Gift' },
  { name: 'camera', label: 'Camera' },
  { name: 'musical-notes', label: 'Music' },
  { name: 'football', label: 'Sports' },
  { name: 'book', label: 'Books' },
  { name: 'diamond', label: 'Luxury' },
  { name: 'bicycle', label: 'Bicycle' },
  { name: 'restaurant', label: 'Dining' },
  { name: 'star', label: 'Other' },
];

const GOAL_COLORS = [
  '#4338CA', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6',
  '#F97316', '#84CC16',
];

const AddGoalScreen = ({ navigation, route }) => {
  const existing = route.params?.goal;
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [targetAmount, setTargetAmount] = useState(existing?.targetAmount?.toString() || '');
  const [deadline, setDeadline] = useState(
    existing?.deadline ? new Date(existing.deadline).toISOString().split('T')[0] : ''
  );
  const [icon, setIcon] = useState(existing?.icon || 'star');
  const [color, setColor] = useState(existing?.color || COLORS.primary);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a goal title'); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { Alert.alert('Error', 'Please enter a valid target amount'); return; }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        targetAmount: parseFloat(targetAmount),
        icon,
        color,
        deadline: deadline || null,
      };

      if (isEdit) {
        await goalAPI.update(existing._id, data);
      } else {
        await goalAPI.create(data);
      }

      Alert.alert('Success', isEdit ? 'Goal updated!' : 'Goal created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Goal' : 'New Goal'}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>TARGET AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color }]}>ETB</Text>
            <TextInput
              style={[styles.amountInput, { color }]}
              placeholder="0.00"
              placeholderTextColor={COLORS.placeholder}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              autoFocus={!isEdit}
            />
          </View>
          <View style={[styles.amountUnderline, { backgroundColor: color }]} />
        </View>

        {/* Details Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>GOAL DETAILS</Text>

          <Text style={styles.fieldLabel}>Goal Title *</Text>
          <View style={styles.inputBox}>
            <Ionicons name="flag-outline" size={20} color={color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Buy a new laptop"
              placeholderTextColor={COLORS.placeholder}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Description <Text style={styles.optional}>(Optional)</Text></Text>
          <View style={styles.inputBox}>
            <Ionicons name="create-outline" size={20} color={color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Why do you want this?"
              placeholderTextColor={COLORS.placeholder}
              value={description}
              onChangeText={setDescription}
              maxLength={300}
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Deadline <Text style={styles.optional}>(Optional, YYYY-MM-DD)</Text></Text>
          <View style={styles.inputBox}>
            <Ionicons name="calendar-outline" size={20} color={color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-12-31"
              placeholderTextColor={COLORS.placeholder}
              value={deadline}
              onChangeText={setDeadline}
              maxLength={10}
            />
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>CHOOSE ICON</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic.name}
                style={[styles.iconChip, icon === ic.name && { backgroundColor: color, borderColor: color }]}
                onPress={() => setIcon(ic.name)}
              >
                <Ionicons name={ic.name} size={22} color={icon === ic.name ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.iconLabel, icon === ic.name && { color: COLORS.white }]}>{ic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>CHOOSE COLOR</Text>
          <View style={styles.colorRow}>
            {GOAL_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={[styles.previewCard, { borderColor: color + '40' }]}>
          <View style={[styles.previewIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle}>{title || 'Your Goal'}</Text>
            <Text style={styles.previewAmount}>Target: ETB {parseFloat(targetAmount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: color }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name={isEdit ? 'checkmark-circle' : 'flag'} size={22} color={COLORS.white} />
              <Text style={styles.submitText}>{isEdit ? 'Update Goal' : 'Create Goal'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 32,
    paddingHorizontal: SIZES.paddingLg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    ...SHADOWS.large,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  amountCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.margin,
    marginTop: 20, borderRadius: SIZES.borderRadiusLg,
    padding: 24, alignItems: 'center', ...SHADOWS.medium,
  },
  amountLabel: {
    fontSize: SIZES.xs, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 1, marginBottom: 12,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 28, fontWeight: '800', marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: '800', minWidth: 140, textAlign: 'center', letterSpacing: -1 },
  amountUnderline: { width: '60%', height: 3, borderRadius: 2, marginTop: 12, opacity: 0.5 },
  formCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.margin,
    marginTop: 16, borderRadius: SIZES.borderRadiusLg,
    padding: 20, ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 1, marginBottom: 16,
  },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  optional: { fontWeight: '400', color: COLORS.textLight, fontStyle: 'italic' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: SIZES.base, color: COLORS.text, fontWeight: '500' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconChip: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background, gap: 4, minWidth: 70,
  },
  iconLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorDot: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: { borderWidth: 3, borderColor: COLORS.white, ...SHADOWS.small },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: SIZES.margin, marginTop: 16,
    backgroundColor: COLORS.white, borderRadius: SIZES.borderRadiusLg,
    padding: 16, borderWidth: 2, ...SHADOWS.small,
  },
  previewIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  previewTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  previewAmount: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: SIZES.margin, marginTop: 20, paddingVertical: 18,
    borderRadius: SIZES.borderRadiusLg, gap: 10, ...SHADOWS.medium,
  },
  submitText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '800' },
});

export default AddGoalScreen;
