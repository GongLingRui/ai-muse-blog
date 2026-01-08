import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, Heart, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToggleLike, useToggleBookmark } from "@/services/queries";
import { useOptimisticCounter, useOptimisticToggle } from "@/hooks/useOptimisticUpdate";
import { useState } from "react";
import { Article as ArticleType } from "@/types";

interface ArticleCardProps {
  article: ArticleType;
  className?: string;
}

const tagColors: Record<string, string> = {
  "大模型": "bg-blue-100 text-blue-700 border-blue-200",
  "AI": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "工程": "bg-green-100 text-green-700 border-green-200",
  "攻击": "bg-red-100 text-red-700 border-red-200",
  "Agent": "bg-purple-100 text-purple-700 border-purple-200",
  "AIGC": "bg-pink-100 text-pink-700 border-pink-200",
  "图像生成": "bg-orange-100 text-orange-700 border-orange-200",
  "视频生成": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "推理": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "模型量化": "bg-teal-100 text-teal-700 border-teal-200",
};

const ArticleCard = ({ article, className }: ArticleCardProps) => {
  const toggleLikeMutation = useToggleLike();
  const toggleBookmarkMutation = useToggleBookmark();

  // Optimistic state for likes
  const [localLiked, setLocalLiked] = useState(article.is_liked || false);
  const { count: likeCount, increment: incrementLikes, decrement: decrementLikes } =
    useOptimisticCounter(article.like_count || 0);

  // Optimistic state for bookmarks
  const [localBookmarked, setLocalBookmarked] = useState(article.is_bookmarked || false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newValue = !localLiked;
    setLocalLiked(newValue);

    try {
      if (newValue) {
        await incrementLikes(async () => {
          const result = await toggleLikeMutation.mutateAsync(article.id);
          return result.count;
        });
      } else {
        await decrementLikes(async () => {
          const result = await toggleLikeMutation.mutateAsync(article.id);
          return result.count;
        });
      }
    } catch (error) {
      setLocalLiked(!newValue);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newValue = !localBookmarked;
    setLocalBookmarked(newValue);

    try {
      await toggleBookmarkMutation.mutateAsync(article.id);
    } catch (error) {
      setLocalBookmarked(!newValue);
    }
  };

  return (
    <Link to={`/article/${article.id}`}>
      <Card
        className={cn(
          "group overflow-hidden border-border bg-card transition-all duration-300 shadow-card",
          "hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30",
          className
        )}
      >
        <CardHeader className="pt-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  tagColors[tag.name] || "bg-secondary text-secondary-foreground border-border"
                )}
              >
                {tag.name}
              </Badge>
            ))}
            {(article.tags?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground">
                +{(article.tags?.length || 0) - 3}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Excerpt */}
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
          {/* Meta Info */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-3.5 w-3.5" />
              <span>{article.author?.full_name || article.author?.email || "匿名"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20",
                localLiked && "text-red-500 bg-red-50 dark:bg-red-950/20"
              )}
            >
              <Heart className={cn("h-4 w-4", localLiked && "fill-current")} />
              <span className="ml-1 text-xs">{likeCount}</span>
            </Button>

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={cn(
                "h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/5",
                localBookmarked && "text-primary bg-primary/5"
              )}
            >
              <Bookmark className={cn("h-4 w-4", localBookmarked && "fill-current")} />
            </Button>

            {/* Read More */}
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-8 font-medium"
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ArticleCard;
