import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getComments,
  createComment,
  deleteComment,
  toggleLike,
  checkLikeStatus,
  toggleBookmark,
  getBookmarks,
  checkBookmarkStatus,
  getTags,
  createTag,
  getCategories,
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  checkFollowStatus,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "./api";
import type {
  Article,
  ArticleInput,
  Comment,
  CommentInput,
  Tag,
  Category,
  UserProfile,
  Notification,
  ArticleFilters,
  SortOptions,
} from "@/types";

// ==================== ARTICLES ====================

export const useArticles = (
  page = 1,
  pageSize = 10,
  filters?: ArticleFilters,
  sort?: SortOptions
) => {
  return useQuery({
    queryKey: ["articles", page, pageSize, filters, sort],
    queryFn: () => getArticles(page, pageSize, filters, sort),
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticleById(id),
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: ArticleInput) => createArticle(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("文章发布成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "发布失败");
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, article }: { id: string; article: Partial<ArticleInput> }) =>
      updateArticle(id, article),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["article", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("文章更新成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新失败");
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success("文章删除成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "删除失败");
    },
  });
};

// ==================== COMMENTS ====================

export const useComments = (articleId: string) => {
  return useQuery({
    queryKey: ["comments", articleId],
    queryFn: () => getComments(articleId),
    enabled: !!articleId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: CommentInput) => createComment(comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.article_id] });
      queryClient.invalidateQueries({ queryKey: ["article", variables.article_id] });
      toast.success("评论发表成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "评论失败");
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("评论删除成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "删除失败");
    },
  });
};

// ==================== LIKES ====================

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => toggleLike(articleId),
    onSuccess: (result, articleId) => {
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast.success(result.liked ? "已点赞" : "已取消点赞");
    },
    onError: (error: Error) => {
      toast.error(error.message || "操作失败");
    },
  });
};

export const useLikeStatus = (articleId: string) => {
  return useQuery({
    queryKey: ["like-status", articleId],
    queryFn: () => checkLikeStatus(articleId),
    enabled: !!articleId,
  });
};

// ==================== BOOKMARKS ====================

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => toggleBookmark(articleId),
    onSuccess: (result, articleId) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["bookmark-status", articleId] });
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
      toast.success(result.bookmarked ? "已收藏" : "已取消收藏");
    },
    onError: (error: Error) => {
      toast.error(error.message || "操作失败");
    },
  });
};

export const useBookmarks = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["bookmarks", page, pageSize],
    queryFn: () => getBookmarks(page, pageSize),
  });
};

export const useBookmarkStatus = (articleId: string) => {
  return useQuery({
    queryKey: ["bookmark-status", articleId],
    queryFn: () => checkBookmarkStatus(articleId),
    enabled: !!articleId,
  });
};

// ==================== TAGS ====================

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tag: Partial<Tag>) => createTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("标签创建成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "创建失败");
    },
  });
};

// ==================== CATEGORIES ====================

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
};

// ==================== USER PROFILE ====================

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserProfile>) => updateUserProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("资料更新成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新失败");
    },
  });
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("关注成功");
    },
    onError: (error: Error) => {
      toast.error(error.message || "关注失败");
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("已取消关注");
    },
    onError: (error: Error) => {
      toast.error(error.message || "操作失败");
    },
  });
};

export const useFollowStatus = (userId: string) => {
  return useQuery({
    queryKey: ["follow-status", userId],
    queryFn: () => checkFollowStatus(userId),
    enabled: !!userId,
  });
};

// ==================== NOTIFICATIONS ====================

export const useNotifications = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ["notifications", page, pageSize],
    queryFn: () => getNotifications(page, pageSize),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("已全部标记为已读");
    },
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
