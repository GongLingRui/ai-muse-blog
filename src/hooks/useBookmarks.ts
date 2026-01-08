import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Bookmark,
  PaginatedResponse,
} from '@/types/api';

// Fetch user's bookmarks
export const useBookmarks = (params?: Record<string, string>, options?: UseQueryOptions<PaginatedResponse<Bookmark>>) => {
  return useQuery({
    queryKey: ['bookmarks', params],
    queryFn: () => api.bookmarks.list(params),
    ...options,
  });
};

// Check if article is bookmarked
export const useIsBookmarked = (articleId: string, options?: UseQueryOptions<boolean>) => {
  return useQuery({
    queryKey: ['bookmark', 'check', articleId],
    queryFn: () => api.bookmarks.check(articleId),
    enabled: !!articleId,
    ...options,
  });
};

// Add bookmark
export const useAddBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => api.bookmarks.add(articleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark', 'check', variables] });
      toast.success('已收藏');
    },
    onError: (error: Error) => {
      toast.error(error.message || '收藏失败');
    },
  });
};

// Remove bookmark
export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => api.bookmarks.remove(articleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark', 'check', variables] });
      toast.success('已取消收藏');
    },
    onError: (error: Error) => {
      toast.error(error.message || '取消收藏失败');
    },
  });
};

// Toggle bookmark (convenience hook)
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        await api.bookmarks.remove(articleId);
        return { action: 'removed' as const };
      } else {
        await api.bookmarks.add(articleId);
        return { action: 'added' as const };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['bookmark', 'check', variables.articleId] });
      toast.success(data.action === 'added' ? '已收藏' : '已取消收藏');
    },
    onError: (error: Error) => {
      toast.error(error.message || '操作失败');
    },
  });
};
