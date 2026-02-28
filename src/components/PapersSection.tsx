import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Calendar, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date: string;
  category: string;
  pdf_url?: string | null;
  view_count: number;
  topic_tags?: string[];
  summary_zh?: string;
}

interface PapersSectionProps {
  searchQuery?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PapersSection = ({ searchQuery = "" }: PapersSectionProps) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const loadMorePapers = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: "6",
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.papers.list(params) as {
        success: boolean;
        data: Paper[];
        pagination: {
          total: number;
          has_more: boolean;
        };
      };

      if (response.success) {
        if (reset) {
          setPapers(response.data);
        } else {
          setPapers((prev) => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.has_more);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch papers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMorePapers(true);
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage((prev) => prev + 1);
      loadMorePapers();
    }
  }, [inView, hasMore, loading]);

  const handleOpenPDF = (paper: Paper) => {
    window.open(`/papers/${paper.id}`, "_blank");
  };

  if (papers.length === 0 && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {papers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper, index) => (
              <Card key={`paper-${paper.id}-${index}`} className="border-border/50 shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {paper.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {paper.view_count}
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-2 min-h-[48px]">
                    {paper.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {paper.summary_zh || paper.summary}
                  </p>
                  {paper.topic_tags && paper.topic_tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {paper.topic_tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={`${paper.id}-tag-${idx}`} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1 truncate">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      {paper.authors.split(", ").slice(0, 2).join(", ")}
                      {paper.authors.split(",").length > 2 && " 等"}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Calendar className="h-3 w-3" />
                      {formatDate(paper.published_date)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenPDF(paper)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    查看详情
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div ref={ref} className="flex justify-center py-8">
              {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            共 {total} 篇论文
          </div>
        </>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "没有找到匹配的论文" : "暂无论文"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? "尝试使用其他关键词搜索" : "论文即将上线"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PapersSection;
