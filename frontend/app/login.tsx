import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { isValidEmail, isValidPassword, isValidUsername } from '@/utils/validation';
import { useI18n } from '@/contexts/i18n-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading, refreshAuth, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isWide = width > 720;
  const formWidth = { width: '100%', maxWidth: isWide ? 520 : undefined, alignSelf: 'center' };

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      Alert.alert(t('auth.invalidEmail'));
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert(t('auth.invalidPassword'));
      return;
    }
    if (!isLoginMode && !isValidUsername(username)) {
      Alert.alert(t('auth.invalidUsername'));
      return;
    }

    try {
      if (isLoginMode) {
        await login({ email, password });
      } else {
        await register({ email, password, username, name: username });
      }
      await refreshAuth();
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('general.error');
      Alert.alert('Erreur', errorMessage, [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <LinearGradient colors={palette.heroGradient} style={[styles.header, { shadowColor: palette.shadow }, formWidth]}>
            <Text style={[styles.headerTitle, { color: palette.text }]}>{t('auth.loginTitle')}</Text>
          </LinearGradient>
          <View style={styles.formWrapper}>
            <View style={[styles.form, { backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }, formWidth]}>
              {!isLoginMode && (
                <View style={[styles.inputContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <Ionicons name="person-outline" size={24} color={palette.icon} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: palette.text }]}
                    placeholder={t('auth.username')}
                    placeholderTextColor={palette.muted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              )}

              <View style={[styles.inputContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Ionicons name="mail-outline" size={24} color={palette.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: palette.text }]}
                  placeholder={t('auth.email')}
                  placeholderTextColor={palette.muted}
                  value={email}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View>
                <Ionicons name="lock-closed-outline" size={24} color={palette.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                  placeholder={t('auth.password')}
                  placeholderTextColor={palette.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  autoCapitalize="none"
                  editable={!isLoading}
                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={[styles.eyeButton, { backgroundColor: palette.tint }]}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={palette.background} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} disabled={isLoading}>
                <LinearGradient colors={palette.actionGradient} style={styles.submitButtonGradient}>
                  <Text style={[styles.submitButtonText, { color: palette.text }]}>{isLoading ? t('general.loading') : isLoginMode ? t('auth.loginCta') : t('auth.registerCta')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.switchModeButton} disabled={isLoading}>
                <Text style={[styles.switchModeText, { color: palette.tint }]}>{isLoginMode ? t('auth.switchToRegister') : t('auth.switchToLogin')}</Text>
              </TouchableOpacity>

              {isLoginMode && (
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={[styles.forgotPasswordText, { color: palette.muted }]}>{t('auth.forgot')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  formWrapper: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: 16,
    borderRadius: 20,
    marginTop: -20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
});
