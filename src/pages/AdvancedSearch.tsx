import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Loader2,
  SlidersHorizontal,
  X,
  Clock,
  Star,
  Bookmark,
  ChevronDown,
  FileText,
  Calendar,
  User,
  Tag,
  Save,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date: string;
  category: string;
  pdf_url: string | null;
  citation_count?: number;
  views?: number;
}

interface Category {
  id: string;
  name: string;
  arxiv_category: string;
  paper_count: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  created_at: string;
}

interface SearchFilters {
  query: string;
  title_only?: boolean;
  authors?: string;
  abstract?: string;
  keywords?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  min_citations?: number;
  sort_by?: string;
}

const AdvancedSearch = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [results, setResults] = useState<Paper[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    title_only: false,
    authors: "",
    abstract: "",
    keywords: "",
    category: "",
    date_from: "",
    date_to: "",
    min_citations: "",
    sort_by: "relevance",
  });

  // UI state
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchCategories();
    loadRecentSearches();
    loadSavedSearches();
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await api.search.getCategories() as {
        success: boolean;
        data: Category[];
      };
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const loadRecentSearches = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.searchHistory.list({ page: "1", page_size: "10" }) as {
        success: boolean;
        data: Array<{ query: string }>;
      };
      if (response.success && response.data) {
        const queries = response.data
          .map(h => h.query)
          .filter((q): q is string => q !== null && q !== undefined && q !== "");
        setRecentSearches(queries);
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await api.savedSearches.list() as {
        success: boolean;
        data: SavedSearch[];
      };
      if (response.success && response.data) {
        setSavedSearches(response.data);
      }
    } catch (error) {
      console.error("Failed to load saved searches:", error);
    }
  };

  const handleSearch = async (searchPage: number = 1) => {
    if (!filters.query.trim() &&
        !filters.authors?.trim() &&
        !filters.abstract?.trim() &&
        !filters.keywords?.trim()) {
      toast.error("请输入搜索关键词");
      return;
    }

    setSearching(true);
    try {
      const params: Record<string, string> = {};

      if (filters.query) params.q = filters.query;
      if (filters.title_only) params.title_only = "true";
      if (filters.authors) params.authors = filters.authors;
      if (filters.abstract) params.abstract = filters.abstract;
      if (filters.keywords) params.keywords = filters.keywords;
      if (filters.category) params.category = filters.category;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.min_citations) params.min_citations = filters.min_citations;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      params.page = searchPage.toString();
      params.page_size = pageSize.toString();

      const response = await api.search.search(params) as {
        success: boolean;
        data: {
          papers: Paper[];
          total: number;
          page: number;
          page_size: number;
        };
      };

      if (response.success) {
        setResults(response.data.papers);
        setTotalResults(response.data.total);
        setPage(searchPage);
        setHasSearched(true);

        // Reload recent searches from backend (search history is auto-saved)
        if (isAuthenticated && searchPage === 1) {
          loadRecentSearches();
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      query: "",
      title_only: false,
      authors: "",
      abstract: "",
      keywords: "",
      category: "",
      date_from: "",
      date_to: "",
      min_citations: "",
      sort_by: "relevance",
    });
    setResults([]);
    setHasSearched(false);
    setTotalResults(0);
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error("请输入搜索名称");
      return;
    }

    setSaving(true);
    try {
      const response = await api.savedSearches.save({
        name: saveSearchName,
        query: filters.query,
        filters: filters,
      }) as {
        success: boolean;
        data: SavedSearch;
      };

      if (response.success && response.data) {
        setSavedSearches(prev => [...prev, response.data]);
        toast.success("搜索已保存");
        setSaveDialogOpen(false);
        setSaveSearchName("");
      } else {
        toast.error("保存失败");
      }
    } catch (error) {
      console.error("Failed to save search:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(savedSearch.filters);
    setFiltersOpen(true);
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const response = await api.savedSearches.delete(id) as {
        success: boolean;
      };

      if (response.success) {
        setSavedSearches(prev => prev.filter(s => s.id !== id));
        toast.success("已删除");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("Failed to delete saved search:", error);
      toast.error("删除失败");
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                高级搜索
              </h1>
              <p className="text-muted-foreground">
                使用多种条件精确查找论文
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Panel */}
              <div className="lg:col-span-1">
                <Card className="border-border/50 sticky top-24">
                  <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <CollapsibleTrigger asChild>
                      <div className="p-4 border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4" />
                          <span className="font-medium">搜索条件</span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            filtersOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="p-4 space-y-4">
                      {/* Main search */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          关键词
                        </label>
                        <Input
                          placeholder="输入搜索关键词..."
                          value={filters.query}
                          onChange={(e) =>
                            updateFilter("query", e.target.value)
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSearch(1)
                          }
                          className="bg-secondary/30 border-border/50"
                        />
                      </div>

                      {/* Title only toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-sm">
                          仅搜索标题
                        </label>
                        <input
                          type="checkbox"
                          checked={filters.title_only}
                          onChange={(e) =>
                            updateFilter("title_only", e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                      </div>

                      {/* Authors */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          <User className="h-3 w-3 inline mr-1" />
                          作者
                        </label>
                        <Input
                          placeholder="作者姓名..."
                          value={filters.authors || ""}
                          onChange={(e) =>
                            updateFilter("authors", e.target.value)
                          }
                          className="bg-secondary/30 border-border/50"
                        />
                      </div>

                      {/* Abstract */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          摘要关键词
                        </label>
                        <Input
                          placeholder="摘要中的关键词..."
                          value={filters.abstract || ""}
                          onChange={(e) =>
                            updateFilter("abstract", e.target.value)
                          }
                          className="bg-secondary/30 border-border/50"
                        />
                      </div>

                      {/* Keywords */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          <Tag className="h-3 w-3 inline mr-1" />
                          关键词
                        </label>
                        <Input
                          placeholder="用逗号分隔..."
                          value={filters.keywords || ""}
                          onChange={(e) =>
                            updateFilter("keywords", e.target.value)
                          }
                          className="bg-secondary/30 border-border/50"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          分类
                        </label>
                        <Select
                          value={filters.category || ""}
                          onValueChange={(v) => updateFilter("category", v)}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border/50">
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">全部</SelectItem>
                            {categories.map((cat, index) => (
                              <SelectItem key={`category-${cat.id}-${index}`} value={cat.arxiv_category}>
                                {cat.name} ({cat.paper_count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date range */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          发布日期
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={filters.date_from || ""}
                            onChange={(e) =>
                              updateFilter("date_from", e.target.value)
                            }
                            className="bg-secondary/30 border-border/50"
                          />
                          <Input
                            type="date"
                            value={filters.date_to || ""}
                            onChange={(e) =>
                              updateFilter("date_to", e.target.value)
                            }
                            className="bg-secondary/30 border-border/50"
                          />
                        </div>
                      </div>

                      {/* Minimum citations */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          <Star className="h-3 w-3 inline mr-1" />
                          最少引用数
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={filters.min_citations || ""}
                          onChange={(e) =>
                            updateFilter("min_citations", e.target.value)
                          }
                          className="bg-secondary/30 border-border/50"
                        />
                      </div>

                      {/* Sort by */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          排序方式
                        </label>
                        <Select
                          value={filters.sort_by || "relevance"}
                          onValueChange={(v) => updateFilter("sort_by", v)}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">相关性</SelectItem>
                            <SelectItem value="date_desc">最新</SelectItem>
                            <SelectItem value="date_asc">最早</SelectItem>
                            <SelectItem value="citations">引用数</SelectItem>
                            <SelectItem value="views">浏览量</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-2">
                        <Button
                          onClick={() => handleSearch(1)}
                          disabled={searching}
                          className="w-full gradient-primary"
                        >
                          {searching ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              搜索中...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              搜索
                            </>
                          )}
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={handleClearFilters}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-1" />
                            清空
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => setSaveDialogOpen(true)}
                            className="w-full"
                            disabled={!hasSearched}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            保存
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-3 space-y-6">
                {/* Recent searches */}
                {recentSearches.length > 0 && !hasSearched && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">最近搜索</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((query, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-secondary/50"
                            onClick={() => {
                              updateFilter("query", query);
                              handleSearch(1);
                            }}
                          >
                            {query}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Saved searches */}
                {savedSearches.length > 0 && !hasSearched && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">保存的搜索</span>
                      </div>
                      <div className="space-y-2">
                        {savedSearches.map((saved, index) => (
                          <div
                            key={`saved-search-${saved.id}-${index}`}
                            className="flex items-center justify-between p-2 rounded bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleLoadSavedSearch(saved)}
                            >
                              <p className="text-sm font-medium">
                                {saved.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {saved.query || "(无关键词)"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => handleDeleteSavedSearch(saved.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results */}
                {hasSearched && (
                  <>
                    {/* Results count */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        找到 {totalResults} 篇论文
                      </p>
                      <div className="flex items-center gap-2">
                        {page > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearch(page - 1)}
                          >
                            上一页
                          </Button>
                        )}
                        {totalPages > 1 && (
                          <span className="text-sm">
                            第 {page} / {totalPages} 页
                          </span>
                        )}
                        {page < totalPages && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearch(page + 1)}
                          >
                            下一页
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Results list */}
                    {searching ? (
                      <Card className="border-border/50">
                        <CardContent className="py-12">
                          <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : results.length > 0 ? (
                      <div className="space-y-4">
                        {results.map((paper, index) => (
                          <Card
                            key={`search-result-${paper.id}-${index}`}
                            className="border-border/50 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => navigate(`/papers/${paper.id}`)}
                          >
                            <CardContent className="p-6">
                              <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                                {paper.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                {paper.authors}
                              </p>
                              <p className="text-sm line-clamp-3 mb-3">
                                {paper.summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {paper.category}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(paper.published_date)}
                                </span>
                                {paper.citation_count !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    {paper.citation_count} 引用
                                  </span>
                                )}
                                {paper.views !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {paper.views} 浏览
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-border/50">
                        <CardContent className="py-16">
                          <div className="text-center">
                            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                              没有找到匹配的论文
                            </h2>
                            <p className="text-muted-foreground">
                              尝试调整搜索条件
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Empty state */}
                {!hasSearched && !recentSearches.length && !savedSearches.length && (
                  <Card className="border-border/50">
                    <CardContent className="py-16">
                      <div className="text-center">
                        <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          高级论文搜索
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          使用左侧的筛选条件来精确查找论文
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Save Search Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">保存搜索</h3>
            <Input
              placeholder="输入搜索名称..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="mb-4 bg-secondary/30 border-border/50"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  setSaveSearchName("");
                }}
              >
                取消
              </Button>
              <Button onClick={handleSaveSearch} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default AdvancedSearch;
