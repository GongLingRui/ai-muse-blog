import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Edit2,
  Settings,
  Loader2,
  User,
  FileText,
  Heart,
  Bookmark,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { UserProfile, Article } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        navigate("/auth");
        return;
      }

      setLoading(true);
      try {
        // 并行获取用户信息和文章
        const [profileResponse, articlesResponse] = await Promise.all([
          api.users.getUser(targetUserId) as {
            success: boolean;
            data: UserProfile;
          },
          api.articles.list({ author_id: targetUserId, limit: 10 }) as {
            success: boolean;
            data: Article[];
          },
        ]);

        if (profileResponse.success) {
          setProfile(profileResponse.data);
        }

        if (articlesResponse.success) {
          setUserArticles(articlesResponse.data);
        }

        // 检查是否是当前用户
        setIsCurrentUser(targetUserId === currentUser?.id);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("加载用户信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">用户不存在</h2>
            <Button onClick={() => navigate("/")} variant="outline">
              返回首页
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Profile Header */}
          <Card className="mb-6 border-border/50 shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.username} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                      {(profile.full_name || profile.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">
                        {profile.full_name || profile.username}
                      </h1>
                      <p className="text-muted-foreground">@{profile.username}</p>
                    </div>
                    {isCurrentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/settings")}
                        className="shrink-0"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        编辑资料
                      </Button>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-foreground mb-4">{profile.bio}</p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                        个人网站
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(profile.created_at)} 加入
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{profile.articles_count || 0}</p>
                    <p className="text-xs text-muted-foreground">文章</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                    <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{profile.followers_count || 0}</p>
                    <p className="text-xs text-muted-foreground">粉丝</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{profile.following_count || 0}</p>
                    <p className="text-xs text-muted-foreground">关注</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">-</p>
                    <p className="text-xs text-muted-foreground">收藏</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User's Articles */}
          <Card className="border-border/50 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                最近文章
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userArticles.map((article) => (
                    <div
                      key={article.id}
                      className="group p-4 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(article.published_at || article.created_at).toLocaleDateString("zh-CN")}</span>
                        <span>{article.view_count} 次浏览</span>
                        <span>{article.like_count} 点赞</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">
                    {isCurrentUser ? "你还没有发布文章" : "该用户还没有发布文章"}
                  </p>
                  {isCurrentUser && (
                    <Button onClick={() => navigate("/write")} className="gradient-primary">
                      开始写作
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
