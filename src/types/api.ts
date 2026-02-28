// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Pagination Types
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

// Article Types
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  author_id: string;
  author?: User;
  category_id?: string;
  category?: Category;
  tags: Tag[];
  status: 'draft' | 'published';
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category_id?: string;
  tag_ids?: string[];
  status?: 'draft' | 'published';
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  category_id?: string;
  tag_ids?: string[];
  status?: 'draft' | 'published';
}

export interface ArticleListParams {
  page?: number;
  page_size?: number;
  category_id?: string;
  tag_id?: string;
  status?: 'draft' | 'published';
  search?: string;
  author_id?: string;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  article_id: string;
  author_id: string;
  author?: User;
  parent_id?: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface CreateCommentRequest {
  content: string;
  article_id: string;
  parent_id?: string;
}

export interface CommentListParams {
  article_id: string;
  page?: number;
  page_size?: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  article_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name?: string;
}

// Like Types
export interface Like {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  article?: Article;
  created_at: string;
}

// Follow Types
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Stats Types
export interface DashboardStats {
  total_articles: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  recent_articles: Article[];
  popular_articles: Article[];
}
