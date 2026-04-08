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

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { t } = useLanguage();
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
    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMin6'));
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
              placeholder={t('passwordMin')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: SIZES.paddingLg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: 16,
    marginBottom: 14,
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
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
