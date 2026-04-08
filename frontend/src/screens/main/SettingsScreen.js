import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSmartAlerts } from '../../context/SmartAlertsContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SettingsScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const { expenseReminder, setExpenseReminder } = useSmartAlerts();
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');
  const [reminderEnabled, setReminderEnabled] = useState(expenseReminder.enabled);
  const [reminderTitle, setReminderTitle] = useState(expenseReminder.title);
  const [editingReminder, setEditingReminder] = useState(false);

  const handleToggleNotifications = async (value) => {
    setNotifications(value);
    try {
      await updateUser({ notificationsEnabled: value });
    } catch (e) {
      setNotifications(!value);
      Alert.alert(t('error'), e.message);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim().length < 3) {
      Alert.alert(t('error'), t('usernameMin3'));
      return;
    }
    try {
      await updateUser({ username: newName.trim() });
      setEditingName(false);
      Alert.alert(t('success'), t('usernameUpdated'));
    } catch (e) {
      Alert.alert(t('error'), e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('settings')}</Text>
      </View>

      {/* Profile Section */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('profile')}</Text>
        <View style={s.profileRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={s.editRow}>
                <TextInput style={s.editInput} value={newName} onChangeText={setNewName} autoFocus />
                <TouchableOpacity onPress={handleUpdateName} style={s.saveBtn}>
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNewName(user?.username || ''); }}>
                  <Ionicons name="close" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={s.nameRow}>
                <Text style={s.userName}>{user?.username}</Text>
                <Ionicons name="pencil" size={14} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('preferences')}</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            <Text style={s.settingLabel}>{t('notificationsSetting')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={notifications ? COLORS.primary : COLORS.textLight}
          />
        </View>
        <View style={s.divider} />
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
            <Text style={s.settingLabel}>{t('currency')}</Text>
          </View>
          <Text style={s.settingValue}>ETB</Text>
        </View>
      </View>

      {/* Expense Reminder */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('expenseReminder')}</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="alarm-outline" size={22} color="#6366F1" />
            <Text style={s.settingLabel}>{t('dailyReminder')}</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(val) => {
              setReminderEnabled(val);
              setExpenseReminder(val, reminderTitle);
            }}
            trackColor={{ false: COLORS.border, true: '#C7D2FE' }}
            thumbColor={reminderEnabled ? '#6366F1' : COLORS.textLight}
          />
        </View>
        {reminderEnabled && (
          <>
            <View style={s.divider} />
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <Ionicons name="pencil-outline" size={22} color="#6366F1" />
                <Text style={s.settingLabel}>{t('reminderTitle')}</Text>
              </View>
              {!editingReminder ? (
                <TouchableOpacity onPress={() => setEditingReminder(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.settingValue} numberOfLines={1}>
                    {reminderTitle || t('tapToSet')}
                  </Text>
                  <Ionicons name="pencil" size={12} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : (
                <View style={[s.editRow, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={[s.editInput, { fontSize: SIZES.sm }]}
                    value={reminderTitle}
                    onChangeText={setReminderTitle}
                    placeholder={t('reminderTitlePlaceholder')}
                    placeholderTextColor={COLORS.textLight}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setEditingReminder(false);
                      setExpenseReminder(reminderEnabled, reminderTitle);
                    }}
                    style={[s.saveBtn, { backgroundColor: '#6366F1' }]}
                  >
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* About */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('about')}</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            <Text style={s.settingLabel}>{t('version')}</Text>
          </View>
          <Text style={s.settingValue}>1.1.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={s.logoutText}>{t('signOut')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: SIZES.paddingLg },
  headerTitle: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.white },
  section: { backgroundColor: COLORS.white, marginHorizontal: SIZES.margin, marginTop: 16, borderRadius: SIZES.borderRadius, padding: SIZES.padding },
  sectionTitle: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontSize: SIZES.xl, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text },
  userEmail: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, fontSize: SIZES.base, color: COLORS.text, borderBottomWidth: 1, borderColor: COLORS.primary, paddingVertical: 4 },
  saveBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.income, alignItems: 'center', justifyContent: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: SIZES.base, color: COLORS.text },
  settingValue: { fontSize: SIZES.md, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: SIZES.margin, marginTop: 24, paddingVertical: 14, borderRadius: SIZES.borderRadius, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.danger, gap: 8 },
  logoutText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.danger },
});

export default SettingsScreen;
