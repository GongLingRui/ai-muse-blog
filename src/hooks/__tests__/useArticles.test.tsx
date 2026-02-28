import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useArticles, useArticle, useCreateArticle, useUpdateArticle, useDeleteArticle } from '../useArticles'
import { toast } from 'sonner'
import { api } from '@/lib/api'

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    articles: {
      list: vi.fn(() => Promise.resolve({ items: [], total: 0, page: 1, page_size: 20 })),
      get: vi.fn((id: string) => Promise.resolve({ id, title: 'Test Article' })),
      create: vi.fn((data: any) => Promise.resolve({ id: '1', ...data })),
      update: vi.fn((id: string, data: any) => Promise.resolve({ id, ...data })),
      delete: vi.fn(() => Promise.resolve()),
      like: vi.fn(() => Promise.resolve()),
      unlike: vi.fn(() => Promise.resolve()),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches articles list successfully', async () => {
    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
    })
  })

  it('fetches articles with params', async () => {
    renderHook(() => useArticles({ page: 2, page_size: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(vi.mocked(api).articles.list).toHaveBeenCalledWith({ page: 2, page_size: 10 })
    })
  })

  it('handles articles list error', async () => {
    vi.mocked(api).articles.list = vi.fn(() => Promise.reject(new Error('Failed to fetch')))

    const { result } = renderHook(() => useArticles(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useArticle', () => {
  it('fetches single article successfully', async () => {
    const { result } = renderHook(() => useArticle('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      id: '1',
      title: 'Test Article',
    })
  })

  it('does not fetch when id is empty', async () => {
    // Clear mock calls before this test
    vi.mocked(api).articles.get.mockClear()

    renderHook(() => useArticle(''), {
      wrapper: createWrapper(),
    })

    // Query should not execute due to enabled: !!id
    expect(vi.mocked(api).articles.get).not.toHaveBeenCalled()
  })

  it('handles article error', async () => {
    vi.mocked(api).articles.get = vi.fn(() => Promise.reject(new Error('Article not found')))

    const { result } = renderHook(() => useArticle('999'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateArticle', () => {
  it('creates article successfully', async () => {
    const { result } = renderHook(() => useCreateArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      title: 'New Article',
      content: 'Content',
      excerpt: 'Excerpt',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('文章创建成功')
  })

  it('handles create article error', async () => {
    vi.mocked(api).articles.create = vi.fn(() => Promise.reject(new Error('Creation failed')))

    const { result } = renderHook(() => useCreateArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      title: 'New Article',
      content: 'Content',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateArticle', () => {
  it('updates article successfully', async () => {
    const { result } = renderHook(() => useUpdateArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      id: '1',
      data: { title: 'Updated Title' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('文章更新成功')
  })

  it('handles update article error', async () => {
    vi.mocked(api).articles.update = vi.fn(() => Promise.reject(new Error('Update failed')))

    const { result } = renderHook(() => useUpdateArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      id: '1',
      data: { title: 'Updated' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteArticle', () => {
  it('deletes article successfully', async () => {
    const { result } = renderHook(() => useDeleteArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('文章删除成功')
  })

  it('handles delete article error', async () => {
    vi.mocked(api).articles.delete = vi.fn(() => Promise.reject(new Error('Delete failed')))

    const { result } = renderHook(() => useDeleteArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalled()
  })
})
