import { supabase } from "@/integrations/supabase/client";
import {
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
  PaginatedResponse,
  ArticleFilters,
  SortOptions,
} from "@/types";

// Generic error handler
const handleApiError = (error: any): Error => {
  console.error("API Error:", error);
  return new Error(error.message || "An unexpected error occurred");
};

// ==================== ARTICLES ====================

export const getArticles = async (
  page = 1,
  pageSize = 10,
  filters?: ArticleFilters,
  sort?: SortOptions
): Promise<PaginatedResponse<Article>> => {
  try {
    let query = supabase
      .from("articles")
      .select(`
        *,
        author:author_id(id, email, full_name, avatar_url),
        category:category_id(id, name, slug),
        tags(article_tags(tag_id, tags(id, name, slug, color)))
      `, { count: "exact" });

    // Apply filters
    if (filters?.tag_id) {
      query = query.contains("tags", [{ tag_id: filters.tag_id }]);
    }
    if (filters?.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters?.author_id) {
      query = query.eq("author_id", filters.author_id);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    } else {
      query = query.eq("published", true);
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw handleApiError(error);

    // Transform tags data
    const transformedData = data?.map((article: any) => ({
      ...article,
      tags: article.tags?.map((tagRelation: any) => tagRelation.tags).filter(Boolean) || [],
    })) || [];

    return {
      data: transformedData,
      total: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > to + 1,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getArticleById = async (id: string): Promise<Article> => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        *,
        author:author_id(id, email, full_name, avatar_url, bio),
        category:category_id(id, name, slug),
        tags(article_tags(tag_id, tags(id, name, slug, color)))
      `)
      .eq("id", id)
      .single();

    if (error) throw handleApiError(error);

    // Increment view count
    await supabase
      .from("articles")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id);

    return {
      ...data,
      tags: data.tags?.map((tagRelation: any) => tagRelation.tags).filter(Boolean) || [],
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createArticle = async (article: ArticleInput): Promise<Article> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("articles")
      .insert({
        ...article,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) throw handleApiError(error);

    // Handle tags if provided
    if (article.tag_ids && article.tag_ids.length > 0) {
      const tagRelations = article.tag_ids.map(tag_id => ({
        article_id: data.id,
        tag_id,
      }));
      await supabase.from("article_tags").insert(tagRelations);
    }

    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateArticle = async (id: string, article: Partial<ArticleInput>): Promise<Article> => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .update({
        ...article,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleApiError(error);

    // Update tags if provided
    if (article.tag_ids) {
      // Delete existing tag relations
      await supabase.from("article_tags").delete().eq("article_id", id);
      // Add new tag relations
      if (article.tag_ids.length > 0) {
        const tagRelations = article.tag_ids.map(tag_id => ({
          article_id: id,
          tag_id,
        }));
        await supabase.from("article_tags").insert(tagRelations);
      }
    }

    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) throw handleApiError(error);
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== COMMENTS ====================

export const getComments = async (articleId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:author_id(id, email, full_name, avatar_url)
      `)
      .eq("article_id", articleId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) throw handleApiError(error);

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("comments")
          .select(`
            *,
            author:author_id(id, email, full_name, avatar_url)
          `)
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true });

        return {
          ...comment,
          replies: replies || [],
        };
      })
    );

    return commentsWithReplies;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createComment = async (comment: CommentInput): Promise<Comment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("comments")
      .insert({
        ...comment,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) throw handleApiError(error);

    // Update article comment count
    await supabase.rpc("increment_comment_count", { article_id: comment.article_id });

    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteComment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) throw handleApiError(error);
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== LIKES ====================

export const toggleLike = async (articleId: string): Promise<{ liked: boolean; count: number }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("id", existingLike.id);

      const { data: article } = await supabase
        .from("articles")
        .select("like_count")
        .eq("id", articleId)
        .single();

      return { liked: false, count: Math.max(0, (article?.like_count || 1) - 1) };
    } else {
      // Like
      await supabase
        .from("likes")
        .insert({
          user_id: user.id,
          article_id: articleId,
        });

      const { data: article } = await supabase
        .from("articles")
        .select("like_count")
        .eq("id", articleId)
        .single();

      return { liked: true, count: (article?.like_count || 0) + 1 };
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkLikeStatus = async (articleId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
};

// ==================== BOOKMARKS ====================

export const toggleBookmark = async (articleId: string): Promise<{ bookmarked: boolean }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .single();

    if (existingBookmark) {
      // Remove bookmark
      await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existingBookmark.id);

      return { bookmarked: false };
    } else {
      // Add bookmark
      await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          article_id: articleId,
        });

      return { bookmarked: true };
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getBookmarks = async (page = 1, pageSize = 10): Promise<PaginatedResponse<Bookmark>> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("bookmarks")
      .select(`
        *,
        article:article_id(*, author:author_id(id, email, full_name, avatar_url))
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw handleApiError(error);

    return {
      data: data || [],
      total: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > to + 1,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkBookmarkStatus = async (articleId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
};

// ==================== TAGS ====================

export const getTags = async (): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw handleApiError(error);
    return data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createTag = async (tag: Partial<Tag>): Promise<Tag> => {
  try {
    const { data, error } = await supabase
      .from("tags")
      .insert(tag)
      .select()
      .single();

    if (error) throw handleApiError(error);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw handleApiError(error);
    return data || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

// ==================== USER PROFILE ====================

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw handleApiError(error);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw handleApiError(error);
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const followUser = async (userId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    await supabase
      .from("user_relationships")
      .insert({
        follower_id: user.id,
        following_id: userId,
      });
  } catch (error) {
    throw handleApiError(error);
  }
};

export const unfollowUser = async (userId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    await supabase
      .from("user_relationships")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", userId);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const checkFollowStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("user_relationships")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
};

// ==================== NOTIFICATIONS ====================

export const getNotifications = async (page = 1, pageSize = 10): Promise<PaginatedResponse<Notification>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw handleApiError(error);

    return {
      data: data || [],
      total: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > to + 1,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw handleApiError(error);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) throw handleApiError(error);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return count || 0;
  } catch (error) {
    return 0;
  }
};
