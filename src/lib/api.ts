import { ApiError } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        detail: 'An unknown error occurred',
        status_code: response.status,
      }));
      throw new Error(error.detail || 'Request failed');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Token management
  setTokens(access_token: string, refresh_token: string): void {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    register: (data: { email: string; password: string; username?: string }) =>
      apiClient.post('/auth/register', data),
    refresh: (refresh_token: string) =>
      apiClient.post('/auth/refresh', { refresh_token }),
    logout: () =>
      apiClient.post('/auth/logout', {}),
    me: () =>
      apiClient.get('/auth/me'),
  },

  // Articles endpoints
  articles: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/articles', params),
    get: (id: string) =>
      apiClient.get(`/articles/${id}`),
    create: (data: unknown) =>
      apiClient.post('/articles', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/articles/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/articles/${id}`),
    like: (id: string) =>
      apiClient.post(`/articles/${id}/like`, {}),
    unlike: (id: string) =>
      apiClient.delete(`/articles/${id}/like`),
  },

  // Comments endpoints
  comments: {
    list: (articleId: string, params?: Record<string, string>) =>
      apiClient.get(`/articles/${articleId}/comments`, params),
    create: (data: unknown) =>
      apiClient.post('/comments', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/comments/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/comments/${id}`),
  },

  // Categories endpoints
  categories: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/categories', params),
    get: (id: string) =>
      apiClient.get(`/categories/${id}`),
    create: (data: unknown) =>
      apiClient.post('/categories', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/categories/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/categories/${id}`),
  },

  // Tags endpoints
  tags: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/tags', params),
    get: (id: string) =>
      apiClient.get(`/tags/${id}`),
    create: (data: unknown) =>
      apiClient.post('/tags', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/tags/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/tags/${id}`),
  },

  // Bookmarks endpoints
  bookmarks: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/bookmarks', params),
    add: (articleId: string) =>
      apiClient.post(`/bookmarks/${articleId}`, {}),
    remove: (articleId: string) =>
      apiClient.delete(`/bookmarks/${articleId}`),
    check: (articleId: string) =>
      apiClient.get(`/bookmarks/check/${articleId}`),
  },

  // Follows endpoints
  follows: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/follows', params),
    follow: (userId: string) =>
      apiClient.post(`/follows/${userId}`, {}),
    unfollow: (userId: string) =>
      apiClient.delete(`/follows/${userId}`),
    check: (userId: string) =>
      apiClient.get(`/follows/check/${userId}`),
  },

  // Stats endpoints
  stats: {
    dashboard: () =>
      apiClient.get('/stats/dashboard'),
  },
};
