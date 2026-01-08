import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
  tags: string[];
}

interface ArticleCardProps {
  article: Article;
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <CardHeader className={cn(!article.coverImage && "pt-6")}>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  tagColors[tag] || "bg-secondary text-secondary-foreground border-border"
                )}
              >
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs bg-secondary text-muted-foreground">
                +{article.tags.length - 3}
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
              <span>{article.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>

          {/* Read More */}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80 hover:bg-primary/5 p-0 h-auto font-medium"
          >
            阅读更多
            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ArticleCard;
