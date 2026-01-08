import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Follow,
  PaginatedResponse,
} from '@/types/api';

// Fetch user's follows/followers
export const useFollows = (params?: Record<string, string>, options?: UseQueryOptions<PaginatedResponse<Follow>>) => {
  return useQuery({
    queryKey: ['follows', params],
    queryFn: () => api.follows.list(params),
    ...options,
  });
};

// Check if following a user
export const useIsFollowing = (userId: string, options?: UseQueryOptions<boolean>) => {
  return useQuery({
    queryKey: ['follow', 'check', userId],
    queryFn: () => api.follows.check(userId),
    enabled: !!userId,
    ...options,
  });
};

// Follow user
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.follows.follow(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['follow', 'check', variables] });
      toast.success('已关注');
    },
    onError: (error: Error) => {
      toast.error(error.message || '关注失败');
    },
  });
};

// Unfollow user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => api.follows.unfollow(userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['follow', 'check', variables] });
      toast.success('已取消关注');
    },
    onError: (error: Error) => {
      toast.error(error.message || '取消关注失败');
    },
  });
};

// Toggle follow (convenience hook)
export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await api.follows.unfollow(userId);
        return { action: 'unfollowed' as const };
      } else {
        await api.follows.follow(userId);
        return { action: 'followed' as const };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['follow', 'check', variables.userId] });
      toast.success(data.action === 'followed' ? '已关注' : '已取消关注');
    },
    onError: (error: Error) => {
      toast.error(error.message || '操作失败');
    },
  });
};
