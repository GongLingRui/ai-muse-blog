import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Annotation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, BookMarked, Highlighter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface HighlightListProps {
  paperId: string;
  highlights: Annotation[];
  onHighlightClick?: (pageNumber: number) => void;
  onRefresh?: () => void;
}

const HighlightList = ({ paperId, highlights, onHighlightClick, onRefresh }: HighlightListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.annotations.delete(id);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete highlight:", error);
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const highlightItems = highlights.filter(h => h.annotation_type === 'highlight');

  if (highlightItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Highlighter className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">还没有划线笔记</p>
        <p className="text-xs text-muted-foreground mt-1">选中PDF中的文本并添加笔记</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">我的划线笔记 ({highlightItems.length})</h3>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {highlightItems.map((highlight, index) => (
            <Card key={`highlight-${highlight.id}-${index}`} className="border-border/50 bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {highlight.page_number && (
                      <Badge
                        variant="outline"
                        className="mb-2 text-xs cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                        onClick={() => onHighlightClick?.(highlight.page_number!)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        第 {highlight.page_number} 页
                      </Badge>
                    )}

                    {highlight.highlighted_text && (
                      <div className="mt-2 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 line-clamp-3">
                          "{highlight.highlighted_text}"
                        </p>
                      </div>
                    )}

                    {highlight.content && highlight.content !== `关于: "${highlight.highlighted_text}"\n\n` && (
                      <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">
                        {highlight.content}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(highlight.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(highlight.id)}
                    disabled={deletingId === highlight.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HighlightList;
