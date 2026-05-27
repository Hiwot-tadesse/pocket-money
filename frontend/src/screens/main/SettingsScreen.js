import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSmartAlerts } from '../../context/SmartAlertsContext';
import { useTheme } from '../../context/ThemeContext';
import { SIZES, SHADOWS } from '../../constants/theme';

const SettingsScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const { expenseReminder, setExpenseReminder } = useSmartAlerts();
  const { isDark, theme, toggleTheme } = useTheme();
  const s = getStyles(theme);
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [reminderEnabled, setReminderEnabled] = useState(expenseReminder.enabled);
  const [reminderTitle, setReminderTitle] = useState(expenseReminder.title);
  const [reminderTime, setReminderTime] = useState(expenseReminder.time || '08:00');
  const [editingReminder, setEditingReminder] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const PIC_KEY = `profile_pic_${user?._id}`;

  useEffect(() => {
    if (!user?._id) return;
    AsyncStorage.getItem(PIC_KEY).then((uri) => { if (uri) setProfilePic(uri); });
  }, [user?._id]);

  const handlePickImage = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            setProfilePic(uri);
            await AsyncStorage.setItem(PIC_KEY, uri);
          }
        },
      },
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow camera access.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            const uri = result.assets[0].uri;
            setProfilePic(uri);
            await AsyncStorage.setItem(PIC_KEY, uri);
          }
        },
      },
      profilePic
        ? {
            text: 'Remove Photo',
            style: 'destructive',
            onPress: async () => {
              setProfilePic(null);
              await AsyncStorage.removeItem(PIC_KEY);
            },
          }
        : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean));
  };

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

  const handleUpdatePhone = async () => {
    try {
      await updateUser({ phone: newPhone.trim() });
      setEditingPhone(false);
    } catch (e) {
      Alert.alert(t('error'), e.message);
    }
  };

  const handleSaveTime = () => {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(reminderTime)) {
      Alert.alert(t('error'), 'Please enter a valid time in HH:MM format (e.g. 08:30)');
      return;
    }
    setEditingTime(false);
    setExpenseReminder(reminderEnabled, reminderTitle, reminderTime);
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
          <TouchableOpacity onPress={handlePickImage} style={s.avatarWrap} activeOpacity={0.8}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={s.avatarImg} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarText}>{(user?.username || 'U')[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={s.editRow}>
                <TextInput style={s.editInput} value={newName} onChangeText={setNewName} autoFocus />
                <TouchableOpacity onPress={handleUpdateName} style={s.saveBtn}>
                  <Ionicons name="checkmark" size={20} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNewName(user?.username || ''); }}>
                  <Ionicons name="close" size={20} color={theme.textLight} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={s.nameRow}>
                <Text style={s.userName}>{user?.username}</Text>
                <Ionicons name="pencil" size={14} color={theme.textLight} />
              </TouchableOpacity>
            )}
            <Text style={s.userEmail}>{user?.email}</Text>
            {/* Phone field */}
            {editingPhone ? (
              <View style={[s.editRow, { marginTop: 8 }]}>
                <Ionicons name="call-outline" size={14} color={theme.textLight} />
                <TextInput
                  style={[s.editInput, { fontSize: SIZES.sm }]}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="Phone number"
                  placeholderTextColor={theme.textLight}
                  keyboardType="phone-pad"
                  autoFocus
                />
                <TouchableOpacity onPress={handleUpdatePhone} style={s.saveBtn}>
                  <Ionicons name="checkmark" size={18} color={theme.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingPhone(false); setNewPhone(user?.phone || ''); }}>
                  <Ionicons name="close" size={18} color={theme.textLight} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingPhone(true)} style={[s.nameRow, { marginTop: 6 }]}>
                <Ionicons name="call-outline" size={13} color={theme.textLight} />
                <Text style={[s.userEmail, { marginTop: 0, marginLeft: 4 }]}>
                  {user?.phone || 'Add phone number'}
                </Text>
                <Ionicons name="pencil" size={12} color={theme.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('preferences')}</Text>
        
        {/* Theme Toggle */}
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={theme.primary} />
            <Text style={s.settingLabel}>{t('darkMode')}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={isDark ? theme.primary : theme.textLight}
          />
        </View>

        {/* Notifications */}
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="notifications-outline" size={22} color={theme.primary} />
            <Text style={s.settingLabel}>{t('notificationsSetting')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: theme.border, true: theme.primaryLight }}
            thumbColor={notifications ? theme.primary : theme.textLight}
          />
        </View>
        <View style={s.divider} />
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="cash-outline" size={22} color={theme.primary} />
            <Text style={s.settingLabel}>{t('currency')}</Text>
          </View>
          <Text style={s.settingValue}>{t('currencyCode')}</Text>
        </View>
      </View>

      {/* Expense Reminder */}
      <View style={[s.section, SHADOWS.small]}>
        <Text style={s.sectionTitle}>{t('expenseReminder')}</Text>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Ionicons name="alarm-outline" size={22} color={theme.warning} />
            <Text style={s.settingLabel}>{t('dailyReminder')}</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(val) => {
              setReminderEnabled(val);
              setExpenseReminder(val, reminderTitle);
            }}
            trackColor={{ false: theme.border, true: '#C7D2FE' }}
            thumbColor={reminderEnabled ? '#6366F1' : theme.textLight}
          />
        </View>
        {reminderEnabled && (
          <>
            <View style={s.divider} />
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <Ionicons name="pencil-outline" size={22} color={theme.warning} />
                <Text style={s.settingLabel}>{t('reminderTitle')}</Text>
              </View>
              {!editingReminder ? (
                <TouchableOpacity onPress={() => setEditingReminder(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.settingValue} numberOfLines={1}>
                    {reminderTitle || t('tapToSet')}
                  </Text>
                  <Ionicons name="pencil" size={12} color={theme.textLight} />
                </TouchableOpacity>
              ) : (
                <View style={[s.editRow, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={[s.editInput, { fontSize: SIZES.sm }]}
                    value={reminderTitle}
                    onChangeText={setReminderTitle}
                    placeholder={t('reminderTitlePlaceholder')}
                    placeholderTextColor={theme.textLight}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setEditingReminder(false);
                      setExpenseReminder(reminderEnabled, reminderTitle, reminderTime);
                    }}
                    style={[s.saveBtn, { backgroundColor: '#6366F1' }]}
                  >
                    <Ionicons name="checkmark" size={20} color={theme.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          <View style={s.divider} />
            <View style={s.settingRow}>
              <View style={s.settingLeft}>
                <Ionicons name="time-outline" size={22} color={theme.warning} />
                <Text style={s.settingLabel}>Reminder Time</Text>
              </View>
              {!editingTime ? (
                <TouchableOpacity onPress={() => setEditingTime(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.settingValue}>{reminderTime || '08:00'}</Text>
                  <Ionicons name="pencil" size={12} color={theme.textLight} />
                </TouchableOpacity>
              ) : (
                <View style={[s.editRow, { flex: 1, marginLeft: 8 }]}>
                  <TextInput
                    style={[s.editInput, { fontSize: SIZES.sm, textAlign: 'center' }]}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    placeholder="HH:MM"
                    placeholderTextColor={theme.textLight}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveTime} style={[s.saveBtn, { backgroundColor: '#6366F1' }]}>
                    <Ionicons name="checkmark" size={20} color={theme.white} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingTime(false)}>
                    <Ionicons name="close" size={18} color={theme.textLight} />
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
            <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            <Text style={s.settingLabel}>{t('version')}</Text>
          </View>
          <Text style={s.settingValue}>1.1.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={theme.danger} />
        <Text style={s.logoutText}>{t('signOut')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    backgroundColor: theme.primary,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.large,
    zIndex: 10,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: theme.white, letterSpacing: -0.5 },
  section: {
    backgroundColor: theme.surface,
    marginHorizontal: SIZES.margin,
    marginTop: 20,
    borderRadius: SIZES.borderRadiusLg,
    padding: SIZES.paddingLg,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: SIZES.xs, fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative', width: 64, height: 64 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.primary + '30' },
  avatarImg: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.primary + '40' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.surface },
  avatarText: { color: theme.primary, fontSize: SIZES.xxl, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: SIZES.lg, fontWeight: '700', color: theme.text },
  userEmail: { fontSize: SIZES.sm, color: theme.textSecondary, marginTop: 4, fontWeight: '500' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, fontSize: SIZES.base, color: theme.text, borderBottomWidth: 2, borderColor: theme.primary, paddingVertical: 4, fontWeight: '600' },
  saveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.income, alignItems: 'center', justifyContent: 'center', ...SHADOWS.small },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontSize: SIZES.base, color: theme.text, fontWeight: '600' },
  settingValue: { fontSize: SIZES.md, color: theme.textSecondary, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.divider, marginVertical: 4, marginLeft: 36 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SIZES.margin,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: SIZES.borderRadiusLg,
    backgroundColor: theme.danger + '10',
    borderWidth: 1.5,
    borderColor: theme.danger + '30',
    gap: 8,
  },
  logoutText: { fontSize: SIZES.base, fontWeight: '700', color: theme.danger },

});

export default SettingsScreen;
