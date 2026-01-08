import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/services/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  className?: string;
}

const CategoryList = ({ className }: CategoryListProps) => {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-lg">
        <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无分类</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {categories.map((category, index) => (
        <Link key={category.id} to={`/articles?category=${category.slug}`}>
          <Card className="group cursor-pointer border-border bg-card transition-all duration-300 hover:shadow-elevated hover:border-primary/30 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center transition-colors",
                  "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                )}>
                  {category.icon ? (
                    <span className="text-2xl">{category.icon}</span>
                  ) : index % 2 === 0 ? (
                    <Folder className="h-6 w-6" />
                  ) : (
                    <FolderOpen className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {category.articles_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">篇文章</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CategoryList;
