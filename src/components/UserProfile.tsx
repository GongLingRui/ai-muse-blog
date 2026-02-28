import { useParams } from "react-router-dom";
import { useUserProfile, useArticles } from "@/services/queries";
import UserCard from "./UserCard";
import ArticleCard from "./ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bookmark as BookmarkIcon, Heart } from "lucide-react";
import { useBookmarks } from "@/services/queries";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, isLoading: userLoading } = useUserProfile(userId || "");
  const { data: articlesData, isLoading: articlesLoading } = useArticles(
    1,
    10,
    { author_id: userId, published: true }
  );
  const { data: bookmarksData, isLoading: bookmarksLoading } = useBookmarks(1, 10);

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">用户不存在</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="lg:col-span-1">
          <UserCard user={user} />
        </div>

        {/* Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="articles">
                <FileText className="h-4 w-4 mr-2" />
                文章 ({articlesData?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="bookmarks">
                <BookmarkIcon className="h-4 w-4 mr-2" />
                收藏 ({bookmarksData?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="likes">
                <Heart className="h-4 w-4 mr-2" />
                点赞
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="mt-6">
              {articlesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : articlesData && articlesData.data.length > 0 ? (
                <div className="space-y-4">
                  {articlesData.data.map((article, index) => (
                    <ArticleCard key={`profile-article-${article.id}-${index}`} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">暂无文章</p>
                </div>
              )}
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="mt-6">
              {bookmarksLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : bookmarksData && bookmarksData.data.length > 0 ? (
                <div className="space-y-4">
                  {bookmarksData.data.map((bookmark, index) => (
                    bookmark.article && (
                      <ArticleCard key={`profile-bookmark-${bookmark.id}-${index}`} article={bookmark.article} />
                    )
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">暂无收藏</p>
                </div>
              )}
            </TabsContent>

            {/* Likes Tab */}
            <TabsContent value="likes" className="mt-6">
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">功能开发中...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
