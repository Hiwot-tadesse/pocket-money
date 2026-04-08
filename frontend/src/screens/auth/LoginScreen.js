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
import { COLORS, SIZES } from '../../constants/theme';

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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: SIZES.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  form: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SIZES.paddingLg,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
