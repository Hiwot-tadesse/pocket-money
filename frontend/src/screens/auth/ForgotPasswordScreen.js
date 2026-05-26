import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpResult, setOtpResult] = useState(null);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) { setError(t('enterEmailFirst')); return; }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim());
      setOtpResult(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  if (otpResult) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="lock-open" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>{t('resetCodeGenerated')}</Text>
          {otpResult.emailSent ? (
            <Text style={styles.successSub}>
              A reset code was sent to{'\n'}<Text style={{ fontWeight: '700', color: COLORS.primary }}>{email}</Text>
            </Text>
          ) : (
            <Text style={styles.successSub}>{t('yourResetCode')}</Text>
          )}
          {!otpResult.emailSent && (
            <View style={styles.otpBox}>
              <Text style={styles.otpText}>{otpResult.otp}</Text>
            </View>
          )}
          <Text style={styles.expiryNote}>⏱ {t('validFor', { time: otpResult.expiresIn })}</Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate('ResetPassword', { email: email.trim(), otp: otpResult.otp })}
          >
            <Text style={styles.continueBtnText}>{t('continueToReset')}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
            <Text style={styles.backLinkText}>{t('backToLogin')}</Text>
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
            <Ionicons name="key" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>{t('forgotPassword')}</Text>
          <Text style={styles.headerSub}>{t('enterEmailForCode')}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t('emailAddress')}</Text>
          <View style={[styles.inputBox, error && styles.inputBoxError]}>
            <Ionicons name="mail-outline" size={20} color={error ? COLORS.expense : COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>
          {!!error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSend} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.submitText}>{t('sendResetCode')}</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backLinkText}>{t('backToLogin')}</Text>
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
  headerSub: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  formCard: { backgroundColor: theme.surface, margin: 20, marginTop: 24, borderRadius: 24, padding: 24, ...SHADOWS.medium },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '700', color: theme.textSecondary, marginBottom: 10 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: theme.border },
  inputBoxError: { borderColor: COLORS.expense },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: SIZES.base, color: theme.text, fontWeight: '500' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { fontSize: SIZES.sm, color: COLORS.expense, fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 18, marginTop: 24, gap: 10, ...SHADOWS.medium },
  submitText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  backLinkText: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
  successCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 8 },
  successSub: { fontSize: SIZES.md, color: theme.textSecondary, marginBottom: 20 },
  otpBox: { backgroundColor: COLORS.primary + '12', borderRadius: 16, paddingHorizontal: 40, paddingVertical: 20, borderWidth: 2, borderColor: COLORS.primary + '40', marginBottom: 12 },
  otpText: { fontSize: 40, fontWeight: '900', color: COLORS.primary, letterSpacing: 10 },
  expiryNote: { fontSize: SIZES.sm, color: theme.textSecondary, marginBottom: 28 },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 28, gap: 10, width: '100%', ...SHADOWS.medium },
  continueBtnText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
});

export default ForgotPasswordScreen;
