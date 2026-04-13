import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goalAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const PRESET_GOALS = [
  { icon: 'airplane',        title: 'Vacation',   color: '#06B6D4' },
  { icon: 'laptop',          title: 'Laptop / PC', color: '#4338CA' },
  { icon: 'phone-portrait',  title: 'Phone',       color: '#6366F1' },
  { icon: 'car',             title: 'Car',          color: '#EF4444' },
  { icon: 'home',            title: 'House / Rent', color: '#F59E0B' },
  { icon: 'school',          title: 'Education',   color: '#10B981' },
  { icon: 'heart',           title: 'Health',       color: '#EC4899' },
  { icon: 'gift',            title: 'Gift',         color: '#D946EF' },
  { icon: 'camera',          title: 'Camera',       color: '#14B8A6' },
  { icon: 'musical-notes',   title: 'Music',        color: '#8B5CF6' },
  { icon: 'football',        title: 'Sports',       color: '#F97316' },
  { icon: 'book',            title: 'Books',        color: '#84CC16' },
  { icon: 'bicycle',         title: 'Bicycle',      color: '#10B981' },
  { icon: 'restaurant',      title: 'Dining',       color: '#EF4444' },
  { icon: 'tv',              title: 'TV',            color: '#6366F1' },
  { icon: 'diamond',         title: 'Luxury',       color: '#F59E0B' },
  { icon: 'create-outline',  title: 'Custom',       color: '#78716C', isCustom: true },
];

const findMatchingPreset = (title, icon) => {
  return (
    PRESET_GOALS.find((p) => !p.isCustom && p.title === title) ||
    PRESET_GOALS.find((p) => !p.isCustom && p.icon === icon) ||
    PRESET_GOALS.find((p) => p.isCustom)
  );
};

const AddGoalScreen = ({ navigation, route }) => {
  const existing = route.params?.goal;
  const isEdit = !!existing;

  const initialPreset = isEdit
    ? findMatchingPreset(existing.title, existing.icon)
    : null;

  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customTitle, setCustomTitle] = useState(
    isEdit && initialPreset?.isCustom ? existing.title : ''
  );
  const [description, setDescription] = useState(existing?.description || '');
  const [targetAmount, setTargetAmount] = useState(existing?.targetAmount?.toString() || '');
  const [deadline, setDeadline] = useState(
    existing?.deadline ? new Date(existing.deadline).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);

  const activeColor = selectedPreset?.color || COLORS.primary;
  const activeIcon  = selectedPreset?.icon  || 'star';
  const activeTitle = selectedPreset
    ? (selectedPreset.isCustom ? customTitle : selectedPreset.title)
    : '';

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    if (!preset.isCustom) setCustomTitle('');
  };

  const handleSubmit = async () => {
    if (!activeTitle.trim()) {
      Alert.alert('Error', selectedPreset?.isCustom
        ? 'Please enter your custom goal title'
        : 'Please choose a goal type');
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: activeTitle.trim(),
        description: description.trim(),
        targetAmount: parseFloat(targetAmount),
        icon: activeIcon,
        color: activeColor,
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
            <Text style={[styles.currency, { color: activeColor }]}>ETB</Text>
            <TextInput
              style={[styles.amountInput, { color: activeColor }]}
              placeholder="0.00"
              placeholderTextColor={COLORS.placeholder}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
              autoFocus={!isEdit}
            />
          </View>
          <View style={[styles.amountUnderline, { backgroundColor: activeColor }]} />
        </View>

        {/* Goal Type Picker */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>WHAT IS YOUR GOAL?</Text>
          <View style={styles.presetGrid}>
            {PRESET_GOALS.map((preset) => {
              const isSelected = selectedPreset?.title === preset.title;
              return (
                <TouchableOpacity
                  key={preset.title}
                  style={[
                    styles.presetTile,
                    isSelected && { backgroundColor: preset.color, borderColor: preset.color },
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.presetIconBg,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : preset.color + '18' },
                  ]}>
                    <Ionicons
                      name={preset.icon}
                      size={24}
                      color={isSelected ? COLORS.white : preset.color}
                    />
                  </View>
                  <Text style={[styles.presetLabel, isSelected && styles.presetLabelActive]}>
                    {preset.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom title input — shown when Custom is selected */}
          {selectedPreset?.isCustom && (
            <View style={[styles.inputBox, { marginTop: 16, borderColor: activeColor }]}>
              <Ionicons name="create-outline" size={20} color={activeColor} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Type your goal name..."
                placeholderTextColor={COLORS.placeholder}
                value={customTitle}
                onChangeText={setCustomTitle}
                maxLength={100}
                autoFocus
              />
            </View>
          )}
        </View>

        {/* Optional fields */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>EXTRA DETAILS</Text>

          <Text style={styles.fieldLabel}>Description <Text style={styles.optional}>(Optional)</Text></Text>
          <View style={styles.inputBox}>
            <Ionicons name="document-text-outline" size={20} color={activeColor} style={styles.inputIcon} />
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
            <Ionicons name="calendar-outline" size={20} color={activeColor} style={styles.inputIcon} />
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

        {/* Live Preview */}
        {(activeTitle || targetAmount) ? (
          <View style={[styles.previewCard, { borderColor: activeColor + '50' }]}>
            <View style={[styles.previewIconBg, { backgroundColor: activeColor + '20' }]}>
              <Ionicons name={activeIcon} size={28} color={activeColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>{activeTitle || 'Your Goal'}</Text>
              <Text style={[styles.previewAmount, { color: activeColor }]}>
                ETB {parseFloat(targetAmount || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: activeColor }]}
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
  scrollContent: { paddingBottom: 48 },
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
    letterSpacing: 1.2, marginBottom: 12,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 28, fontWeight: '800', marginRight: 8 },
  amountInput: { fontSize: 56, fontWeight: '800', minWidth: 140, textAlign: 'center', letterSpacing: -1 },
  amountUnderline: { width: '60%', height: 3, borderRadius: 2, marginTop: 12, opacity: 0.6 },
  formCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.margin,
    marginTop: 16, borderRadius: SIZES.borderRadiusLg,
    padding: 20, ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 1.2, marginBottom: 16,
  },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetTile: {
    alignItems: 'center', justifyContent: 'center',
    width: '29%', paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background, gap: 8,
  },
  presetIconBg: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    textAlign: 'center',
  },
  presetLabelActive: { color: COLORS.white },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  optional: { fontWeight: '400', color: COLORS.textLight, fontStyle: 'italic' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius, paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: SIZES.base, color: COLORS.text, fontWeight: '500' },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: SIZES.margin, marginTop: 16,
    backgroundColor: COLORS.white, borderRadius: SIZES.borderRadiusLg,
    padding: 16, borderWidth: 2, ...SHADOWS.small,
  },
  previewIconBg: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  previewTitle: { fontSize: SIZES.base, fontWeight: '800', color: COLORS.text },
  previewAmount: { fontSize: SIZES.md, fontWeight: '700', marginTop: 4 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: SIZES.margin, marginTop: 20, paddingVertical: 18,
    borderRadius: SIZES.borderRadiusLg, gap: 10, ...SHADOWS.medium,
  },
  submitText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '800' },
});

export default AddGoalScreen;
