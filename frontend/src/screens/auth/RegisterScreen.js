import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const validatePassword = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character.';
  const weak = ['password', '12345678', 'qwerty123', 'letmein1'];
  if (weak.some((w) => pw.toLowerCase().includes(w))) return 'Password is too common. Please choose a stronger one.';
  return null;
};

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert(t('error'), t('usernameMin'));
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      Alert.alert(t('error'), pwError);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsNoMatch'));
      return;
    }
    if (pin && pin.length !== 4) {
      Alert.alert(t('error'), t('pinExact4'));
      return;
    }

    setLoading(true);
    try {
      const data = {
        username: username.trim(),
        email: email.trim(),
        password,
      };
      if (pin) data.pin = pin;
      await register(data);
    } catch (error) {
      Alert.alert(t('registrationFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('createAccount')}</Text>
          <Text style={styles.subtitle}>{t('startTracking')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('username')}
              placeholderTextColor={COLORS.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('emailAddress')}
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password (8+ chars, A-Z, 0-9, special)"
              placeholderTextColor={COLORS.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.pwHint}>Min 8 chars · uppercase · number · special char</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('confirmPassword')}
              placeholderTextColor={COLORS.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="keypad-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('pinOptional')}
              placeholderTextColor={COLORS.placeholder}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>{t('createAccount')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>{t('signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  backButton: { position: 'absolute', top: 56, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: SIZES.base, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
  form: { flex: 1, backgroundColor: theme.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: SIZES.paddingLg, paddingTop: 40 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: SIZES.borderRadiusLg, paddingHorizontal: 20, marginBottom: 16, height: 60 },
  inputIcon: { marginRight: 16 },
  input: { flex: 1, fontSize: SIZES.base, fontWeight: '600', color: theme.text },
  pwHint: { fontSize: SIZES.xs, color: theme.textLight, marginBottom: 12, marginTop: -8, paddingHorizontal: 4 },
  registerButton: { backgroundColor: COLORS.primary, borderRadius: SIZES.borderRadiusLg, height: 60, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 24, ...SHADOWS.medium },
  registerButtonText: { color: '#FFFFFF', fontSize: SIZES.lg, fontWeight: '800' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40 },
  loginText: { color: theme.textSecondary, fontSize: SIZES.md, fontWeight: '500' },
  loginLink: { color: COLORS.primary, fontSize: SIZES.md, fontWeight: '800', marginLeft: 6 },
});

export default RegisterScreen;
