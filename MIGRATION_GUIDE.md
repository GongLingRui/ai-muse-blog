# Frontend API Migration Guide

## Overview

This document describes the migration from Supabase to a custom backend API for the AI Muse Blog frontend application.

## Changes Made

### 1. API Client (`src/lib/api.ts`)

**New HTTP Client:**
- Replaced Supabase client with custom fetch-based API client
- Centralized endpoint definitions
- Automatic token management (access/refresh tokens)
- Request/response interceptors for error handling
- TypeScript type safety

**Key Features:**
- Singleton `ApiClient` class with methods for GET, POST, PUT, PATCH, DELETE
- Automatic JWT token injection via `Authorization` header
- Token storage in localStorage
- Automatic token refresh on 401 errors
- Centralized error handling

### 2. Type Definitions (`src/types/api.ts`)

**New TypeScript Types:**
- Complete type definitions matching backend Pydantic models
- `ApiResponse<T>` wrapper for API responses
- `PaginatedResponse<T>` for list endpoints
- Auth types: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `User`
- Article types: `Article`, `CreateArticleRequest`, `UpdateArticleRequest`
- Comment, Category, Tag, Bookmark, Follow types
- Stats types for dashboard

### 3. Authentication (`src/contexts/AuthContext.tsx`)

**Replaced Supabase Auth with Custom Context:**
- `AuthProvider` wraps the application
- `useAuth()` hook provides auth state and methods
- Methods:
  - `login(credentials)` - User login
  - `register(data)` - User registration
  - `logout()` - User logout
  - `refreshUser()` - Refresh user data
- State:
  - `user: User | null`
  - `loading: boolean`
  - `isAuthenticated: boolean`

**Token Management:**
- Access tokens stored in localStorage
- Automatic token refresh on API calls
- Fallback to refresh token when access token expires

### 4. Custom Hooks (`src/hooks/`)

**Data Fetching Hooks (using TanStack Query):**

#### `useArticles.ts`
- `useArticles(params)` - Fetch articles list
- `useArticle(id)` - Fetch single article
- `useCreateArticle()` - Create article mutation
- `useUpdateArticle()` - Update article mutation
- `useDeleteArticle()` - Delete article mutation
- `useLikeArticle()` - Like article mutation
- `useUnlikeArticle()` - Unlike article mutation

#### `useComments.ts`
- `useComments(articleId)` - Fetch comments
- `useCreateComment()` - Create comment mutation
- `useUpdateComment()` - Update comment mutation
- `useDeleteComment()` - Delete comment mutation

#### `useTags.ts`
- `useTags()` - Fetch tags list
- `useTag(id)` - Fetch single tag
- `useCreateTag()` - Create tag mutation
- `useUpdateTag()` - Update tag mutation
- `useDeleteTag()` - Delete tag mutation

#### `useCategories.ts`
- `useCategories()` - Fetch categories list
- `useCategory(id)` - Fetch single category
- `useCreateCategory()` - Create category mutation
- `useUpdateCategory()` - Update category mutation
- `useDeleteCategory()` - Delete category mutation

#### `useBookmarks.ts`
- `useBookmarks()` - Fetch user bookmarks
- `useIsBookmarked(articleId)` - Check if bookmarked
- `useAddBookmark()` - Add bookmark mutation
- `useRemoveBookmark()` - Remove bookmark mutation
- `useToggleBookmark()` - Toggle bookmark mutation

#### `useFollows.ts`
- `useFollows()` - Fetch follows/followers
- `useIsFollowing(userId)` - Check if following
- `useFollowUser()` - Follow user mutation
- `useUnfollowUser()` - Unfollow user mutation
- `useToggleFollow()` - Toggle follow mutation

#### `useStats.ts`
- `useDashboardStats()` - Fetch dashboard statistics

### 5. Updated Components

**`src/App.tsx`:**
- Added `AuthProvider` wrapping the application
- Configured TanStack Query with default options

**`src/pages/Auth.tsx`:**
- Replaced Supabase auth with `useAuth()` hook
- Login/register now use `api.auth.login()` and `api.auth.register()`
- Removed OAuth functionality (Google login)
- Updated error handling

**`src/pages/WriteArticle.tsx`:**
- Uses `useCreateArticle()` mutation
- Fetches tags and categories from API
- Integrates with new auth context

**`src/components/Navbar.tsx`:**
- Updated to use new `useAuth()` hook
- Changed `isLoggedIn` to `isAuthenticated`
- Updated user data structure

### 6. Removed Files

- `src/integrations/supabase/` - Supabase integration directory
- `src/hooks/useAuth.tsx` - Old Supabase auth hook
- `@supabase/supabase-js` - npm package removed

### 7. Environment Variables

**Before (Supabase):**
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

**After (Custom API):**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Usage Examples

### Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123',
      });
      // Navigate to dashboard
    } catch (error) {
      // Handle error (toast notification already shown)
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### Fetching Articles

```tsx
import { useArticles } from '@/hooks';

function ArticlesPage() {
  const { data, isLoading, error } = useArticles({
    page: 1,
    page_size: 10,
    tag_id: 'tag-123',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return (
    <div>
      {data?.items.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### Creating an Article

```tsx
import { useCreateArticle } from '@/hooks';

function WriteArticle() {
  const createArticle = useCreateArticle();

  const handleSave = async () => {
    await createArticle.mutateAsync({
      title: 'My Article',
      content: 'Article content...',
      excerpt: 'Short description',
      tag_ids: ['tag-1', 'tag-2'],
      status: 'published',
    });
  };

  return <button onClick={handleSave}>Publish</button>;
}
```

### Checking Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ProtectedPage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login first</div>;
  }

  return <div>Welcome, {user?.email}</div>;
}
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

### Auth
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Articles
- `GET /articles` - List articles (with pagination)
- `GET /articles/:id` - Get article details
- `POST /articles` - Create article
- `PUT /articles/:id` - Update article
- `DELETE /articles/:id` - Delete article
- `POST /articles/:id/like` - Like article
- `DELETE /articles/:id/like` - Unlike article

### Comments
- `GET /articles/:articleId/comments` - List comments
- `POST /comments` - Create comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

### Categories
- `GET /categories` - List categories
- `GET /categories/:id` - Get category
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Tags
- `GET /tags` - List tags
- `GET /tags/:id` - Get tag
- `POST /tags` - Create tag
- `PUT /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag

### Bookmarks
- `GET /bookmarks` - List user bookmarks
- `POST /bookmarks/:articleId` - Add bookmark
- `DELETE /bookmarks/:articleId` - Remove bookmark
- `GET /bookmarks/check/:articleId` - Check if bookmarked

### Follows
- `GET /follows` - List follows
- `POST /follows/:userId` - Follow user
- `DELETE /follows/:userId` - Unfollow user
- `GET /follows/check/:userId` - Check if following

### Stats
- `GET /stats/dashboard` - Dashboard statistics

## Error Handling

All API errors are automatically handled:
- Error messages are displayed via `sonner` toast notifications
- Token refresh is attempted on 401 errors
- Invalid tokens are cleared automatically
- Network errors are caught and displayed

## Token Management

**Storage:**
- Access token: `localStorage.getItem('access_token')`
- Refresh token: `localStorage.getItem('refresh_token')`

**Automatic Refresh:**
- Tokens are automatically refreshed on 401 errors
- Multiple failed refresh attempts will clear tokens and redirect to login

## Migration Checklist

- [x] Create API client
- [x] Create TypeScript types
- [x] Create AuthContext
- [x] Create custom hooks
- [x] Update App.tsx
- [x] Update Auth page
- [x] Update WriteArticle page
- [x] Update Navbar
- [x] Remove Supabase dependencies
- [x] Update environment variables

## Next Steps

1. **Update remaining pages** that use Supabase:
   - ArticleDetail.tsx - Use `useArticle()` and `useComments()`
   - Articles.tsx - Use `useArticles()`
   - TagsManagement.tsx - Use `useTags()`
   - ClassicPapers.tsx - Use `useArticles()`

2. **Add request caching:**
   - Configure TanStack Query cache settings
   - Implement cache invalidation strategies

3. **Add loading states:**
   - Implement skeleton loaders
   - Add optimistic updates

4. **Test authentication flow:**
   - Login/logout
   - Token refresh
   - Protected routes

5. **Add error boundaries:**
   - Catch and handle React errors
   - Show fallback UI

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure your backend allows requests from your frontend origin:
```python
# FastAPI example
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 401 Unauthorized
- Check that tokens are being stored in localStorage
- Verify token format in Authorization header
- Check backend token validation

### Type Errors
- Ensure backend response types match frontend types
- Update `src/types/api.ts` if backend models change
- Run `npm run build` to check for type errors
