import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Article,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleListParams,
  PaginatedResponse,
} from '@/types/api';

// Fetch articles list
export const useArticles = (params?: ArticleListParams, options?: UseQueryOptions<PaginatedResponse<Article>>) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.articles.list(params as Record<string, string>),
    ...options,
  });
};

// Fetch single article
export const useArticle = (id: string, options?: UseQueryOptions<Article>) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => api.articles.get(id),
    enabled: !!id,
    ...options,
  });
};

// Create article
export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleRequest) => api.articles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('文章创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '文章创建失败');
    },
  });
};

// Update article
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleRequest }) =>
      api.articles.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('文章更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '文章更新失败');
    },
  });
};

// Delete article
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.articles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('文章删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '文章删除失败');
    },
  });
};

// Like article
export const useLikeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.articles.like(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('已点赞');
    },
    onError: (error: Error) => {
      toast.error(error.message || '点赞失败');
    },
  });
};

// Unlike article
export const useUnlikeArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.articles.unlike(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('已取消点赞');
    },
    onError: (error: Error) => {
      toast.error(error.message || '取消点赞失败');
    },
  });
};
