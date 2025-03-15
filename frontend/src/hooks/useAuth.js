import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login as loginAction,
  logout as logoutAction,
  register as registerAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  updateProfile as updateProfileAction,
} from '../store/slices/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
  } = useSelector((state) => state.auth);

  // Login
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginAction(credentials)).unwrap();
      await AsyncStorage.setItem('token', result.token);
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Register
  const register = useCallback(async (userData) => {
    try {
      const result = await dispatch(registerAction(userData)).unwrap();
      await AsyncStorage.setItem('token', result.token);
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutAction()).unwrap();
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token and user data even if API call fails
      await AsyncStorage.removeItem('token');
    }
  }, [dispatch]);

  // Forgot Password
  const forgotPassword = useCallback(async (email) => {
    try {
      const result = await dispatch(forgotPasswordAction(email)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Reset Password
  const resetPassword = useCallback(async (data) => {
    try {
      const result = await dispatch(resetPasswordAction(data)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Update Profile
  const updateProfile = useCallback(async (data) => {
    try {
      const result = await dispatch(updateProfileAction(data)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  }, []);

  // Get stored token
  const getToken = useCallback(async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }, []);

  // Clear auth error
  const clearError = useCallback(() => {
    dispatch({ type: 'auth/clearError' });
  }, [dispatch]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    checkAuth,
    getToken,
    clearError,
  };
};

// Custom hook for protected routes
export const useProtectedRoute = (navigation) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.replace('Login');
    }
  }, [isAuthenticated, isLoading, navigation]);

  return { isLoading };
};

// Custom hook for auth routes (login, register, etc.)
export const useAuthRoute = (navigation) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigation.replace('MainApp');
    }
  }, [isAuthenticated, isLoading, navigation]);

  return { isLoading };
};

export default useAuth;
