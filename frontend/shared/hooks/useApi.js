import { useState, useCallback } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    const {
      method = 'GET',
      data = null,
      headers = {},
      showSuccessToast = false,
      successMessage = 'Operation successful',
      showErrorToast = true,
      requireAuth = true
    } = options;

    setLoading(true);
    setError(null);

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (requireAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
      
      console.log(`🌐 API Request: ${method} ${url}`, data || '');
      
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP ${response.status}`);
      }

      console.log(`✅ API Response: ${method} ${url}`, responseData);
      return { data: responseData, status: response.status };
    } catch (err) {
      console.error(`❌ API Error: ${method} ${endpoint}`, err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods
  const get = useCallback((endpoint, options = {}) => 
    request(endpoint, { ...options, method: 'GET' }), [request]);

  const post = useCallback((endpoint, data, options = {}) => 
    request(endpoint, { ...options, method: 'POST', data }), [request]);

  const put = useCallback((endpoint, data, options = {}) => 
    request(endpoint, { ...options, method: 'PUT', data }), [request]);

  const patch = useCallback((endpoint, data, options = {}) => 
    request(endpoint, { ...options, method: 'PATCH', data }), [request]);

  const del = useCallback((endpoint, options = {}) => 
    request(endpoint, { ...options, method: 'DELETE' }), [request]);

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    resetError: () => setError(null)
  };
};

export default useApi;
