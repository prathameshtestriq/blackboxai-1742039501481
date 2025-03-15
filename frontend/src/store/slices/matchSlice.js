import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchAllMatches = createAsyncThunk(
  'matches/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/matches', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchUpcomingMatches = createAsyncThunk(
  'matches/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/matches/upcoming');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchLiveMatches = createAsyncThunk(
  'matches/fetchLive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/matches/live');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchCompletedMatches = createAsyncThunk(
  'matches/fetchCompleted',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/matches/completed', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchMatchDetails = createAsyncThunk(
  'matches/fetchDetails',
  async (matchId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/matches/${matchId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  allMatches: {
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
  },
  upcomingMatches: {
    data: [],
    isLoading: false,
    error: null,
  },
  liveMatches: {
    data: [],
    isLoading: false,
    error: null,
  },
  completedMatches: {
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
  },
  selectedMatch: {
    data: null,
    isLoading: false,
    error: null,
  },
  filters: {
    status: null,
    format: null,
    team: null,
  },
};

// Slice
const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearMatchErrors: (state) => {
      state.allMatches.error = null;
      state.upcomingMatches.error = null;
      state.liveMatches.error = null;
      state.completedMatches.error = null;
      state.selectedMatch.error = null;
    },
    updateLiveMatchScore: (state, action) => {
      const { matchId, scores } = action.payload;
      // Update in live matches
      const liveMatchIndex = state.liveMatches.data.findIndex(
        match => match._id === matchId
      );
      if (liveMatchIndex !== -1) {
        state.liveMatches.data[liveMatchIndex].scores = scores;
      }
      // Update in all matches if present
      const allMatchIndex = state.allMatches.data.findIndex(
        match => match._id === matchId
      );
      if (allMatchIndex !== -1) {
        state.allMatches.data[allMatchIndex].scores = scores;
      }
      // Update selected match if it's the same match
      if (state.selectedMatch.data?._id === matchId) {
        state.selectedMatch.data.scores = scores;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Matches
      .addCase(fetchAllMatches.pending, (state) => {
        state.allMatches.isLoading = true;
        state.allMatches.error = null;
      })
      .addCase(fetchAllMatches.fulfilled, (state, action) => {
        state.allMatches.isLoading = false;
        state.allMatches.data = action.payload.data;
        state.allMatches.pagination = action.payload.pagination;
      })
      .addCase(fetchAllMatches.rejected, (state, action) => {
        state.allMatches.isLoading = false;
        state.allMatches.error = action.payload?.message || 'Failed to fetch matches';
      })

      // Fetch Upcoming Matches
      .addCase(fetchUpcomingMatches.pending, (state) => {
        state.upcomingMatches.isLoading = true;
        state.upcomingMatches.error = null;
      })
      .addCase(fetchUpcomingMatches.fulfilled, (state, action) => {
        state.upcomingMatches.isLoading = false;
        state.upcomingMatches.data = action.payload.data;
      })
      .addCase(fetchUpcomingMatches.rejected, (state, action) => {
        state.upcomingMatches.isLoading = false;
        state.upcomingMatches.error = action.payload?.message || 'Failed to fetch upcoming matches';
      })

      // Fetch Live Matches
      .addCase(fetchLiveMatches.pending, (state) => {
        state.liveMatches.isLoading = true;
        state.liveMatches.error = null;
      })
      .addCase(fetchLiveMatches.fulfilled, (state, action) => {
        state.liveMatches.isLoading = false;
        state.liveMatches.data = action.payload.data;
      })
      .addCase(fetchLiveMatches.rejected, (state, action) => {
        state.liveMatches.isLoading = false;
        state.liveMatches.error = action.payload?.message || 'Failed to fetch live matches';
      })

      // Fetch Completed Matches
      .addCase(fetchCompletedMatches.pending, (state) => {
        state.completedMatches.isLoading = true;
        state.completedMatches.error = null;
      })
      .addCase(fetchCompletedMatches.fulfilled, (state, action) => {
        state.completedMatches.isLoading = false;
        state.completedMatches.data = action.payload.data;
        state.completedMatches.pagination = action.payload.pagination;
      })
      .addCase(fetchCompletedMatches.rejected, (state, action) => {
        state.completedMatches.isLoading = false;
        state.completedMatches.error = action.payload?.message || 'Failed to fetch completed matches';
      })

      // Fetch Match Details
      .addCase(fetchMatchDetails.pending, (state) => {
        state.selectedMatch.isLoading = true;
        state.selectedMatch.error = null;
      })
      .addCase(fetchMatchDetails.fulfilled, (state, action) => {
        state.selectedMatch.isLoading = false;
        state.selectedMatch.data = action.payload.data;
      })
      .addCase(fetchMatchDetails.rejected, (state, action) => {
        state.selectedMatch.isLoading = false;
        state.selectedMatch.error = action.payload?.message || 'Failed to fetch match details';
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearMatchErrors,
  updateLiveMatchScore,
} = matchSlice.actions;

export default matchSlice.reducer;
