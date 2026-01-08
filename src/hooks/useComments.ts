import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Comment,
  CreateCommentRequest,
  CommentListParams,
  PaginatedResponse,
} from '@/types/api';

// Fetch comments for an article
export const useComments = (articleId: string, params?: CommentListParams, options?: UseQueryOptions<PaginatedResponse<Comment>>) => {
  return useQuery({
    queryKey: ['comments', articleId, params],
    queryFn: () => api.comments.list(articleId, params as Record<string, string>),
    enabled: !!articleId,
    ...options,
  });
};

// Create comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => api.comments.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.article_id] });
      queryClient.invalidateQueries({ queryKey: ['article', variables.article_id] });
      toast.success('评论发表成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '评论发表失败');
    },
  });
};

// Update comment
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { content: string } }) =>
      api.comments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('评论更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '评论更新失败');
    },
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.comments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('评论删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '评论删除失败');
    },
  });
};
