import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Filter,
  GraduationCap,
  Brain,
  Database,
  Network,
  Zap,
  MessageSquare,
  FileText,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Term {
  term_cn: string;
  term_en: string;
  category: string;
  definition: string;
  key_points: string[];
  common_misconceptions: string[];
  related_terms: string[];
  practical_tips: string;
}

interface Category {
  name: string;
  display_name: string;
  count: number;
  icon: string;
}

const categoryIcons: Record<string, any> = {
  "深度学习": Brain,
  "机器学习": Zap,
  "自然语言处理": MessageSquare,
  "计算机视觉": FileText,
  "强化学习": TrendingUp,
  "知识图谱": Network,
  "数据集": Database,
  "评估指标": GraduationCap,
};

export default function Terminology() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchResults, setSearchResults] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      searchTerms();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.terminology.getCategories() as {
        success: boolean;
        data: Category[];
      };
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const searchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await api.terminology.searchTerms(
        searchQuery,
        selectedCategory === "all" ? undefined : selectedCategory,
        20
      ) as { success: boolean; data: Term[] };

      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermClick = async (term: string) => {
    setIsLoading(true);
    try {
      const response = await api.terminology.getTerm(term) as {
        success: boolean;
        data: Term;
      };

      if (response.success) {
        setSelectedTerm(response.data);
      } else {
        toast.error("术语不存在");
      }
    } catch (error) {
      console.error("Failed to load term:", error);
      toast.error("加载术语失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(category === "all" ? "" : category);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              AI/ML 术语知识库
            </h1>
            <p className="text-muted-foreground">
              搜索和浏览人工智能和机器学习领域的专业术语解释
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Search and Categories */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">搜索术语</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="输入术语（中英文）..."
                      className="pl-10 bg-secondary/30"
                    />
                  </div>

                  {/* Filter by Category */}
                  <div className="mt-4">
                    <label className="text-sm font-medium mb-2 block">分类筛选</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryClick(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary/30 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option key="all" value="all">全部分类</option>
                      {categories.map((cat, index) => (
                        <option key={`category-${cat.name}-${index}`} value={cat.name}>
                          {cat.display_name} ({cat.count})
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    术语分类
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCategories ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant={selectedCategory === "all" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => handleCategoryClick("all")}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        全部术语
                      </Button>
                      {categories.map((cat, index) => {
                        const Icon = categoryIcons[cat.display_name] || BookOpen;
                        return (
                          <Button
                            key={`category-btn-${cat.name}-${index}`}
                            variant={selectedCategory === cat.name ? "default" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => handleCategoryClick(cat.name)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {cat.display_name}
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {cat.count}
                            </Badge>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hot Terms */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    热门术语
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      "Transformer", "Attention", "Fine-tuning",
                      "Prompt Engineering", "RLHF", "LoRA",
                    ].map((term) => (
                      <Button
                        key={term}
                        variant="ghost"
                        className="w-full justify-start text-sm h-auto py-2"
                        onClick={() => handleTermClick(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Results and Details */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="results">搜索结果</TabsTrigger>
                  <TabsTrigger value="detail">术语详情</TabsTrigger>
                </TabsList>

                {/* Search Results */}
                <TabsContent value="results">
                  <Card className="border-border/50 min-h-[500px]">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {searchQuery ? `"${searchQuery}" 的搜索结果` : "搜索结果"}
                        {searchResults.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {searchResults.length} 个结果
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!searchQuery ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            开始搜索术语
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            在左侧搜索框中输入任何AI/ML领域的术语，支持中英文搜索
                          </p>
                        </div>
                      ) : isLoading ? (
                        <div className="flex justify-center py-16">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            未找到相关术语
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            试试搜索其他关键词，或者切换到不同的分类
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {searchResults.map((term, idx) => (
                            <div
                              key={`search-result-${term.term_en}-${idx}`}
                              className="p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                              onClick={() => handleTermClick(term.term_en)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground">
                                      {term.term_cn}
                                    </h4>
                                    <span className="text-muted-foreground">|</span>
                                    <span className="text-sm text-muted-foreground">
                                      {term.term_en}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs mb-2">
                                    {term.category}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {term.definition}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  查看
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Term Detail */}
                <TabsContent value="detail">
                  <Card className="border-border/50 min-h-[500px]">
                    <CardHeader>
                      <CardTitle className="text-lg">术语详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!selectedTerm ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            选择一个术语
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            在搜索结果中点击任意术语查看详细解释
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Title */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="text-2xl font-bold text-foreground">
                                {selectedTerm.term_cn}
                              </h2>
                              <span className="text-muted-foreground">|</span>
                              <span className="text-xl text-muted-foreground">
                                {selectedTerm.term_en}
                              </span>
                            </div>
                            <Badge variant="outline">
                              {selectedTerm.category}
                            </Badge>
                          </div>

                          {/* Definition */}
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              定义
                            </h3>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {selectedTerm.definition}
                            </p>
                          </div>

                          {/* Key Points */}
                          {selectedTerm.key_points && selectedTerm.key_points.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                关键要点
                              </h3>
                              <ul className="space-y-2">
                                {selectedTerm.key_points.map((point, idx) => (
                                  <li key={`key-point-${idx}`} className="text-sm flex items-start gap-2">
                                    <span className="text-primary font-bold">•</span>
                                    <span className="text-foreground/90">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Practical Tips */}
                          {selectedTerm.practical_tips && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                实用提示
                              </h3>
                              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-foreground/90">
                                  💡 {selectedTerm.practical_tips}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Common Misconceptions */}
                          {selectedTerm.common_misconceptions && selectedTerm.common_misconceptions.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                常见误解
                              </h3>
                              <ul className="space-y-2">
                                {selectedTerm.common_misconceptions.map((misconception, idx) => (
                                  <li key={`misconception-${idx}`} className="text-sm flex items-start gap-2">
                                    <span className="text-orange-500">⚠️</span>
                                    <span className="text-foreground/90">{misconception}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Related Terms */}
                          {selectedTerm.related_terms && selectedTerm.related_terms.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">
                                相关术语
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedTerm.related_terms.map((related, idx) => (
                                  <Badge
                                    key={`related-term-${idx}`}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary/20"
                                    onClick={() => handleTermClick(related)}
                                  >
                                    {related}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
