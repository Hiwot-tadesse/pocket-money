import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useSmartAlerts } from '../../context/SmartAlertsContext';

const ALERT_ICONS = {
  budget_warning: { icon: 'warning', color: COLORS.warning },
  budget_exceeded: { icon: 'alert-circle', color: COLORS.danger },
  inactivity: { icon: 'time', color: COLORS.secondary },
  milestone: { icon: 'trophy', color: COLORS.income },
  general: { icon: 'notifications', color: COLORS.primary },
  expense_reminder: { icon: 'alarm', color: '#6366F1' },
  daily_tip: { icon: 'bulb', color: '#F59E0B' },
  version_update: { icon: 'rocket', color: '#8B5CF6' },
  no_savings: { icon: 'trending-down', color: COLORS.danger },
};

const AlertsScreen = ({ navigation }) => {
  const { t, language } = useLanguage();
  const {
    localAlerts, markAlertRead, markAllAlertsRead, deleteAlert: deleteLocalAlert,
  } = useSmartAlerts();
  const [serverAlerts, setServerAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await alertAPI.getAll({ limit: 50 });
      setServerAlerts(res.data);
    } catch (e) {
      console.error('Alerts error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const getLocalTitle = (item) => {
    if (typeof item.title === 'object') return item.title[language] || item.title.en;
    return item.title;
  };

  const getLocalMessage = (item) => {
    if (typeof item.message === 'object') return item.message[language] || item.message.en;
    return item.message;
  };

  const handleMarkReadServer = async (id) => {
    try {
      await alertAPI.markAsRead(id);
      setServerAlerts((prev) => prev.map((a) => a._id === id ? { ...a, isRead: true } : a));
    } catch (e) {
      Alert.alert(t('error'), e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertAPI.markAllAsRead();
      setServerAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (e) {
      // ignore if server fails
    }
    markAllAlertsRead();
  };

  const handleDeleteServer = (id) => {
    Alert.alert(t('deleteAlert'), t('removeAlert'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive',
        onPress: async () => {
          try {
            await alertAPI.delete(id);
            setServerAlerts((prev) => prev.filter((a) => a._id !== id));
          } catch (e) { Alert.alert(t('error'), e.message); }
        },
      },
    ]);
  };

  const handleDeleteLocal = (id) => {
    Alert.alert(t('deleteAlert'), t('removeAlert'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteLocalAlert(id) },
    ]);
  };

  const timeAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return `${mins}${t('mAgo')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('hAgo')}`;
    return `${Math.floor(hrs / 24)}${t('dAgo')}`;
  };

  // Merge and build sections
  const smartItems = localAlerts.map((a) => ({
    ...a,
    _key: a.id,
    _source: 'local',
    _title: getLocalTitle(a),
    _message: getLocalMessage(a),
    _date: a.date,
  }));
  const serverItems = serverAlerts.map((a) => ({
    ...a,
    _key: a._id,
    _source: 'server',
    _title: a.title,
    _message: a.message,
    _date: a.createdAt,
  }));
  const allAlerts = [...smartItems, ...serverItems].sort(
    (a, b) => new Date(b._date) - new Date(a._date)
  );

  const sections = [];
  if (allAlerts.length > 0) {
    const unread = allAlerts.filter((a) => !a.isRead);
    const read = allAlerts.filter((a) => a.isRead);
    if (unread.length > 0) sections.push({ title: t('newAlerts'), data: unread });
    if (read.length > 0) sections.push({ title: t('earlier'), data: read });
  }

  const renderAlert = ({ item }) => {
    const info = ALERT_ICONS[item.type] || ALERT_ICONS.general;
    const isLocal = item._source === 'local';
    return (
      <TouchableOpacity
        style={[st.alertCard, SHADOWS.small, !item.isRead && st.unread]}
        onPress={() => {
          if (isLocal) markAlertRead(item.id);
          else handleMarkReadServer(item._id);
        }}
        onLongPress={() => {
          if (isLocal) handleDeleteLocal(item.id);
          else handleDeleteServer(item._id);
        }}
        activeOpacity={0.7}
      >
        <View style={[st.iconWrap, { backgroundColor: info.color + '20' }]}>
          <Ionicons name={info.icon} size={22} color={info.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={st.alertTop}>
            <Text style={st.alertTitle} numberOfLines={1}>{item._title}</Text>
            <Text style={st.alertTime}>{timeAgo(item._date)}</Text>
          </View>
          <Text style={st.alertMsg} numberOfLines={3}>{item._message}</Text>
          {item.type === 'daily_tip' && (
            <View style={st.tipBadge}>
              <Ionicons name="bulb" size={10} color="#F59E0B" />
              <Text style={st.tipBadgeText}>{t('dailyTip')}</Text>
            </View>
          )}
          {item.type === 'version_update' && (
            <View style={[st.tipBadge, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="rocket" size={10} color="#8B5CF6" />
              <Text style={[st.tipBadgeText, { color: '#8B5CF6' }]}>{t('newVersion')}</Text>
            </View>
          )}
          {item.type === 'expense_reminder' && (
            <View style={[st.tipBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="alarm" size={10} color="#6366F1" />
              <Text style={[st.tipBadgeText, { color: '#6366F1' }]}>{t('reminder')}</Text>
            </View>
          )}
        </View>
        {!item.isRead && <View style={st.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={st.sectionTitle}>{title}</Text>
  );

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{t('notifications')}</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={st.markAll}>{t('readAll')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : sections.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
          <Text style={st.emptyText}>{t('noNotifications')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderAlert}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item._key}
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} colors={[COLORS.primary]} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.primary, 
    paddingTop: 56, 
    paddingBottom: 24, 
    paddingHorizontal: SIZES.paddingLg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.large,
    zIndex: 10,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  markAll: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  list: { padding: SIZES.margin, paddingBottom: 30 },
  sectionTitle: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 12 },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: SIZES.borderRadius, padding: 16, marginBottom: 12, gap: 12 },
  unread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  alertTime: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  alertMsg: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 6 },
  tipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8, alignSelf: 'flex-start', gap: 6 },
  tipBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
});

export default AlertsScreen;
