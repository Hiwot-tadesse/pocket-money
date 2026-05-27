import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { authAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const validatePassword = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.';
  return null;
};

const ResetPasswordScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [token, setToken] = useState(route.params?.token || '');
  const [email] = useState(route.params?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params?.token]);

  useEffect(() => {
    if (token) return;
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const tokenParam = parsed?.queryParams?.token;
      if (tokenParam) {
        setToken(tokenParam);
      }
    });
  }, [token]);

  const mapResetError = (message) => {
    if (!message) return t('resetTokenInvalid');
    const normalized = message.toLowerCase();
    if (normalized.includes('expired')) return t('resetTokenExpired');
    if (normalized.includes('invalid')) return t('resetTokenInvalid');
    return message;
  };

  const handleReset = async () => {
    setError('');
    if (!token) { setError(t('resetTokenInvalid')); return; }
    if (!newPassword) { setError(t('enterNewPassword')); return; }
    const pwErr = validatePassword(newPassword);
    if (pwErr) { setError(pwErr); return; }
    if (newPassword !== confirmPassword) { setError(t('passwordMismatch')); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (e) {
      setError(mapResetError(e.message));
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.income} />
          </View>
          <Text style={styles.successTitle}>{t('passwordResetSuccess')}</Text>
          <Text style={styles.successSub}>{t('passwordResetSuccessMessage')}</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in" size={20} color={COLORS.white} />
            <Text style={styles.loginBtnText}>{t('goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerIconWrap}>
            <Ionicons name="shield-checkmark" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>{t('resetPassword')}</Text>
          <Text style={styles.headerSub}>
            {email ? t('resettingFor', { email }) : t('enterNewPasswordOnly')}
          </Text>
        </View>

        <View style={styles.formCard}>

          {/* New Password */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{t('newPassword')}</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('newPasswordPlaceholder')}
              placeholderTextColor={COLORS.placeholder}
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setError(''); }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{t('confirmNewPassword')}</Text>
          <View style={[styles.inputBox, confirmPassword && newPassword !== confirmPassword && styles.inputBoxError]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('confirmNewPasswordPlaceholder')}
              placeholderTextColor={COLORS.placeholder}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleReset} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="shield-checkmark" size={20} color={COLORS.white} />
                  <Text style={styles.submitText}>{t('resetPassword')}</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.resendRow}
          >
            <Text style={styles.resendText}>{t('didntReceiveLink')} </Text>
            <Text style={styles.resendLink}>{t('requestAgain')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { flexGrow: 1 },
  header: { backgroundColor: COLORS.primary, paddingTop: 64, paddingBottom: 48, paddingHorizontal: SIZES.paddingLg, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, ...SHADOWS.large },
  backBtn: { position: 'absolute', top: 56, left: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  headerSub: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  formCard: { backgroundColor: theme.surface, margin: 20, marginTop: 24, borderRadius: 24, padding: 24, ...SHADOWS.medium },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '700', color: theme.textSecondary, marginBottom: 10 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: theme.border },
  inputBoxError: { borderColor: COLORS.expense },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: SIZES.base, color: theme.text, fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  errorText: { fontSize: SIZES.sm, color: COLORS.expense, fontWeight: '500', flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 18, marginTop: 24, gap: 10, ...SHADOWS.medium },
  submitText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  resendText: { color: theme.textSecondary, fontSize: SIZES.md },
  resendLink: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.income + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: '900', color: theme.text, marginBottom: 12 },
  successSub: { fontSize: SIZES.md, color: theme.textSecondary, textAlign: 'center', marginBottom: 36, lineHeight: 24 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, gap: 10, width: '100%', ...SHADOWS.medium },
  loginBtnText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
});

export default ResetPasswordScreen;
