import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { Article } from "@/types";
import ArticleCard from "./ArticleCard";
import TagFilter from "./TagFilter";
import { api } from "@/lib/api";

// 预设标签
const PRESET_TAGS = [
  "大模型",
  "AI",
  "工程",
  "攻击",
  "Agent",
  "AIGC",
  "图像生成",
  "视频生成",
  "推理",
  "模型量化",
];

interface ArticleListProps {
  searchQuery?: string;
}

const ArticleList = ({ searchQuery = "" }: ArticleListProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // 加载更多文章
  const loadMoreArticles = async (reset = false) => {
    if (loading) return;

    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: "9",
        status: "published",
      };

      // 添加搜索参数
      if (searchQuery) {
        params.search = searchQuery;
      }

      // 添加标签筛选
      if (selectedTags.length > 0) {
        // 后端可能只支持单个 tag_id，这里简化处理
        // 如果需要多标签筛选，需要后端支持
        params.tag_id = selectedTags[0];
      }

      const response = await api.articles.list(params) as {
        success: boolean;
        data: Article[];
        pagination: {
          total: number;
          page: number;
          page_size: number;
          has_more: boolean;
        };
      };

      if (response.success) {
        const newArticles = response.data.map((article) => ({
          ...article,
          // 确保标签格式正确
          tags: article.tags?.map((tag) => tag.name) || [],
        }));

        if (reset) {
          setArticles(newArticles);
          setPage(2);
        } else {
          setArticles((prev) => [...prev, ...newArticles]);
          setPage((prev) => prev + 1);
        }

        setTotal(response.pagination.total);
        setHasMore(response.pagination.has_more || (currentPage * 9) < response.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
      // 发生错误时，可以显示模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadMoreArticles(true);
  }, []);

  // 当搜索查询或标签改变时重新加载
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMoreArticles(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedTags]);

  // 无限滚动触发
  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMoreArticles();
    }
  }, [inView]);

  // 标签筛选
  const handleTagSelect = (tag: string) => {
    if (tag === "") {
      setSelectedTags([]);
    } else {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag]
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 标签筛选 */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-card">
        <h3 className="text-sm font-medium text-foreground mb-3">按标签筛选</h3>
        <TagFilter
          tags={PRESET_TAGS}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
        />
      </div>

      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{total}</span> 篇文章
          {searchQuery && (
            <span>
              ，搜索 "<span className="text-primary">{searchQuery}</span>"
            </span>
          )}
        </p>
      </div>

      {/* 文章列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard key={`article-list-${article.id}-${index}`} article={article} />
        ))}
      </div>

      {/* 加载指示器 */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>加载更多文章...</span>
            </div>
          )}
        </div>
      )}

      {/* 没有更多文章 */}
      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">已加载全部文章</p>
        </div>
      )}

      {/* 无匹配结果 */}
      {articles.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-2xl">📭</span>
          </div>
          <p className="text-xl font-medium text-foreground mb-2">暂无匹配的文章</p>
          <p className="text-muted-foreground">
            尝试选择其他标签或修改搜索关键词
          </p>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
