import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import ArticleCard, { Article } from "@/components/ArticleCard";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  slug: string;
  article_count: number;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

// arXiv 论文类型（从 Papers 页面复用）
interface ArxivPaper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date: string;
  category: string;
  pdf_url?: string | null;
  view_count: number;
}

// 统一的内容类型 - 可以是 Article 或 ArxivPaper
interface ContentItem extends Article {
  type?: 'article' | 'paper';
  arxiv_id?: string;
  category?: string;
}

const Articles = () => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // API 数据状态
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [papers, setPapers] = useState<ArxivPaper[]>([]);

  // 标签到 arXiv 分类的映射（更完整的映射）
  const tagToArxivCategory: Record<string, string[]> = {
    "大模型": ["cs.AI", "cs.CL", "cs.LG"],
    "AI": ["cs.AI", "cs.CL", "cs.CV", "cs.LG", "cs.NE"],
    "工程": ["cs.AI", "cs.CL", "cs.LG", "cs.RO"],
    "攻击": ["cs.CR", "cs.AI"],
    "Agent": ["cs.AI", "cs.RO", "cs.LG"],
    "AIGC": ["cs.CV", "cs.CL", "cs.AI"],
    "图像生成": ["cs.CV"],
    "视频生成": ["cs.CV"],
    "推理": ["cs.AI", "cs.LG"],
    "模型量化": ["cs.LG"],
    "计算机视觉": ["cs.CV"],
    "自然语言处理": ["cs.CL"],
    "机器学习": ["cs.LG", "stat.ML"],
    "强化学习": ["cs.LG", "cs.AI", "cs.RO"],
    "深度学习": ["cs.LG", "cs.AI", "cs.CV", "cs.CL"],
    "Transformer": ["cs.CL", "cs.CV", "cs.LG"],
    "GPT": ["cs.CL", "cs.AI"],
    "扩散模型": ["cs.CV", "cs.LG"],
    "多模态": ["cs.CV", "cs.CL", "cs.AI"],
    "预训练": ["cs.CL", "cs.LG"],
    "微调": ["cs.CL", "cs.LG"],
    "RLHF": ["cs.CL", "cs.AI"],
    "LoRA": ["cs.LG"],
    "量化": ["cs.LG"],
    "分割": ["cs.CV"],
    "目标检测": ["cs.CV"],
    "分类": ["cs.CV", "cs.LG"],
    "推荐系统": ["cs.IR", "cs.LG"],
    "搜索": ["cs.IR", "cs.CL"],
    "知识图谱": ["cs.AI", "cs.CL"],
    "对话系统": ["cs.CL", "cs.AI"],
    "机器人": ["cs.RO"],
    "自动驾驶": ["cs.RO", "cs.CV"],
    "语音识别": ["cs.CL", "cs.SD"],
    "合成数据": ["cs.AI", "cs.LG", "cs.CV"],
    "数据增强": ["cs.CV", "cs.LG"],
    "迁移学习": ["cs.LG", "cs.CV"],
    "联邦学习": ["cs.LG", "cs.CR"],
    "可解释性": ["cs.AI", "cs.LG"],
    "对抗攻击": ["cs.CR", "cs.CV", "cs.LG"],
    "隐私保护": ["cs.CR", "cs.LG"],
    "图神经网络": ["cs.LG", "cs.SI"],
    "时序预测": ["cs.LG", "cs.AI"],
    "异常检测": ["cs.LG", "cs.CV"],
    "生成式AI": ["cs.AI", "cs.CL", "cs.CV"],
    "大语言模型": ["cs.CL", "cs.AI"],
    "提示工程": ["cs.CL", "cs.AI"],
    "Agent开发": ["cs.AI", "cs.RO"],
    "RAG": ["cs.CL", "cs.IR", "cs.AI"],
    "向量数据库": ["cs.DB", "cs.IR", "cs.AI"],
  };

  // 获取标签列表
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.tags.list() as { success: boolean; data: Tag[] };
        if (response.success) {
          setTags(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };
    fetchTags();
  }, []);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.list() as { success: boolean; data: Category[] };
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // 获取文章列表
  useEffect(() => {
    fetchArticles(true);
  }, [selectedTag, searchQuery]);

  const fetchArticles = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }

    try {
      // 1. 获取 Articles
      const articleParams: Record<string, string> = {
        page: reset ? "1" : page.toString(),
        page_size: "20",
        status: "published",
      };

      if (searchQuery) {
        articleParams.search = searchQuery;
      }

      if (selectedTag !== "全部") {
        const tag = tags.find(t => t.name === selectedTag);
        if (tag) {
          articleParams.tag_id = tag.id;
        }
      }

      const [articlesResponse, papersResponse] = await Promise.all([
        api.articles.list(articleParams),
        // 获取 Papers（如果有标签筛选，使用对应的 arXiv 分类）
        (async () => {
          const paperParams: Record<string, string> = {
            page: "1",
            page_size: "20",
            sort: "published_date",
            order: "desc",
          };

          if (searchQuery) {
            paperParams.search = searchQuery;
          }

          // 如果选择了特定标签，使用对应的 arXiv 分类
          if (selectedTag !== "全部" && tagToArxivCategory[selectedTag]) {
            // 使用第一个匹配的分类
            paperParams.category = tagToArxivCategory[selectedTag][0];
          }

          try {
            return await api.papers.list(paperParams) as {
              success: boolean;
              data: ArxivPaper[];
              pagination: any;
            };
          } catch (error) {
            console.error("Failed to fetch papers:", error);
            return { success: true, data: [], pagination: {} };
          }
        })(),
      ]);

      let contentItems: ContentItem[] = [];

      // 2. 添加 Articles（标记为 article 类型）
      if (articlesResponse.success) {
        const articlesWithType = (articlesResponse.data as Article[]).map(article => ({
          ...article,
          type: 'article' as const,
        }));
        contentItems = [...contentItems, ...articlesWithType];
      }

      // 3. 添加 Papers（转换为 Article 格式并标记为 paper 类型）
      if (papersResponse.success && papersResponse.data) {
        const papersAsArticles = papersResponse.data.map((paper: ArxivPaper) => ({
          id: paper.id,
          title: paper.title,
          content: paper.summary,
          excerpt: paper.summary.substring(0, 200) + "...",
          author: paper.authors.split(",")[0] || "Unknown",
          author_name: paper.authors.split(",")[0] || "Unknown",
          author_avatar: null,
          published_date: paper.published_date,
          created_at: paper.published_date,
          updated_at: paper.published_date,
          category: null,
          category_id: null,
          tag_list: [paper.category],
          cover_image: null,
          view_count: paper.view_count,
          like_count: 0,
          comment_count: 0,
          type: 'paper' as const,
          arxiv_id: paper.arxiv_id,
          category_code: paper.category,
        } as ContentItem));
        contentItems = [...contentItems, ...papersAsArticles];
      }

      // 4. 按发布日期排序（最新的在前）
      contentItems.sort((a, b) => {
        const dateA = new Date(a.published_date || a.created_at);
        const dateB = new Date(b.published_date || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      if (reset) {
        setArticles(contentItems);
      } else {
        setArticles(prev => [...prev, ...contentItems]);
      }

      // 计算总数（articles + papers）
      const articlesTotal = articlesResponse.pagination?.total || 0;
      const papersTotal = papersResponse.pagination?.total || 0;
      setTotal(articlesTotal + papersTotal);
      setHasMore(false); // 简化：不支持无限滚动混合内容
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      toast.error("加载文章失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取过滤后的标签（合并"全部"选项）
  const allTags = [
    { id: "all", name: "全部", slug: "all", article_count: total },
    ...tags,
  ];

  const filteredArticles = articles;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 flex">
        {/* Sidebar - Tags (Desktop) */}
        <aside
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
            sidebarOpen ? "w-64" : "w-14",
            "hidden md:block"
          )}
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  文章分类
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 mx-auto"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className={cn("p-2", !sidebarOpen && "px-1")}>
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.name)}
                  title={!sidebarOpen ? tag.name : undefined}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 mb-1",
                    sidebarOpen ? "justify-between px-4 py-3" : "justify-center py-3",
                    selectedTag === tag.name
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {sidebarOpen ? (
                    <>
                      <span>{tag.name}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          selectedTag === tag.name
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {tag.article_count}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xs">{tag.name.slice(0, 2)}</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Toggle Sidebar Button - Mobile */}
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-20 z-50 md:hidden bg-card border-border shadow-card"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
        </Button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-transform duration-300 z-40 w-64",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "md:hidden"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              文章分类
            </h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {allTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => {
                    setSelectedTag(tag.name);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1",
                    selectedTag === tag.name
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{tag.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      selectedTag === tag.name
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {tag.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)]",
            sidebarOpen ? "md:ml-64" : "md:ml-14"
          )}
        >
          <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {selectedTag === "全部" ? "全部文章" : selectedTag}
                </h1>
                <p className="text-sm text-muted-foreground">
                  共 {filteredArticles.length} 篇文章
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[280px] bg-secondary/50 border-border focus:border-primary/50"
                />
              </div>
            </div>

            {/* Articles Grid */}
            {loading && articles.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">加载文章中...</p>
                </div>
              </div>
            ) : filteredArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredArticles.map((article, index) => (
                    <ArticleCard key={`article-${article.id}-${index}`} article={article} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPage(prev => prev + 1);
                        fetchArticles(false);
                      }}
                      disabled={loading}
                      className="min-w-[120px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        "加载更多"
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl">📭</span>
                </div>
                <p className="text-xl font-medium text-foreground mb-2">暂无文章</p>
                <p className="text-muted-foreground">
                  该分类下暂无文章，请尝试其他分类
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Articles;
