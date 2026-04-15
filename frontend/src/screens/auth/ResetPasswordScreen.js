import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState(route.params?.otp || '');
  const [email] = useState(route.params?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!otp.trim() || otp.length !== 6) { setError('Please enter the 6-digit reset code'); return; }
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: otp.trim(), newPassword });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.income} />
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successSub}>Your password has been updated successfully.</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in" size={20} color={COLORS.white} />
            <Text style={styles.loginBtnText}>Go to Login</Text>
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
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSub}>
            {email ? `Resetting password for\n${email}` : 'Enter your reset code and new password'}
          </Text>
        </View>

        <View style={styles.formCard}>

          {/* OTP field */}
          <Text style={styles.fieldLabel}>Reset Code</Text>
          <View style={[styles.inputBox, error && !otp && styles.inputBoxError]}>
            <Ionicons name="keypad-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="• • • • • •"
              placeholderTextColor={COLORS.placeholder}
              value={otp}
              onChangeText={(t) => { setOtp(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={!route.params?.otp}
            />
          </View>

          {/* New Password */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>New Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min. 6 characters"
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
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Confirm New Password</Text>
          <View style={[styles.inputBox, confirmPassword && newPassword !== confirmPassword && styles.inputBoxError]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Repeat new password"
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
                  <Text style={styles.submitText}>Reset Password</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.resendRow}
          >
            <Text style={styles.resendText}>Didn't get a code? </Text>
            <Text style={styles.resendLink}>Request again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: SIZES.paddingLg,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...SHADOWS.large,
  },
  backBtn: {
    position: 'absolute', top: 56, left: 24,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  headerSub: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  formCard: {
    backgroundColor: COLORS.white,
    margin: 20, marginTop: 24,
    borderRadius: 24, padding: 24,
    ...SHADOWS.medium,
  },
  fieldLabel: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: 14,
    paddingHorizontal: 16, height: 56,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  inputBoxError: { borderColor: COLORS.expense },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: SIZES.base, color: COLORS.text, fontWeight: '500' },
  otpInput: { fontSize: 22, fontWeight: '800', letterSpacing: 8, color: COLORS.primary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  errorText: { fontSize: SIZES.sm, color: COLORS.expense, fontWeight: '500', flex: 1 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 18, marginTop: 24, gap: 10, ...SHADOWS.medium,
  },
  submitText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '800' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  resendText: { color: COLORS.textSecondary, fontSize: SIZES.md },
  resendLink: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '700' },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.income + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  successSub: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 36, lineHeight: 24 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 40, gap: 10,
    width: '100%', ...SHADOWS.medium,
  },
  loginBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '800' },
});

export default ResetPasswordScreen;
