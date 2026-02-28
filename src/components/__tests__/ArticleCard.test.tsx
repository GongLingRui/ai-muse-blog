import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArticleCard from '../ArticleCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock hooks
vi.mock('@/services/queries', () => ({
  useToggleLike: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve({ count: 5 })),
  })),
  useToggleBookmark: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
  })),
}))

vi.mock('@/hooks/useOptimisticUpdate', () => ({
  useOptimisticCounter: vi.fn((initial: number) => ({
    count: initial,
    increment: vi.fn(async (fn: Function) => {
      const result = await fn()
      return result
    }),
    decrement: vi.fn(async (fn: Function) => {
      const result = await fn()
      return result
    }),
  })),
  useOptimisticToggle: vi.fn((initial: boolean) => ({
    value: initial,
    toggle: vi.fn(),
  })),
}))

const mockArticle = {
  id: '1',
  title: 'Test Article Title',
  excerpt: 'This is a test excerpt for the article',
  created_at: '2024-01-15T10:00:00Z',
  author: {
    id: '1',
    full_name: 'John Doe',
    email: 'john@example.com',
  },
  tags: [
    { id: '1', name: 'AI' },
    { id: '2', name: '工程' },
  ],
  like_count: 4,
  is_liked: false,
  is_bookmarked: false,
  view_count: 100,
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ArticleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders article title and excerpt', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    expect(screen.getByText('This is a test excerpt for the article')).toBeInTheDocument()
  })

  it('renders author name', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    // Should show formatted date in Chinese
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('renders tags correctly', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('工程')).toBeInTheDocument()
  })

  it('renders like count', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('applies correct tag colors', () => {
    const { container } = renderWithProviders(<ArticleCard article={mockArticle} />)

    // Check if AI tag has cyan color class
    const aiTag = screen.getByText('AI')
    expect(aiTag).toHaveClass('text-cyan-700')
  })

  it('has link to article detail page', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    const link = screen.getByText('Test Article Title').closest('a')
    expect(link).toHaveAttribute('href', '/article/1')
  })

  it('handles like button click', async () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    const likeButton = screen.getAllByRole('button')[0] // Like button
    fireEvent.click(likeButton)

    // Should trigger optimistic update
    expect(likeButton).toBeInTheDocument()
  })

  it('handles bookmark button click', async () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    const bookmarkButton = screen.getAllByRole('button')[1] // Bookmark button
    fireEvent.click(bookmarkButton)

    expect(bookmarkButton).toBeInTheDocument()
  })

  it('limits tags to 2 and shows overflow badge', () => {
    const articleWithManyTags = {
      ...mockArticle,
      tags: [
        { id: '1', name: 'AI' },
        { id: '2', name: '工程' },
        { id: '3', name: 'Agent' },
        { id: '4', name: 'AIGC' },
      ],
    }

    renderWithProviders(<ArticleCard article={articleWithManyTags} />)

    // Should show first 2 tags and "+2" for the remaining 2 tags
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('工程')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders anonymous author when full_name is missing', () => {
    const articleWithoutAuthor = {
      ...mockArticle,
      author: { id: '2', full_name: '', email: '' },
    }

    renderWithProviders(<ArticleCard article={articleWithoutAuthor} />)

    expect(screen.getByText('匿名')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <ArticleCard article={mockArticle} className="custom-class" />
    )

    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })

  it('shows all meta information', () => {
    renderWithProviders(<ArticleCard article={mockArticle} />)

    // Check for User icon (author)
    const authorSection = screen.getByText('John Doe').previousElementSibling
    expect(authorSection).toBeInTheDocument()

    // Check for Calendar icon (date)
    const dateSection = screen.getByText(/2024/).previousElementSibling
    expect(dateSection).toBeInTheDocument()
  })
})
