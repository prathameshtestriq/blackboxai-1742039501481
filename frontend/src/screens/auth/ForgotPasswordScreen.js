import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Title,
  HelperText,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { validateEmail } from '../../utils/helpers';

const ForgotPasswordScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = () => {
    let isValid = true;

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(forgotPassword(email)).unwrap();
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by the reducer and displayed in the UI
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>

        <View style={styles.content}>
          {!isSubmitted ? (
            <>
              <Title style={styles.title}>Forgot Password?</Title>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your
                password
              </Text>

              {error && (
                <HelperText type="error" style={styles.errorText}>
                  {error}
                </HelperText>
              )}

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!emailError}
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitButton}
              >
                Send Reset Instructions
              </Button>
            </>
          ) : (
            <>
              <View style={styles.successContainer}>
                <IconButton
                  icon="email-check"
                  size={64}
                  color={theme.colors.primary}
                  style={styles.successIcon}
                />
                <Title style={styles.successTitle}>Check Your Email</Title>
                <Text style={styles.successText}>
                  We've sent password reset instructions to:
                </Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.instructionText}>
                  Please check your email and follow the instructions to reset your
                  password. The link will expire in 30 minutes.
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={styles.backToLoginButton}
              >
                Back to Login
              </Button>
            </>
          )}

          {!isSubmitted && (
            <View style={styles.footer}>
              <Text>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    paddingHorizontal: 20,
  },
  input: {
    marginBottom: 5,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  backToLoginButton: {
    marginTop: 20,
  },
});

export default ForgotPasswordScreen;
