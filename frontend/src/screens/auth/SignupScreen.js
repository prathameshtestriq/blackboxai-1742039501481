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
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';
import { validateEmail, validatePassword, getPasswordStrengthMessage } from '../../utils/helpers';

const SignupScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    setFormErrors(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
      isValid = false;
    }

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!passwordValidation.isValid) {
      newErrors.password = getPasswordStrengthMessage(passwordValidation.errors).join(', ');
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(register(formData)).unwrap();
      // Navigation will be handled by the auth state change in App.js
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
        <View style={styles.content}>
          <Title style={styles.title}>Create Account</Title>
          <Text style={styles.subtitle}>
            Join the cricket stock trading community
          </Text>

          {error && (
            <HelperText type="error" style={styles.errorText}>
              {error}
            </HelperText>
          )}

          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            error={!!formErrors.fullName}
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />
          <HelperText type="error" visible={!!formErrors.fullName}>
            {formErrors.fullName}
          </HelperText>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!formErrors.email}
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />
          <HelperText type="error" visible={!!formErrors.email}>
            {formErrors.email}
          </HelperText>

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            secureTextEntry={!showPassword}
            error={!!formErrors.password}
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          <HelperText type="error" visible={!!formErrors.password}>
            {formErrors.password}
          </HelperText>

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            error={!!formErrors.confirmPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
          />
          <HelperText type="error" visible={!!formErrors.confirmPassword}>
            {formErrors.confirmPassword}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            style={styles.signupButton}
          >
            Sign Up
          </Button>

          <View style={styles.loginContainer}>
            <Text>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Login
              </Text>
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
  },
  input: {
    marginBottom: 5,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  signupButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontWeight: '600',
  },
});

export default SignupScreen;
