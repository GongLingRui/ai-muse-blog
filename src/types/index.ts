// User Types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  twitter_username?: string;
  github_username?: string;
  linkedin_url?: string;
  expertise?: string[];
  role: string;
  is_verified: boolean;
  notification_preferences?: {
    email?: boolean;
    push?: boolean;
  };
  created_at: string;
  updated_at?: string;
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

// Paper Types
export interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date?: string;
  category?: string;
  pdf_url?: string;
  view_count: number;
  submitted_by?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Reading List Types
export interface ReadingListItem {
  id: string;
  user_id: string;
  paper_id?: string;
  article_id?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  order_index: number;
  estimated_reading_time?: number;
  source: string;
  created_at: string;
  read_at?: string;
  due_date?: string;
  paper?: Paper;
  article?: Article;
}

export interface ReadingList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_public: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// AI Summary Types
export interface AISummary {
  id: string;
  paper_id?: string;
  article_id?: string;
  summary_type: 'short' | 'detailed' | 'bullet_points' | 'key_findings';
  content: string;
  language: string;
  model_name: string;
  quality_score: number;
  usefulness_votes: number;
  generated_at: string;
  key_points?: string[];
  tags_suggested?: string[];
  related_topics?: string[];
}

// Citation Export Types
export interface CitationFormat {
  id: string;
  name: string;
  extension: string;
  description?: string;
}

export interface CitationExportRequest {
  paper_ids: string[];
  format: 'bibtex' | 'endnote' | 'ris' | 'apa' | 'mla' | 'chicago';
}

export interface CitationExportResponse {
  format: string;
  citations: string[];
  count: number;
}

// Social Share Types
export interface ShareTemplate {
  id: string;
  name: string;
  description?: string;
  platform: string;
  template: string;
  hashtags: string[];
}

export interface SocialShare {
  platform: string;
  share_url: string;
  share_title: string;
  share_description: string;
  hashtags?: string[];
}

// Study Group Types
export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  max_members?: number;
  focus_areas?: string[];
  member_count: number;
  discussion_count: number;
  created_at: string;
}

// Annotation Types
export interface Annotation {
  id: string;
  user_id: string;
  paper_id?: string;
  article_id?: string;
  text_anchors?: { start: number; end: number };
  page_number?: number;
  section?: string;
  content: string;
  annotation_type: 'comment' | 'highlight' | 'question' | 'definition';
  color: string;
  is_public: boolean;
  created_at: string;
}

// Search History Types
export interface SearchHistoryItem {
  id: string;
  query: string;
  search_type: string;
  results_count: number;
  created_at: string;
}

// Reading Stats Types
export interface ReadingStats {
  total_papers: number;
  papers_read: number;
  total_reading_time: number;
  current_streak: number;
  longest_streak: number;
  daily_average: number;
}
