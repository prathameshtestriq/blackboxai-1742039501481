import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const submitKYC = createAsyncThunk(
  'user/submitKYC',
  async (kycData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/kyc', kycData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getKYCStatus = createAsyncThunk(
  'user/getKYCStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/kyc');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getReferralCode = createAsyncThunk(
  'user/getReferralCode',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/referral');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const submitReferral = createAsyncThunk(
  'user/submitReferral',
  async (referralCode, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/referral', { referralCode });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getSettings = createAsyncThunk(
  'user/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/settings');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/settings', settingsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  profile: {
    data: null,
    isLoading: false,
    error: null,
  },
  portfolio: {
    data: null,
    isLoading: false,
    error: null,
  },
  kyc: {
    status: null,
    documents: null,
    isLoading: false,
    error: null,
  },
  referral: {
    code: null,
    count: 0,
    isLoading: false,
    error: null,
  },
  settings: {
    data: null,
    isLoading: false,
    error: null,
  },
  notifications: {
    unread: 0,
    data: [],
  },
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserErrors: (state) => {
      state.profile.error = null;
      state.portfolio.error = null;
      state.kyc.error = null;
      state.referral.error = null;
      state.settings.error = null;
    },
    updateNotificationCount: (state, action) => {
      state.notifications.unread = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.data.unshift(action.payload);
      state.notifications.unread += 1;
    },
    clearNotifications: (state) => {
      state.notifications.unread = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.profile.isLoading = true;
        state.profile.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile.isLoading = false;
        state.profile.data = action.payload.data.user;
        state.portfolio.data = action.payload.data.portfolio;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profile.isLoading = false;
        state.profile.error = action.payload?.message || 'Failed to fetch profile';
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.profile.isLoading = true;
        state.profile.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile.isLoading = false;
        state.profile.data = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profile.isLoading = false;
        state.profile.error = action.payload?.message || 'Failed to update profile';
      })

      // Submit KYC
      .addCase(submitKYC.pending, (state) => {
        state.kyc.isLoading = true;
        state.kyc.error = null;
      })
      .addCase(submitKYC.fulfilled, (state, action) => {
        state.kyc.isLoading = false;
        state.kyc.status = action.payload.data.kycStatus;
        state.kyc.documents = action.payload.data.kycDocuments;
      })
      .addCase(submitKYC.rejected, (state, action) => {
        state.kyc.isLoading = false;
        state.kyc.error = action.payload?.message || 'Failed to submit KYC';
      })

      // Get KYC Status
      .addCase(getKYCStatus.pending, (state) => {
        state.kyc.isLoading = true;
        state.kyc.error = null;
      })
      .addCase(getKYCStatus.fulfilled, (state, action) => {
        state.kyc.isLoading = false;
        state.kyc.status = action.payload.data.kycStatus;
        state.kyc.documents = action.payload.data.kycDocuments;
      })
      .addCase(getKYCStatus.rejected, (state, action) => {
        state.kyc.isLoading = false;
        state.kyc.error = action.payload?.message || 'Failed to get KYC status';
      })

      // Get Referral Code
      .addCase(getReferralCode.pending, (state) => {
        state.referral.isLoading = true;
        state.referral.error = null;
      })
      .addCase(getReferralCode.fulfilled, (state, action) => {
        state.referral.isLoading = false;
        state.referral.code = action.payload.data.referralCode;
        state.referral.count = action.payload.data.referralCount;
      })
      .addCase(getReferralCode.rejected, (state, action) => {
        state.referral.isLoading = false;
        state.referral.error = action.payload?.message || 'Failed to get referral code';
      })

      // Submit Referral
      .addCase(submitReferral.pending, (state) => {
        state.referral.isLoading = true;
        state.referral.error = null;
      })
      .addCase(submitReferral.fulfilled, (state) => {
        state.referral.isLoading = false;
      })
      .addCase(submitReferral.rejected, (state, action) => {
        state.referral.isLoading = false;
        state.referral.error = action.payload?.message || 'Failed to submit referral';
      })

      // Get Settings
      .addCase(getSettings.pending, (state) => {
        state.settings.isLoading = true;
        state.settings.error = null;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.settings.isLoading = false;
        state.settings.data = action.payload.data;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.settings.isLoading = false;
        state.settings.error = action.payload?.message || 'Failed to get settings';
      })

      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.settings.isLoading = true;
        state.settings.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings.isLoading = false;
        state.settings.data = action.payload.data;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.settings.isLoading = false;
        state.settings.error = action.payload?.message || 'Failed to update settings';
      });
  },
});

export const {
  clearUserErrors,
  updateNotificationCount,
  addNotification,
  clearNotifications,
} = userSlice.actions;

export default userSlice.reducer;
