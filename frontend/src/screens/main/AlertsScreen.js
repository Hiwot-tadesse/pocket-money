import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const ALERT_ICONS = {
  budget_warning: { icon: 'warning', color: COLORS.warning },
  budget_exceeded: { icon: 'alert-circle', color: COLORS.danger },
  inactivity: { icon: 'time', color: COLORS.secondary },
  milestone: { icon: 'trophy', color: COLORS.income },
  general: { icon: 'notifications', color: COLORS.primary },
};

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await alertAPI.getAll({ limit: 50 });
      setAlerts(res.data);
    } catch (e) {
      console.error('Alerts error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await alertAPI.markAsRead(id);
      setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, isRead: true } : a));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertAPI.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Alert', 'Remove this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await alertAPI.delete(id);
            setAlerts((prev) => prev.filter((a) => a._id !== id));
          } catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const timeAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const renderAlert = ({ item }) => {
    const info = ALERT_ICONS[item.type] || ALERT_ICONS.general;
    return (
      <TouchableOpacity
        style={[st.alertCard, SHADOWS.small, !item.isRead && st.unread]}
        onPress={() => handleMarkRead(item._id)}
        onLongPress={() => handleDelete(item._id)}
        activeOpacity={0.7}
      >
        <View style={[st.iconWrap, { backgroundColor: info.color + '20' }]}>
          <Ionicons name={info.icon} size={22} color={info.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={st.alertTop}>
            <Text style={st.alertTitle}>{item.title}</Text>
            <Text style={st.alertTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={st.alertMsg} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.isRead && <View style={st.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={st.markAll}>Read All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={st.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item._id}
          contentContainerStyle={st.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
              <Text style={st.emptyText}>No notifications</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: SIZES.paddingLg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.white },
  markAll: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  list: { padding: SIZES.margin, paddingBottom: 30 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.borderRadius, padding: 14, marginBottom: 8, gap: 12 },
  unread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTitle: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, flex: 1 },
  alertTime: { fontSize: 10, color: COLORS.textLight },
  alertMsg: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: SIZES.base, color: COLORS.textSecondary, marginTop: 12 },
});

export default AlertsScreen;
