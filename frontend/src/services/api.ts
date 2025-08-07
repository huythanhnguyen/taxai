import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginRequest, RegisterRequest, LoginResponse, RegisterResponse, User } from '../types/user';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      withCredentials: true, // For cookies
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshResponse = await this.api.post('/auth/refresh-token');
            const newToken = refreshResponse.data.data.accessToken;
            
            localStorage.setItem('accessToken', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    
    // Store access token
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await this.api.get('/auth/me');
    return response.data.data.user;
  }

  async verifyEmail(token: string): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await this.api.post('/auth/verify-email', { token });
    return response.data.data.user;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
      await this.api.post('/auth/forgot-password', { email });
    return response.data.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await this.api.post('/auth/reset-password', { token, newPassword });
    return response.data.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
      await this.api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data.data;
  }

  // User profile endpoints
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await this.api.put('/users/profile', updates);
    return response.data.data.user;
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
      await this.api.delete('/users/account');
    return response.data.data;
  }

  // Tax form endpoints
  async getTaxForms(page = 1, limit = 20): Promise<any> {
    const response = await this.api.get(`/tax-forms?page=${page}&limit=${limit}`);
    return response.data.data;
  }

  async createTaxForm(formData: any): Promise<any> {
    const response = await this.api.post('/tax-forms', formData);
    return response.data.data;
  }

  async getTaxForm(id: string): Promise<any> {
    const response = await this.api.get(`/tax-forms/${id}`);
    return response.data.data;
  }

  async updateTaxForm(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/tax-forms/${id}`, updates);
    return response.data.data;
  }

  async deleteTaxForm(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/tax-forms/${id}`);
    return response.data.data;
  }

  async submitTaxForm(id: string): Promise<any> {
    const response = await this.api.post(`/tax-forms/${id}/submit`);
    return response.data.data;
  }

  async getFormTemplates(type?: string): Promise<any> {
    const url = type ? `/tax-forms/templates?type=${type}` : '/tax-forms/templates';
    const response = await this.api.get(url);
    return response.data.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  clearAuthToken(): void {
    localStorage.removeItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService; 