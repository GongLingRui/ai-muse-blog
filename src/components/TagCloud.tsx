import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useTags } from "@/services/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagCloudProps {
  limit?: number;
  className?: string;
}

const TagCloud = ({ limit = 50, className }: TagCloudProps) => {
  const { data: tags, isLoading } = useTags();

  if (isLoading) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <TagIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无标签</p>
      </div>
    );
  }

  const displayTags = tags.slice(0, limit);
  const maxCount = Math.max(...displayTags.map((tag) => tag.articles_count || 0));

  const getTagSize = (count: number) => {
    const ratio = (count || 0) / maxCount;
    if (ratio > 0.7) return "text-base px-4 py-2";
    if (ratio > 0.4) return "text-sm px-3 py-1.5";
    return "text-xs px-2 py-1";
  };

  const getTagColor = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
      "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
      "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
      "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200",
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
      "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200",
      "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayTags.map((tag, index) => (
        <Link key={tag.id} to={`/articles?tag=${tag.slug}`}>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 border hover:scale-105",
              getTagSize(tag.articles_count || 0),
              tag.color || getTagColor(index)
            )}
          >
            <span className="font-medium">{tag.name}</span>
            <span className="ml-1.5 opacity-70">
              {tag.articles_count || 0}
            </span>
          </Badge>
        </Link>
      ))}
    </div>
  );
};

export default TagCloud;
