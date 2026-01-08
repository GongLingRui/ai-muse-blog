# Quick Start Guide - Frontend API Integration

## Prerequisites

- Backend API running on `http://localhost:8000`
- Node.js 18+ installed
- Frontend project setup completed

## Setup Steps

### 1. Install Dependencies

```bash
cd D:\persnal_project\ai-muse-blog
npm install
```

### 2. Configure Environment

Edit `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Testing the Integration

### Test Authentication

1. **Register:**
   - Navigate to `http://localhost:5173/auth`
   - Click "立即注册"
   - Fill in email and password
   - Submit form
   - Should redirect to home page

2. **Login:**
   - Logout if already logged in
   - Enter credentials
   - Click "登录"
   - Should redirect to home page

3. **Check Session:**
   - Refresh page
   - User should remain logged in
   - Check Navbar for user avatar

### Test Article Creation

1. **Navigate to Write Page:**
   - Click "写文章" in Navbar
   - Or go to `http://localhost:5173/write`

2. **Create Article:**
   - Enter title
   - Write content in Markdown
   - Select tags from dropdown
   - Click "发布文章"
   - Should show success toast
   - Redirect to home page

### Test Data Fetching

Open browser DevTools Console:

```javascript
// Test fetching articles
import { useArticles } from '@/hooks';

// In any component:
const { data } = useArticles({ page: 1, page_size: 10 });
console.log(data?.items); // Should show articles array
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run build:dev    # Development build

# Preview
npm run preview      # Preview production build

# Lint
npm run lint         # Run ESLint
```

## Key Files Reference

### Authentication
```typescript
// Use auth in any component
import { useAuth } from '@/contexts/AuthContext';

const { isAuthenticated, user, login, logout } = useAuth();
```

### Articles
```typescript
// Fetch articles
import { useArticles } from '@/hooks';

const { data, isLoading } = useArticles({
  page: 1,
  page_size: 10,
  tag_id: 'some-tag-id',
});
```

### Create Article
```typescript
import { useCreateArticle } from '@/hooks';

const createArticle = useCreateArticle();

await createArticle.mutateAsync({
  title: 'My Title',
  content: 'Content',
  tag_ids: ['tag-1'],
  status: 'published',
});
```

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx       # Auth state & methods
├── hooks/
│   ├── index.ts              # All hook exports
│   ├── useArticles.ts        # Article operations
│   ├── useComments.ts        # Comment operations
│   ├── useTags.ts            # Tag operations
│   ├── useCategories.ts      # Category operations
│   ├── useBookmarks.ts       # Bookmark operations
│   ├── useFollows.ts         # Follow operations
│   └── useStats.ts           # Statistics
├── lib/
│   └── api.ts                # API client & endpoints
├── types/
│   └── api.ts                # TypeScript types
└── pages/
    ├── Auth.tsx              # Login/Register
    ├── WriteArticle.tsx      # Article editor
    ├── ArticleDetail.tsx     # Article view
    └── Articles.tsx          # Article list
```

## Common Tasks

### Add a New API Endpoint

1. **Add type in `src/types/api.ts`:**
```typescript
export interface MyNewType {
  id: string;
  name: string;
}
```

2. **Add endpoint in `src/lib/api.ts`:**
```typescript
myNewEndpoint: {
  list: () => apiClient.get('/my-endpoint'),
  get: (id: string) => apiClient.get(`/my-endpoint/${id}`),
}
```

3. **Create hook in `src/hooks/useMyNewFeature.ts`:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useMyNewFeature = () => {
  return useQuery({
    queryKey: ['my-new-feature'],
    queryFn: () => api.myNewEndpoint.list(),
  });
};
```

### Update Existing Component

1. **Import hooks:**
```typescript
import { useArticles } from '@/hooks';
```

2. **Use hook in component:**
```typescript
const { data, isLoading } = useArticles();
```

3. **Handle states:**
```typescript
if (isLoading) return <Loading />;
if (!data) return <Error />;
```

## Debugging Tips

### Check API Calls

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "fetch"
4. Look for API calls to `/api/v1/*`
5. Check request/response headers

### Check Auth Tokens

1. Open DevTools Console
2. Run:
```javascript
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
```

### Check React Query DevTools

1. Install React Query DevTools:
```bash
npm install @tanstack/react-query-devtools
```

2. Add to App.tsx:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In JSX:
<ReactQueryDevtools initialIsOpen={false} />
```

## Troubleshooting

### "Cannot find module '@/hooks'"

**Solution:** Check import path
```typescript
// Correct
import { useArticles } from '@/hooks';

// Wrong
import { useArticles } from './hooks';
```

### "useAuth must be used within AuthProvider"

**Solution:** Ensure App.tsx wraps with AuthProvider
```typescript
<AuthProvider>
  <App />
</AuthProvider>
```

### 401 Unauthorized Errors

**Check:**
1. Backend API is running
2. Token exists in localStorage
3. Token is not expired
4. Authorization header is set

### CORS Errors

**Backend fix:** Add CORS middleware
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Next Steps

1. ✅ Test authentication flow
2. ✅ Test article creation
3. ✅ Test data fetching
4. 📝 Update remaining pages (ArticleDetail, Articles list)
5. 📝 Add loading skeletons
6. 📝 Add error boundaries
7. 📝 Write tests
8. 📝 Deploy to production

## Getting Help

- Check `MIGRATION_GUIDE.md` for detailed migration info
- Check `API_INTEGRATION_SUMMARY.md` for complete overview
- Check hook files for usage examples
- Check browser console for errors

## Environment Variables Reference

```env
# Required
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Optional
VITE_API_TIMEOUT=30000
VITE_ENABLE_COMMENTS=true
VITE_ENABLE_LIKES=true
VITE_ENABLE_BOOKMARKS=true
```

---

**Ready to build!** Start the dev server and test your integration. 🚀
