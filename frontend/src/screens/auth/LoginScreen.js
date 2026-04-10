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

const LoginScreen = ({ navigation }) => {
  const { login, loginWithPin } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usePinLogin, setUsePinLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(t('error'), t('enterEmail'));
      return;
    }

    setLoading(true);
    try {
      if (usePinLogin) {
        if (!pin.trim() || pin.length !== 4) {
          Alert.alert(t('error'), t('enterValidPin'));
          setLoading(false);
          return;
        }
        await loginWithPin({ email: email.trim(), pin: pin.trim() });
      } else {
        if (!password.trim()) {
          Alert.alert(t('error'), t('enterPassword'));
          setLoading(false);
          return;
        }
        await login({ email: email.trim(), password });
      }
    } catch (error) {
      Alert.alert(t('loginFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.title}>{t('pocketMoney')}</Text>
          <Text style={styles.subtitle}>{t('trackFinances')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{t('welcomeBack')}</Text>

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

          {usePinLogin ? (
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('fourDigitPin')}
                placeholderTextColor={COLORS.placeholder}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('password')}
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
          )}

          <TouchableOpacity onPress={() => setUsePinLogin(!usePinLogin)}>
            <Text style={styles.switchText}>
              {usePinLogin ? t('usePasswordInstead') : t('usePinInstead')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>{t('signIn')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t('dontHaveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>{t('signUp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: SIZES.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadiusLg,
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    textAlign: 'right',
    marginBottom: 32,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusLg,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOWS.medium,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '800',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
    fontWeight: '500',
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '800',
    marginLeft: 6,
  },
});

export default LoginScreen;
