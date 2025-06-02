import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle error messages
const handleError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.message) return error.message;
  if (Array.isArray(error?.response?.data)) {
    return error.response.data.map((err: any) => err.msg).join(', ');
  }
  return 'An unknown error occurred';
};

// Helper function to convert object to form URL encoded
const objectToFormData = (obj: any) => {
  const params = new URLSearchParams();
  for (const key in obj) {
    params.append(key, obj[key]);
  }
  return params;
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Use URLSearchParams for login as FastAPI expects form data
      const params = objectToFormData({
        username: email,
        password: password
      });

      const response = await axios.post(`${API_URL}/api/v1/users/login`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { user, token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/users/register`, {
        name,
        email,
        password,
      });
      
      const { user, token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      
      if (!auth.token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(handleError(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Add these actions for compatibility with existing code
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      localStorage.removeItem('token');
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch current user
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload as string;
    });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;

export default authSlice.reducer;