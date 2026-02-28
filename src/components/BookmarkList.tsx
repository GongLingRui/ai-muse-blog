import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark as BookmarkIcon, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useBookmarks } from "@/services/queries";
import ArticleCard from "./ArticleCard";

const BookmarkList = () => {
  const { data: bookmarksData, isLoading } = useBookmarks(1, 20);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (!bookmarksData || bookmarksData.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
        <BookmarkIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">暂无收藏</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          收藏的文章会显示在这里，方便你随时阅读
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的收藏</h2>
        <span className="text-sm text-muted-foreground">
          共 {bookmarksData.total} 篇文章
        </span>
      </div>

      <div className="space-y-4">
        {bookmarksData.data.map((bookmark, index) => (
          <Card key={`bookmark-${bookmark.id}-${index}`} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Article */}
                <div className="flex-1">
                  {bookmark.article && <ArticleCard article={bookmark.article} />}
                </div>

                {/* Bookmark Info */}
                <div className="hidden sm:block w-48 shrink-0">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        收藏于{" "}
                        {formatDistanceToNow(new Date(bookmark.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BookmarkList;
