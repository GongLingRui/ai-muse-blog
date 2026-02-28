import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Loader2,
  Trash2,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Article } from "@/types";
import { toast } from "sonner";
import ArticleCard from "@/components/ArticleCard";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [bookmarks, setBookmarks] = useState<(Article & { bookmark_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBookmark, setDeletingBookmark] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    fetchBookmarks();
  }, [isAuthenticated]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await api.bookmarks.list() as {
        success: boolean;
        data: Array<{
          id: string;
          article_id: string;
          created_at: string;
          article: Article;
        }>;
      };

      if (response.success) {
        const articlesWithBookmarkId = response.data.map((item) => ({
          ...item.article,
          bookmark_id: item.id,
          is_bookmarked: true,
        }));
        setBookmarks(articlesWithBookmarkId);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
      toast.error("加载收藏失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (bookmarkId: string) => {
    setDeletingBookmark(bookmarkId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBookmark) return;

    try {
      await api.bookmarks.delete(deletingBookmark);

      // 从本地状态移除
      setBookmarks((prev) => prev.filter((b) => b.bookmark_id !== deletingBookmark));
      toast.success("已取消收藏");
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      toast.error("取消收藏失败");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingBookmark(null);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">我的收藏</h1>
            <p className="text-muted-foreground">
              你收藏了 {bookmarks.length} 篇文章
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <Card className="border-border/50 shadow-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">加载收藏中...</p>
                </div>
              </CardContent>
            </Card>
          ) : bookmarks.length > 0 ? (
            /* Bookmarks Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((article) => (
                <div key={article.bookmark_id} className="relative group">
                  <ArticleCard article={article} />
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => handleDeleteClick(article.bookmark_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="border-border/50 shadow-card">
              <CardContent className="py-16">
                <div className="text-center">
                  <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    还没有收藏任何文章
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    浏览文章时点击收藏按钮，即可将喜欢的文章添加到这里
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="gradient-primary text-primary-foreground"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    浏览文章
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消收藏？</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将这篇文章从收藏中移除吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Bookmarks;
