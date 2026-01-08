import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommentForm from '../CommentForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/hooks', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/queries', () => ({
  useCreateComment: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({ id: '1' })),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockUser = {
  id: '1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>)
}

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows login prompt when user is not authenticated', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: null })

    renderWithProviders(<CommentForm articleId="1" />)

    expect(screen.getByText('登录后发表评论')).toBeInTheDocument()
    expect(screen.getByText('立即登录')).toBeInTheDocument()
  })

  it('renders comment form when user is authenticated', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(<CommentForm articleId="1" />)

    expect(screen.getByPlaceholderText('写下你的评论...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /发表评论/ })).toBeInTheDocument()
  })

  it('submits comment successfully', async () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const onSuccess = vi.fn()
    const { useCreateComment } = require('@/services/queries')
    const mutateAsync = vi.fn(() => Promise.resolve({ id: '1' }))
    useCreateComment.mockReturnValue({ mutateAsync })

    renderWithProviders(<CommentForm articleId="1" onSuccess={onSuccess} />)

    const textarea = screen.getByPlaceholderText('写下你的评论...')
    const submitButton = screen.getByRole('button', { name: /发表评论/ })

    fireEvent.change(textarea, { target: { value: 'Test comment' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        article_id: '1',
        content: 'Test comment',
        parent_id: undefined,
      })
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('shows error when submitting empty comment', async () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(<CommentForm articleId="1" />)

    const submitButton = screen.getByRole('button', { name: /发表评论/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('请输入评论内容')
    })
  })

  it('disables submit button when content is empty', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(<CommentForm articleId="1" />)

    const submitButton = screen.getByRole('button', { name: /发表评论/ })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when content is entered', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(<CommentForm articleId="1" />)

    const textarea = screen.getByPlaceholderText('写下你的评论...')
    const submitButton = screen.getByRole('button', { name: /发表评论/ })

    fireEvent.change(textarea, { target: { value: 'Test comment' } })

    expect(submitButton).not.toBeDisabled()
  })

  it('shows cancel button when onCancel is provided', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const onCancel = vi.fn()
    renderWithProviders(<CommentForm articleId="1" onCancel={onCancel} />)

    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const onCancel = vi.fn()
    renderWithProviders(<CommentForm articleId="1" onCancel={onCancel} />)

    const cancelButton = screen.getByRole('button', { name: '取消' })
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
  })

  it('shows reply button when parentId is provided', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(<CommentForm articleId="1" parentId="parent-1" />)

    expect(screen.getByRole('button', { name: '回复' })).toBeInTheDocument()
  })

  it('uses custom placeholder', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    renderWithProviders(
      <CommentForm articleId="1" placeholder="Write your reply..." />
    )

    expect(screen.getByPlaceholderText('Write your reply...')).toBeInTheDocument()
  })

  it('hides avatar when showAvatar is false', () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const { container } = renderWithProviders(
      <CommentForm articleId="1" showAvatar={false} />
    )

    const avatar = container.querySelector('.avatar')
    expect(avatar).not.toBeInTheDocument()
  })

  it('clears content after successful submission', async () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const { useCreateComment } = require('@/services/queries')
    const mutateAsync = vi.fn(() => Promise.resolve({ id: '1' }))
    useCreateComment.mockReturnValue({ mutateAsync })

    renderWithProviders(<CommentForm articleId="1" />)

    const textarea = screen.getByPlaceholderText('写下你的评论...')
    const submitButton = screen.getByRole('button', { name: /发表评论/ })

    fireEvent.change(textarea, { target: { value: 'Test comment' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('disables form during submission', async () => {
    const { useAuth } = require('@/hooks')
    useAuth.mockReturnValue({ user: mockUser })

    const { useCreateComment } = require('@/services/queries')
    let resolveMutation: (value: any) => void
    const mutateAsync = vi.fn(() => new Promise((resolve) => {
      resolveMutation = resolve
    }))
    useCreateComment.mockReturnValue({ mutateAsync })

    renderWithProviders(<CommentForm articleId="1" />)

    const textarea = screen.getByPlaceholderText('写下你的评论...')
    const submitButton = screen.getByRole('button', { name: /发表评论/ })

    fireEvent.change(textarea, { target: { value: 'Test comment' } })
    fireEvent.click(submitButton)

    // Should be disabled during submission
    expect(textarea).toBeDisabled()
    expect(submitButton).toBeDisabled()

    // Resolve mutation
    resolveMutation!({ id: '1' })

    await waitFor(() => {
      expect(textarea).not.toBeDisabled()
    })
  })
})
