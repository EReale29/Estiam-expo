import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { isValidEmail, isValidName, isValidPassword } from '@/utils/validation';
import { useI18n } from '@/contexts/i18n-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading, refreshAuth, isAuthenticated } = useAuth();
  const { t } = useI18n();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
    if (!isLoginMode && !isValidName(name)) {
      Alert.alert(t('auth.invalidName'));
      return;
    }

    try {
      if (isLoginMode) {
        await login({ email, password });
      } else {
        await register({ email, password, name });
      }
      await refreshAuth();
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('general.error');
      Alert.alert('Erreur', errorMessage, [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isLoginMode ? t('auth.loginTitle') : t('auth.registerTitle')}</Text>
          </LinearGradient>
          <View style={styles.form}>
            {!isLoginMode && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={24} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.name')}
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email')}
                placeholderTextColor="#9ca3af"
                value={email}
                keyboardType="email-address"
                onChangeText={setEmail}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View>
              <Ionicons name="lock-closed-outline" size={24} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password')}
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} disabled={isLoading}>
              <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.submitButtonGradient}>
                <Text style={styles.submitButtonText}>{isLoading ? t('general.loading') : isLoginMode ? t('auth.loginCta') : t('auth.registerCta')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.switchModeButton} disabled={isLoading}>
              <Text style={styles.switchModeText}>{isLoginMode ? t('auth.switchToRegister') : t('auth.switchToLogin')}</Text>
            </TouchableOpacity>

            {isLoginMode && (
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgot')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  form: {
    padding: 24,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 12,
    top: 12,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchModeText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
