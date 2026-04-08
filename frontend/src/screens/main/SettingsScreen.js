import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const SettingsScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');

  const handleToggleNotifications = async (value) => {
    setNotifications(value);
    try {
      await updateUser({ notificationsEnabled: value });
    } catch (e) {
      setNotifications(!value);
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }
    try {
      await updateUser({ username: newName.trim() });
      setEditingName(false);
      Alert.alert('Success', 'Username updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      {/* Profile Section */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>Profile</Text>
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
        <Text style={s.sectionTitle}>Preferences</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
            <Text style={s.settingLabel}>Notifications</Text>
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
            <Text style={s.settingLabel}>Currency</Text>
          </View>
          <Text style={s.settingValue}>{user?.currency || 'USD'}</Text>
        </View>
      </View>

      {/* About */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            <Text style={s.settingLabel}>Version</Text>
          </View>
          <Text style={s.settingValue}>1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={s.logoutText}>Sign Out</Text>
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
