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
      // Try to get error details from JSON response
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {
        // Not JSON, try to get text
        try {
          const textError = await response.text();
          if (textError) {
            errorDetail = `${errorDetail}: ${textError.substring(0, 200)}`;
          }
        } catch {
          // Use default error message
        }
      }
      throw new Error(errorDetail);
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
      // Provide more detailed error information for debugging
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network Error Details:', {
          url,
          config,
          baseURL: this.baseURL,
          endpoint,
          errorMessage: 'CORS issue, backend not running, or network unreachable',
        });
        throw new Error(`Network error: Cannot connect to backend at ${this.baseURL}. Please ensure the backend server is running and CORS is configured correctly.`);
      }
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

  async post<T>(endpoint: string, data?: unknown, params?: Record<string, string>): Promise<T> {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
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

// Export ApiClient class for testing
export { ApiClient };

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
    changePassword: (data: { old_password: string; new_password: string }) =>
      apiClient.post('/auth/change-password', data),
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, new_password: string) =>
      apiClient.post('/auth/reset-password', { token, new_password }),
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

  // Notifications endpoints
  notifications: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/notifications', params),
    markAsRead: (notificationId: string) =>
      apiClient.post(`/notifications/${notificationId}/read`),
    markAllAsRead: () =>
      apiClient.post('/notifications/read-all'),
    delete: (notificationId: string) =>
      apiClient.delete(`/notifications/${notificationId}`),
    deleteAllRead: () =>
      apiClient.delete('/notifications'),
    unreadCount: () =>
      apiClient.get('/notifications/unread-count'),
  },

  // Upload endpoints
  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      }).then(res => res.json());
    },
    avatar: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`${API_BASE_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      }).then(res => res.json());
    },
    deleteAvatar: () => {
      return apiClient.delete('/upload/avatar');
    },
  },

  // Papers endpoints
  papers: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/papers', params),
    topics: () =>
      apiClient.get('/papers/topics'),
    topicStats: () =>
      apiClient.get('/papers/topics/stats'),
    topicCatalog: () =>
      apiClient.get('/papers/topics/catalog'),
    topicTree: () =>
      apiClient.get('/papers/topics/tree'),
    get: (id: string) =>
      apiClient.get(`/papers/${id}`),
    create: (data: { arxiv_id: string }) =>
      apiClient.post('/papers', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/papers/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/papers/${id}`),
    view: (id: string) =>
      apiClient.post(`/papers/${id}/view`, {}),
  },

  // Paper Files endpoints
  paperFiles: {
    download: (paperId: string) =>
      apiClient.post(`/paper-files/${paperId}/download`, {}),
    getStatus: (paperId: string) =>
      apiClient.get(`/paper-files/${paperId}/file-status`),
    delete: (paperId: string) =>
      apiClient.delete(`/paper-files/${paperId}/file`),
    list: (params?: Record<string, string>) =>
      apiClient.get('/paper-files/downloaded', params),
  },

  // Reading Progress endpoints
  readingProgress: {
    get: (paperId: string) =>
      apiClient.get(`/reading-progress/${paperId}`),
    update: (paperId: string, data: unknown) =>
      apiClient.put(`/reading-progress/${paperId}`, data),
    markAsRead: (paperId: string) =>
      apiClient.post(`/reading-progress/${paperId}/mark-read`, {}),
    markAsReading: (paperId: string) =>
      apiClient.post(`/reading-progress/${paperId}/mark-reading`, {}),
    list: (params?: Record<string, string>) =>
      apiClient.get('/reading-progress', params),
    statistics: () =>
      apiClient.get('/reading-progress/statistics'),
  },

  // Paper Collections endpoints
  collections: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/collections', params),
    get: (id: string) =>
      apiClient.get(`/collections/${id}`),
    create: (data: unknown) =>
      apiClient.post('/collections', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/collections/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/collections/${id}`),
    addPaper: (id: string, data: unknown) =>
      apiClient.post(`/collections/${id}/papers`, data),
    removePaper: (id: string, paperId: string) =>
      apiClient.delete(`/collections/${id}/papers/${paperId}`),
    getPaperCollections: (paperId: string) =>
      apiClient.get(`/collections/papers/${paperId}/collections`),
  },

  // Paper Ratings endpoints
  ratings: {
    getPaperRatings: (paperId: string, params?: Record<string, string>) =>
      apiClient.get(`/ratings/papers/${paperId}/ratings`, params),
    getStats: (paperId: string) =>
      apiClient.get(`/ratings/papers/${paperId}/ratings/stats`),
    createOrUpdate: (paperId: string, data: unknown) =>
      apiClient.post(`/ratings/papers/${paperId}/ratings`, data),
    update: (paperId: string, data: unknown) =>
      apiClient.put(`/ratings/papers/${paperId}/ratings`, data),
    delete: (paperId: string) =>
      apiClient.delete(`/ratings/papers/${paperId}/ratings`),
    getMyRatings: (params?: Record<string, string>) =>
      apiClient.get('/ratings/users/me/ratings', params),
    getTopRated: (params?: Record<string, string>) =>
      apiClient.get('/ratings/ratings/top', params),
  },

  // Paper Search endpoints
  search: {
    search: (params?: Record<string, string>) =>
      apiClient.get('/search/search', params),
    getCategories: () =>
      apiClient.get('/search/categories'),
    getSuggestions: (q: string, params?: Record<string, string>) =>
      apiClient.get('/search/search/suggestions', { q, ...params }),
    batchSearch: (arxivIds: string[]) =>
      apiClient.post('/search/batch-search', arxivIds),
  },

  // Paper Citations endpoints
  citations: {
    getPaperCitations: (paperId: string) =>
      apiClient.get(`/citations/papers/${paperId}/citations`),
    getStats: (paperId: string) =>
      apiClient.get(`/citations/papers/${paperId}/citations/stats`),
    updateCount: (paperId: string, data: unknown) =>
      apiClient.put(`/citations/papers/${paperId}/citations`, data),
    getReferences: (paperId: string) =>
      apiClient.get(`/citations/papers/${paperId}/references`),
    addReference: (paperId: string, data: unknown) =>
      apiClient.post(`/citations/papers/${paperId}/references`, data),
    batchAddReferences: (paperId: string, references: unknown[]) =>
      apiClient.post(`/citations/papers/${paperId}/references/batch`, references),
    getCitedBy: (paperId: string, params?: Record<string, string>) =>
      apiClient.get(`/citations/papers/${paperId}/cited-by`, params),
    getMostCited: (params?: Record<string, string>) =>
      apiClient.get('/citations/citations/top', params),
    fetchFromAPI: (paperId: string) =>
      apiClient.post(`/citations/papers/${paperId}/citations/fetch`),
  },

  // Paper Discussions endpoints
  discussions: {
    getPaperDiscussions: (paperId: string, params?: Record<string, string>) =>
      apiClient.get(`/discussions/papers/${paperId}/discussions`, params),
    getReplies: (discussionId: string, params?: Record<string, string>) =>
      apiClient.get(`/discussions/discussions/${discussionId}/replies`, params),
    create: (paperId: string, data: unknown) =>
      apiClient.post(`/discussions/papers/${paperId}/discussions`, data),
    update: (discussionId: string, data: unknown) =>
      apiClient.put(`/discussions/discussions/${discussionId}`, data),
    delete: (discussionId: string) =>
      apiClient.delete(`/discussions/discussions/${discussionId}`),
    togglePin: (discussionId: string) =>
      apiClient.post(`/discussions/discussions/${discussionId}/pin`),
    vote: (discussionId: string, data: unknown) =>
      apiClient.post(`/discussions/discussions/${discussionId}/vote`, data),
  },

  // Paper Notes endpoints
  notes: {
    getPaperNotes: (paperId: string, params?: Record<string, string>) =>
      apiClient.get(`/discussions/papers/${paperId}/notes`, params),
    getPublicNotes: (paperId: string, params?: Record<string, string>) =>
      apiClient.get(`/discussions/papers/${paperId}/notes/public`, params),
    getMyNotes: (params?: Record<string, string>) =>
      apiClient.get('/discussions/users/me/notes', params),
    create: (paperId: string, data: unknown) =>
      apiClient.post(`/discussions/papers/${paperId}/notes`, data),
    update: (noteId: string, data: unknown) =>
      apiClient.put(`/discussions/notes/${noteId}`, data),
    delete: (noteId: string) =>
      apiClient.delete(`/discussions/notes/${noteId}`),
  },

  // RSS endpoints
  rss: {
    getPapers: (params?: Record<string, string>) =>
      `${API_BASE_URL}/rss/papers${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    getArticles: (params?: Record<string, string>) =>
      `${API_BASE_URL}/rss/articles${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    getPaperFeed: (paperId: string) =>
      `${API_BASE_URL}/rss/papers/${paperId}`,
    listFeeds: () =>
      apiClient.get('/rss/feeds'),
  },

  // arXiv endpoints (subscriptions / recommendations)
  arxiv: {
    categories: () =>
      apiClient.get('/arxiv/categories'),
    teams: () =>
      apiClient.get('/arxiv/teams'),
    subscriptions: {
      list: () =>
        apiClient.get('/arxiv/subscriptions'),
      create: (data: { subscription_type: "category" | "query" | "team"; value: string; is_active?: boolean; notify?: boolean }) =>
        apiClient.post('/arxiv/subscriptions', data),
      delete: (id: string) =>
        apiClient.delete(`/arxiv/subscriptions/${id}`),
      sync: (refreshMaxResults: number = 25) =>
        apiClient.post(`/arxiv/subscriptions/sync?refresh_max_results=${refreshMaxResults}`, {}),
    },
    recommendations: (params?: Record<string, string>) =>
      apiClient.get('/arxiv/recommendations', params),
  },

  // Users endpoints
  users: {
    getMe: () =>
      apiClient.get('/users/me'),
    updateMe: (data: unknown) =>
      apiClient.patch('/users/me', data),
    getUser: (id: string) =>
      apiClient.get(`/users/${id}`),
    updateUser: (id: string, data: unknown) =>
      apiClient.patch(`/users/${id}`, data),
    deleteUser: (id: string) =>
      apiClient.delete(`/users/${id}`),
  },

  // Reading List endpoints
  readingList: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/reading-list/', params),
    add: (data: { paper_id?: string; article_id?: string; notes?: string; priority?: string }) =>
      apiClient.post('/reading-list/', data),
    update: (itemId: string, data: unknown) =>
      apiClient.patch(`/reading-list/${itemId}`, data),
    remove: (itemId: string) =>
      apiClient.delete(`/reading-list/${itemId}`),
    clearRead: () =>
      apiClient.post('/reading-list/clear-read', {}),
    markAsRead: (itemId: string) =>
      apiClient.patch(`/reading-list/${itemId}`, { is_read: true }),
  },

  // AI Features endpoints
  ai: {
    generateSummary: (data: {
      content_type: 'paper' | 'article';
      content_id: string;
      summary_type?: string;
      language?: string;
      model?: string;
    }) =>
      apiClient.post('/ai/generate-summary', data),
    getSummary: (contentType: string, contentId: string) =>
      apiClient.get(`/ai/summary/${contentType}/${contentId}`),
    getSimilarPapers: (paperId: string, limit?: number) =>
      apiClient.post(`/ai/similar-papers/${paperId}`, { limit: limit || 5 }),
    submitFeedback: (data: {
      content_type: 'paper' | 'article';
      content_id: string;
      summary_id: string;
      helpful: boolean;
      feedback_type?: string;
    }) =>
      apiClient.post('/ai/summary-feedback', data),
    getPaperTypes: () =>
      apiClient.get('/ai/paper-types'),
    getModels: () =>
      apiClient.get('/ai/models'),
    getStats: () =>
      apiClient.get('/ai/summary-stats'),
    extractKeyPoints: (data: {
      content_type: 'paper' | 'article';
      content_id: string;
      max_points?: number;
      model?: string;
    }) =>
      apiClient.post('/ai/extract-key-points', data),
    translate: (data: {
      content_id: string;
      content_type: 'paper' | 'article';
      field?: string;
      model?: string;
    }) =>
      apiClient.post('/ai/translate', data),
  },

  // Citation Export endpoints
  citationExport: {
    getFormats: () =>
      apiClient.get('/citations/formats'),
    export: (data: { paper_ids: string[]; format: string }) =>
      apiClient.post('/citations/export', data),
    getPaperCitation: (paperId: string, format: string) =>
      apiClient.get(`/citations/paper/${paperId}`, { format }),
  },

  // Social Share endpoints
  socialShare: {
    getTemplates: () =>
      apiClient.get('/share/templates'),
    generateShare: (data: { content_type: string; content_id: string; platform: string; custom_message?: string }) =>
      apiClient.post('/share/share', data),
    generatePreview: (data: { content_type: string; content_id: string; platform: string }) =>
      apiClient.post('/share/generate-preview', data),
    getStats: (contentType: string, contentId: string) =>
      apiClient.get(`/share/stats/${contentType}/${contentId}`),
  },

  // Study Groups endpoints
  studyGroups: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/study-groups/', params),
    create: (data: unknown) =>
      apiClient.post('/study-groups/', data),
    get: (id: string) =>
      apiClient.get(`/study-groups/${id}`),
    update: (id: string, data: unknown) =>
      apiClient.put(`/study-groups/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/study-groups/${id}`),
    join: (id: string) =>
      apiClient.post(`/study-groups/${id}/join`, {}),
    leave: (id: string) =>
      apiClient.post(`/study-groups/${id}/leave`, {}),
    getMembers: (id: string) =>
      apiClient.get(`/study-groups/${id}/members`),
  },

  // Annotations endpoints
  annotations: {
    list: (contentType: string, contentId: string) =>
      apiClient.get(`/annotations/${contentType}/${contentId}`),
    create: (data: unknown) =>
      apiClient.post('/annotations/', data),
    update: (id: string, data: unknown) =>
      apiClient.put(`/annotations/${id}`, data),
    delete: (id: string) =>
      apiClient.delete(`/annotations/${id}`),
  },

  // Search History endpoints
  searchHistory: {
    list: (params?: Record<string, string>) =>
      apiClient.get('/search/history', params),
    getPopular: (limit?: number) =>
      apiClient.get('/search/popular', { limit: String(limit || 10) }),
    clear: () =>
      apiClient.delete('/search/history'),
  },

  // Saved Searches endpoints
  savedSearches: {
    list: () =>
      apiClient.get('/search/saved'),
    save: (data: { name: string; query: string; filters: Record<string, unknown> }) =>
      apiClient.post('/search/saved', data),
    delete: (id: string) =>
      apiClient.delete(`/search/saved/${id}`),
  },

  // Reading Stats endpoints
  readingStats: {
    getStats: () =>
      apiClient.get('/reading/stats'),
    getSessions: (params?: Record<string, string>) =>
      apiClient.get('/reading/sessions', params),
  },

  // Classic Papers endpoints
  classicPapers: {
    getCollections: () =>
      apiClient.get('/classic-papers/collections'),
    getCollection: (collectionId: string) =>
      apiClient.get(`/classic-papers/collections/${collectionId}`),
    getStats: () =>
      apiClient.get('/classic-papers/stats'),
    createCollection: (data: { title: string; description: string; icon?: string; color?: string }) =>
      apiClient.post('/classic-papers/collections', data),
    addPaper: (collectionId: string, data: {
      title: string;
      description: string;
      authors: string;
      year: number;
      venue: string;
      paper_url?: string;
      code_url?: string;
      tags: string[];
    }) =>
      apiClient.post(`/classic-papers/collections/${collectionId}/papers`, data),
  },

  // Daily Papers endpoints
  daily: {
    getTopics: () =>
      apiClient.get('/daily/topics'),
    getPapers: (topic: string, params?: { days?: string; limit?: string }) =>
      apiClient.get(`/daily/papers/${topic}`, params),
    analyze: (data: { paper_id: string; analysis_type?: string }) =>
      apiClient.post('/daily/analyze', data),
    saveAnalysisToNote: (data: { paper_id: string; analysis: any; note_title?: string }) =>
      apiClient.post('/daily/save-analysis-to-note', data),
    triggerUpdate: () =>
      apiClient.post('/daily/update'),
    getStats: () =>
      apiClient.get('/daily/stats'),
    getDigestTeams: () =>
      apiClient.get('/daily/digest/teams'),
    getTeamDigest: (teamId: string, params?: { days?: string; limit?: string; refresh?: string }) =>
      apiClient.get(`/daily/digest/team/${teamId}`, params),
  },

  // AI Reading Assistant endpoints
  readingAssistant: {
    explainText: (data: { paper_id: string; text: string; context?: string }) =>
      apiClient.post('/reading-assistant/explain-text', data),
    summarizeSection: (data: { paper_id: string; section_text: string; section_title?: string }) =>
      apiClient.post('/reading-assistant/summarize-section', data),
    qaPaper: (data: { paper_id: string; question: string; conversation_history?: any[] }) =>
      apiClient.post('/reading-assistant/qa-paper', data),
  },

  // AI Scoring endpoints
  aiScoring: {
    scorePaper: (data: { paper_id: string; model?: string }) =>
      apiClient.post('/ai-scoring/score-paper', data),
    batchScore: (data: { paper_ids: string[]; model?: string }) =>
      apiClient.post('/ai-scoring/batch-score', data),
    comparePapers: (data: { paper_ids: string[]; model?: string }) =>
      apiClient.post('/ai-scoring/compare-papers', data),
    getRecommendations: (data: { limit?: number; days?: number; model?: string }) =>
      apiClient.post('/ai-scoring/recommendations', data),
    getTopPapers: (params?: { limit?: number; category?: string; days?: number }) =>
      apiClient.get('/ai-scoring/top-papers', params),
    getMyScores: () =>
      apiClient.get('/ai-scoring/my-scores'),
  },

  // AI Q&A endpoints
  aiQa: {
    askQuestion: (data: { paper_id: string; question: string; conversation_history?: any[]; model?: string }) =>
      apiClient.post('/ai-qa/ask', data),
    explainConcept: (data: { concept: string; paper_id?: string; detail_level?: string; model?: string }) =>
      apiClient.post('/ai-qa/explain-concept', data),
    getQuestionSuggestions: (paperId: string, count?: number) =>
      apiClient.get(`/ai-qa/suggestions/${paperId}`, count ? { count: String(count) } : undefined),
    analyzeMethodology: (data: { paper_id: string; model?: string }) =>
      apiClient.post('/ai-qa/analyze-methodology', data),
    getQuickQuestions: (topic?: string) =>
      apiClient.get('/ai-qa/quick-questions', topic ? { topic } : undefined),
    chat: (data: { message: string; paper_id?: string; conversation_id?: string }) =>
      apiClient.post('/ai-qa/chat', data),
    getPopularQuestions: (limit?: number) =>
      apiClient.get('/ai-qa/popular-questions', limit ? { limit: String(limit) } : undefined),
  },

  // Terminology Knowledge Base endpoints
  terminology: {
    getTerm: (term: string) =>
      apiClient.get(`/terminology/terms/${term}`),
    searchTerms: (query: string, category?: string, limit?: number) =>
      apiClient.get('/terminology/terms', { q: query, ...(category && { category }), ...(limit && { limit: String(limit) }) }),
    getCategories: () =>
      apiClient.get('/terminology/categories'),
    getCategoryTerms: (category: string) =>
      apiClient.get(`/terminology/categories/${category}/terms`),
    explainPaperTerms: (data: { title: string; summary: string; full_text?: string }) =>
      apiClient.post('/terminology/terms/explain-paper', data),
    getSuggestions: (query: string, limit?: number) =>
      apiClient.get('/terminology/terms/suggestions', { q: query, ...(limit && { limit: String(limit) }) }),
    getStats: () =>
      apiClient.get('/terminology/stats'),
    getGlossary: (category?: string) =>
      apiClient.get('/terminology/glossary', category ? { category } : undefined),
  },

  // AI Auto-Tagging endpoints
  aiTagging: {
    generateTags: (data: { content_type: string; content_id: string; model?: string }) =>
      apiClient.post('/ai-tagging/generate', data),
    applyTags: (data: { content_type: string; content_id: string; tags: string[]; create_new_tags?: boolean }) =>
      apiClient.post('/ai-tagging/apply', data),
    batchGenerateTags: (data: { content_type: string; content_ids: string[]; model?: string }) =>
      apiClient.post('/ai-tagging/batch-generate', data),
    getTrendingTags: (params?: { limit?: number; days?: number }) =>
      apiClient.get('/ai-tagging/trending', params),
    suggestExistingTags: (query: string, limit?: number) =>
      apiClient.get('/ai-tagging/suggest-existing', { q: query, ...(limit && { limit: String(limit) }) }),
    autoTagNewContent: (contentType: string, limit?: number) =>
      apiClient.post('/ai-tagging/auto-tag-new', null, {
        params: {
          content_type: contentType,
          ...(limit && { limit: String(limit) })
        }
      }),
  },
};
