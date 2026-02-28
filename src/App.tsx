import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import WriteArticle from "./pages/WriteArticle";
import ArticleDetail from "./pages/ArticleDetail";
import Articles from "./pages/Articles";
import Papers from "./pages/Papers";
import PaperDetail from "./pages/PaperDetail";
import ClassicPapers from "./pages/ClassicPapers";
import DailyPapers from "./pages/DailyPapers";
import DailyPaperDetail from "./pages/DailyPaperDetail";
import TeamDigest from "./pages/TeamDigest";
import TagsManagement from "./pages/TagsManagement";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Bookmarks from "./pages/Bookmarks";
import Collections from "./pages/Collections";
import ReadingProgress from "./pages/ReadingProgress";
import ReadingList from "./pages/ReadingList";
import MyNotes from "./pages/MyNotes";
import AdvancedSearch from "./pages/AdvancedSearch";
import SearchHistory from "./pages/SearchHistory";
import ReadingStats from "./pages/ReadingStats";
import StudyGroups from "./pages/StudyGroups";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import AIQAAssistant from "./pages/AIQAAssistant";
import PaperComparison from "./pages/PaperComparison";
import Terminology from "./pages/Terminology";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/auth"
                    element={
                      <PublicRoute>
                        <Auth />
                      </PublicRoute>
                    }
                  />
                  <Route path="/article/:id" element={<ArticleDetail />} />
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/papers" element={<Papers />} />
                  <Route path="/papers/:id" element={<PaperDetail />} />
                  <Route path="/classic-papers" element={<ClassicPapers />} />
                  <Route path="/daily" element={<DailyPapers />} />
                  <Route path="/daily-digest" element={<TeamDigest />} />
                  <Route path="/daily/papers/:id" element={<DailyPaperDetail />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/ai-qa" element={<AIQAAssistant />} />
                  <Route path="/comparison" element={<PaperComparison />} />
                  <Route path="/terminology" element={<Terminology />} />

                  {/* Protected Routes - Require Login */}
                  <Route
                    path="/write"
                    element={
                      <ProtectedRoute>
                        <WriteArticle />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tags"
                    element={
                      <ProtectedRoute>
                        <TagsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bookmarks"
                    element={
                      <ProtectedRoute>
                        <Bookmarks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/collections"
                    element={
                      <ProtectedRoute>
                        <Collections />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reading-progress"
                    element={
                      <ProtectedRoute>
                        <ReadingProgress />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reading-list"
                    element={
                      <ProtectedRoute>
                        <ReadingList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/reading-stats"
                    element={
                      <ProtectedRoute>
                        <ReadingStats />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notes"
                    element={
                      <ProtectedRoute>
                        <MyNotes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <AdvancedSearch />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search-history"
                    element={
                      <ProtectedRoute>
                        <SearchHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/study-groups"
                    element={
                      <ProtectedRoute>
                        <StudyGroups />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </ThemeProvider>
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
