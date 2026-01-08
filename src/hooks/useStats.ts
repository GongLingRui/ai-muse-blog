import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types/api';

// Fetch dashboard stats
export const useDashboardStats = (options?: UseQueryOptions<DashboardStats>) => {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.stats.dashboard(),
    ...options,
  });
};
