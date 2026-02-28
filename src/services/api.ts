import { api } from "@/lib/api";
import type {
  Article,
  ArticleInput,
  Comment,
  CommentInput,
  Like,
  Bookmark,
  Tag,
  Category,
  UserProfile,
  Notification,
} from "@/types";

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
    has_more: boolean;
  };
}

// Generic error handler
const handleApiError = (error: unknown): Error => {
  console.error("API Error:", error);
  if (error instanceof Error) {
    return error;
  }
  return new Error(error instanceof Object && 'message' in error
    ? String(error.message)
    : "An unexpected error occurred");
};

// ==================== ARTICLES ====================

export const getArticles = async (
  page = 1,
  pageSize = 10,
  filters?: {
    tag_id?: string;
    category_id?: string;
    author_id?: string;
    search?: string;
    published?: boolean;
  },
  sort?: { field: string; order: string }
): Promise<{ data: Article[]; total: number; page: number; page_size: number; has_more: boolean }> => {
  try {
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
    };

    if (filters?.tag_id) {
      params.tag_id = filters.tag_id;
    }
    if (filters?.category_id) {
      params.category_id = filters.category_id;
    }
    if (filters?.author_id) {
      params.author_id = filters.author_id;
    }
    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.published !== undefined) {
      params.published = String(filters.published);
    }
    if (sort) {
      params.sort_by = sort.field;
      params.sort_order = sort.order;
    }

    const response = await api.articles.list(params) as PaginatedResponse<Article>;
    return {
      data: response.data,
      total: response.pagination.total,
      page: response.pagination.page,
      page_size: response.pagination.page_size,
      has_more: response.pagination.has_more,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getArticleById = async (id: string): Promise<Article> => {
  try {
    const response = await api.articles.get(id) as ApiResponse<Article>;
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createArticle = async (input: ArticleInput): Promise<Article> => {
  try {
    const response = await api.articles.create(input) as ApiResponse<Article>;
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateArticle = async (id: string, input: Partial<ArticleInput>): Promise<Article> => {
  try {
    const response = await api.articles.update(id, input);
    // Extract data from API response format {success, data}
    return (response as any).data as Article;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    await api.articles.delete(id);
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== COMMENTS ====================

export const getComments = async (
  articleId: string,
  skip = 0,
  limit = 20,
  parentId?: string | null,
  status = "published"
): Promise<Comment[]> => {
  try {
    const params: Record<string, string> = {
      skip: String(skip),
      limit: String(limit),
      status,
    };
    if (parentId) {
      params.parent_id = parentId;
    }

    const response = await api.comments.list(articleId, params);
    // Extract data from API response format {success, data, pagination}
    return (response as any).data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const countComments = async (
  articleId: string,
  parentId?: string | null,
  status = "published"
): Promise<number> => {
  try {
    const params: Record<string, string> = {
      count_only: "true",
      status,
    };
    if (parentId) {
      params.parent_id = parentId;
    }

    const response = await api.comments.list(articleId, params);
    // Extract total from pagination in API response format {success, data, pagination}
    return (response as any).pagination?.total || (response as any).total || 0;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createComment = async (input: CommentInput): Promise<Comment> => {
  try {
    const response = await api.comments.create(input);
    // Extract data from API response format {success, data}
    return (response as any).data as Comment;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteComment = async (id: string): Promise<void> => {
  try {
    await api.comments.delete(id);
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== LIKES ====================

export const toggleLike = async (articleId: string): Promise<Like> => {
  try {
    // Check current like status first
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/articles/${articleId}/like/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    const currentStatus = await response.json();

    if (currentStatus.liked) {
      await api.articles.unlike(articleId);
      throw new Error("Like removed");
    } else {
      const data = await api.articles.like(articleId);
      return data as Like;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Like removed") {
      throw error;
    }
    throw handleApiError(error);
  }
};

export const checkLikeStatus = async (articleId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/articles/${articleId}/like/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    const data = await response.json();
    return data.liked || false;
  } catch {
    return false;
  }
};

// ==================== BOOKMARKS ====================

export const toggleBookmark = async (articleId: string): Promise<Bookmark> => {
  try {
    const checkData = await api.bookmarks.check(articleId) as any;

    if (checkData.bookmarked) {
      await api.bookmarks.remove(articleId);
      throw new Error("Bookmark removed");
    } else {
      const data = await api.bookmarks.add(articleId);
      return data as Bookmark;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Bookmark removed") {
      throw error;
    }
    throw handleApiError(error);
  }
};

export const getBookmarks = async (page = 1, pageSize = 10): Promise<{ data: Bookmark[]; total: number }> => {
  try {
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
    };

    const response = await api.bookmarks.list(params);
    // Extract data from API response format {success, data, pagination}
    const result = response as any;
    return {
      data: result.data || [],
      total: result.pagination?.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkBookmarkStatus = async (articleId: string): Promise<boolean> => {
  try {
    const response = await api.bookmarks.check(articleId) as any;
    // Extract data from API response format {success, data}
    return response.data?.bookmarked || false;
  } catch {
    return false;
  }
};

// ==================== TAGS ====================

export const getTags = async (): Promise<Tag[]> => {
  try {
    const response = await api.tags.list();
    // Extract data from API response format {success, data}
    return (response as any).data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createTag = async (tag: { name: string; slug?: string; color?: string; description?: string }): Promise<Tag> => {
  try {
    const response = await api.tags.create(tag);
    // Extract data from API response format {success, data}
    return (response as any).data as Tag;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.categories.list();
    // Extract data from API response format {success, data}
    return (response as any).data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== USER PROFILE ====================

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await api.users.getUser(userId);
    // Extract data from API response format {success, data}
    return (response as any).data as UserProfile;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const response = await api.users.updateUser(userId, updates);
    // Extract data from API response format {success, data}
    return (response as any).data as UserProfile;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== FOLLOWS ====================

export const followUser = async (userId: string): Promise<void> => {
  try {
    await api.follows.follow(userId);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const unfollowUser = async (userId: string): Promise<void> => {
  try {
    await api.follows.unfollow(userId);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkFollowStatus = async (userId: string): Promise<boolean> => {
  try {
    const response = await api.follows.check(userId) as any;
    // Extract data from API response format {success, data}
    return response.data?.following || false;
  } catch {
    return false;
  }
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (page = 1, pageSize = 20): Promise<Notification[]> => {
  try {
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(pageSize),
    };

    const response = await api.notifications.list(params);
    // Extract data from API response format {success, data}
    return (response as any).data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await api.notifications.markAsRead(notificationId);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.notifications.markAllAsRead();
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const response = await api.notifications.unreadCount() as any;
    // Extract data from API response format {success, data}
    return response.data?.count || 0;
  } catch {
    return 0;
  }
};
