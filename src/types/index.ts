// User Types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  articles_count?: number;
}

export interface UserRelationship {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Article Types
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  author_id: string;
  author?: UserProfile;
  category_id?: string;
  category?: Category;
  published: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  tags?: Tag[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface ArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category_id?: string;
  published: boolean;
  tag_ids?: string[];
}

// Comment Types
export interface Comment {
  id: string;
  article_id: string;
  author_id: string;
  author?: UserProfile;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  replies?: Comment[];
  is_liked?: boolean;
}

export interface CommentInput {
  article_id: string;
  content: string;
  parent_id?: string;
}

// Like Types
export interface Like {
  id: string;
  user_id: string;
  article_id?: string;
  comment_id?: string;
  created_at: string;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: Article;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  created_at: string;
  articles_count?: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at: string;
  articles_count?: number;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'like' | 'follow' | 'mention' | 'system';
  title: string;
  content: string;
  link?: string;
  read: boolean;
  created_at: string;
  actor?: UserProfile;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Filter and Sort Types
export interface ArticleFilters {
  tag_id?: string;
  category_id?: string;
  author_id?: string;
  search?: string;
  published?: boolean;
}

export interface SortOptions {
  field: 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'like_count';
  order: 'asc' | 'desc';
}
