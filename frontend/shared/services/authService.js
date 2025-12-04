// Shared Auth Service - Safe for both admin and parent portals
import { showToast } from '../components/Toast';

class AuthService {
  constructor(baseURL) {
    this.baseURL = baseURL || (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
  }

  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', data = null, requiresAuth = false } = options;
    
    const config = {
      method,
      headers: this.getHeaders(requiresAuth),
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🔐 AUTH API: ${method} ${url}`);

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        const error = new Error(responseData.error || responseData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      console.error(`❌ AUTH API Error: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Login (shared)
  async login(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        data: { email, password },
        requiresAuth: false
      });
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      showToast.success('Login successful!');
      return response;
    } catch (error) {
      showToast.error('Login failed', error.data?.message || error.message);
      throw error;
    }
  }

  // Logout (shared)
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST', requiresAuth: true });
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast.success('Logged out successfully');
    }
  }

  // Get current user (shared)
  async getCurrentUser() {
    try {
      const response = await this.request('/auth/me', { requiresAuth: true });
      return response.user || response;
    } catch (error) {
      console.warn('Failed to fetch current user:', error);
      return null;
    }
  }

  // Register (for parent portal)
  async register(userData) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        data: userData,
        requiresAuth: false
      });
      showToast.success('Registration successful!');
      return response;
    } catch (error) {
      showToast.error('Registration failed', error.data?.message || error.message);
      throw error;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
