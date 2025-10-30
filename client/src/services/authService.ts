import { apiClient } from './apiClient';

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
    };
    token: string;
  };
}

interface UserEnvelopeResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
    };
  };
}

interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  async register(data: RegisterRequest) {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get<UserEnvelopeResponse>('/auth/me');
    return response.data.data.user;
  },

  async updateProfile(data: UpdateProfileRequest) {
    const response = await apiClient.put<UserEnvelopeResponse>('/auth/profile', data);
    return response.data.data.user;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      { currentPassword, newPassword }
    );
    return response.data;
  },
};