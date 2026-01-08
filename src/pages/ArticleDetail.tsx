import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import ArticleCard from "@/components/ArticleCard";
import CommentSection from "@/components/CommentSection";
import CommentForm from "@/components/CommentForm";
import {
  useArticle,
  useComments,
  useArticles,
  useToggleLike,
  useToggleBookmark,
} from "@/services/queries";
import { useOptimisticCounter } from "@/hooks/useOptimisticUpdate";

// 标签颜色映射
const tagColors: Record<string, string> = {
  大模型: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
  AI: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30",
  工程: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
  攻击: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  Agent: "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
  AIGC: "bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30",
  图像生成: "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
  视频生成: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  推理: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30",
  模型量化: "bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30",
};

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: article, isLoading: articleLoading } = useArticle(id || "");
  const { data: comments, isLoading: commentsLoading } = useComments(id || "");
  const { data: relatedArticles } = useArticles(1, 3);
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();

  // Optimistic state for likes
  const [localLiked, setLocalLiked] = useState(false);
  const { count: likeCount, increment: incrementLikes, decrement: decrementLikes } =
    useOptimisticCounter(article?.like_count || 0);

  // Optimistic state for bookmarks
  const [localBookmarked, setLocalBookmarked] = useState(false);

  useEffect(() => {
    if (article) {
      setLocalLiked(article.is_liked || false);
      setLocalBookmarked(article.is_bookmarked || false);
    }
  }, [article]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleLike = async () => {
    if (!id) return;
    const newValue = !localLiked;
    setLocalLiked(newValue);

    try {
      if (newValue) {
        await incrementLikes(async () => {
          const result = await toggleLikeMutation.mutateAsync(id);
          return result.count;
        });
      } else {
        await decrementLikes(async () => {
          const result = await toggleLikeMutation.mutateAsync(id);
          return result.count;
        });
      }
    } catch (error) {
      setLocalLiked(!newValue);
    }
  };

  const handleBookmark = async () => {
    if (!id) return;
    const newValue = !localBookmarked;
    setLocalBookmarked(newValue);

    try {
      await toggleBookmarkMutation.mutateAsync(id);
    } catch (error) {
      setLocalBookmarked(!newValue);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (articleLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-6" />
          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-96 w-full mb-8" />
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-semibold mb-4">文章不存在</h2>
          <Button onClick={() => navigate("/")}>返回首页</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section with Cover Image */}
        {article.cover_image && (
          <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <div className={cn("py-6", !article.cover_image && "pt-24")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>

          {/* Article Header */}
          <header className={cn("mb-8", article.cover_image && "-mt-32 relative z-10")}>
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags?.slice(0, 5).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    tagColors[tag.name] || "bg-secondary/50 text-secondary-foreground"
                  )}
                  onClick={() => navigate(`/articles?tag=${tag.slug}`)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarImage src={article.author?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {article.author?.full_name?.[0] || article.author?.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground font-medium">
                    {article.author?.full_name || article.author?.email || "匿名"}
                  </p>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formatDate(article.published_at || article.created_at)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{article.view_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{article.comment_count || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "text-muted-foreground hover:text-red-400",
                    localLiked && "text-red-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4 mr-1", localLiked && "fill-current")} />
                  {likeCount}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={cn(
                    "text-muted-foreground hover:text-primary",
                    localBookmarked && "text-primary"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", localBookmarked && "fill-current")} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <Separator className="mb-8 bg-border/50" />

          {/* Article Content */}
          <article className="prose prose-invert prose-lg max-w-none mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;

                  if (isInline) {
                    return (
                      <code
                        className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match?.[1]}
                      PreTag="div"
                      className="rounded-lg border border-border/50 !bg-secondary/30 !my-6"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-foreground mt-10 mb-4 border-l-4 border-primary pl-4">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
                    {children}
                  </ol>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline underline-offset-4"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground bg-secondary/20 py-2 my-4 rounded-r">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          <Separator className="mb-8 bg-border/50" />

          {/* Comments Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              评论 ({article.comment_count || 0})
            </h2>

            {/* Comment Form */}
            <div className="mb-6">
              <CommentForm articleId={article.id} />
            </div>

            {/* Comments List */}
            <CommentSection
              articleId={article.id}
              comments={comments || []}
              isLoading={commentsLoading}
            />
          </section>

          <Separator className="mb-8 bg-border/50" />

          {/* Related Articles */}
          {relatedArticles && relatedArticles.data.length > 0 && (
            <section className="pb-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">相关推荐</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.data
                  .filter((a) => a.id !== article.id)
                  .slice(0, 2)
                  .map((relatedArticle) => (
                    <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                  ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2024 AI Learning Hub</p>
        </div>
      </footer>
    </div>
  );
};

export default ArticleDetail;
