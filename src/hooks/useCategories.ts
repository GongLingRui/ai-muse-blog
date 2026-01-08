import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResponse,
} from '@/types/api';

// Fetch categories list
export const useCategories = (params?: Record<string, string>, options?: UseQueryOptions<PaginatedResponse<Category>>) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => api.categories.list(params),
    ...options,
  });
};

// Fetch single category
export const useCategory = (id: string, options?: UseQueryOptions<Category>) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => api.categories.get(id),
    enabled: !!id,
    ...options,
  });
};

// Create category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类创建成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '分类创建失败');
    },
  });
};

// Update category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      api.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类更新成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '分类更新失败');
    },
  });
};

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类删除成功');
    },
    onError: (error: Error) => {
      toast.error(error.message || '分类删除失败');
    },
  });
};
