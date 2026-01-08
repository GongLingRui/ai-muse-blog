import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Tag,
  CreateTagRequest,
  UpdateTagRequest,
  PaginatedResponse,
} from '@/types/api';

// Fetch tags list
export const useTags = (params?: Record<string, string>, options?: UseQueryOptions<PaginatedResponse<Tag>>) => {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: () => api.tags.list(params),
    ...options,
  });
};

// Fetch single tag
export const useTag = (id: string, options?: UseQueryOptions<Tag>) => {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => api.tags.get(id),
    enabled: !!id,
    ...options,
  });
};

// Create tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagRequest) => api.tags.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('标签创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '标签创建失败');
    },
  });
};

// Update tag
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) =>
      api.tags.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('标签更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '标签更新失败');
    },
  });
};

// Delete tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('标签删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '标签删除失败');
    },
  });
};
