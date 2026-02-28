import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitCompare,
  Plus,
  X,
  Loader2,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PaperForComparison {
  id: string;
  title: string;
  authors: string;
  summary: string;
  category: string;
  published_date: string;
}

interface ComparisonResult {
  best_overall: number;
  most_novel: number;
  most_practical: number;
  easiest_to_understand: number;
  comparison_summary: string;
  key_differences: string[];
  recommended_reading_order: number[];
  for_researchers: number[];
  for_engineers: number[];
  for_students: number[];
}

export default function PaperComparison() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedPapers, setSelectedPapers] = useState<PaperForComparison[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PaperForComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPapers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchPapers = async () => {
    setIsLoading(true);
    try {
      const response = await api.search.search({
        q: searchQuery,
        page_size: "10",
      }) as any;

      if (response.success && response.data.data) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPaper = (paper: PaperForComparison) => {
    if (selectedPapers.length >= 5) {
      toast.error("最多只能对比5篇论文");
      return;
    }
    if (selectedPapers.some((p) => p.id === paper.id)) {
      toast.error("该论文已在对比列表中");
      return;
    }
    setSelectedPapers([...selectedPapers, paper]);
    setSearchQuery("");
    setSearchResults([]);
    setComparisonResult(null);
  };

  const removePaper = (paperId: string) => {
    setSelectedPapers(selectedPapers.filter((p) => p.id !== paperId));
    setComparisonResult(null);
  };

  const startComparison = async () => {
    if (selectedPapers.length < 2) {
      toast.error("请至少选择2篇论文进行对比");
      return;
    }

    setIsComparing(true);
    try {
      const response = await api.aiScoring.comparePapers({
        paper_ids: selectedPapers.map((p) => p.id),
      }) as any;

      if (response.success) {
        setComparisonResult(response.data.comparison);
        toast.success("论文对比完成");
      } else {
        toast.error("对比失败，请稍后重试");
      }
    } catch (error: any) {
      console.error("Comparison failed:", error);
      toast.error(error.message || "对比失败");
    } finally {
      setIsComparing(false);
    }
  };

  const getPaperById = (id: number) => {
    return selectedPapers[id - 1];
  };

  const getPaperScoreLabel = (type: string) => {
    const labels: Record<string, string> = {
      best_overall: "综合最佳",
      most_novel: "最具创新",
      most_practical: "最实用",
      easiest_to_understand: "最易懂",
    };
    return labels[type] || type;
  };

  const getPaperScoreIcon = (type: string) => {
    const icons: Record<string, any> = {
      best_overall: Award,
      most_novel: Star,
      most_practical: TrendingUp,
      easiest_to_understand: BookOpen,
    };
    return icons[type] || Star;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <GitCompare className="h-8 w-8 text-primary" />
              AI 论文对比
            </h1>
            <p className="text-muted-foreground">
              选择2-5篇论文进行深度对比分析，了解各自的优劣势
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Paper Selection */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">搜索论文</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="输入关键词搜索..."
                      className="w-full px-3 py-2 bg-secondary/30 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <ScrollArea className="h-64 border rounded border-border/50">
                      <div className="p-2 space-y-2">
                        {searchResults.map((paper) => (
                          <div
                            key={paper.id}
                            className="p-2 rounded bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors"
                            onClick={() => addPaper(paper)}
                          >
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {paper.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paper.authors}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Selected Papers */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>已选择论文 ({selectedPapers.length}/5)</span>
                    {selectedPapers.length >= 2 && (
                      <Button
                        size="sm"
                        onClick={startComparison}
                        disabled={isComparing}
                        className="gradient-primary"
                      >
                        {isComparing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            对比中...
                          </>
                        ) : (
                          <>
                            <GitCompare className="h-4 w-4 mr-2" />
                            开始对比
                          </>
                        )}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPapers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      搜索并添加论文开始对比
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPapers.map((paper, idx) => (
                        <div
                          key={paper.id}
                          className="p-2 rounded bg-secondary/30 flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary">
                                  #{idx + 1}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {paper.category}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium line-clamp-1">
                              {paper.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {paper.authors}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => removePaper(paper.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Comparison Results */}
            <div className="lg:col-span-2">
              {!comparisonResult ? (
                <Card className="border-border/50 min-h-[400px]">
                  <CardContent className="flex items-center justify-center h-full py-16">
                    <div className="text-center">
                      <GitCompare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        论文对比
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        选择2-5篇论文进行AI深度对比分析
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        对比总结
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {comparisonResult.comparison_summary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Awards */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(comparisonResult).map(([key, value]) => {
                      if (
                        !["best_overall", "most_novel", "most_practical", "easiest_to_understand"].includes(
                          key
                        )
                      )
                        return null;

                      const Icon = getPaperScoreIcon(key);
                      const paper = getPaperById(value as number);

                      return (
                        <Card key={key} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {getPaperScoreLabel(key)}
                                </p>
                              </div>
                            </div>
                            {paper && (
                              <>
                                <p className="text-sm font-semibold mb-1 line-clamp-2">
                                  {paper.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {paper.authors}
                                </p>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Key Differences */}
                  {comparisonResult.key_differences.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>主要差异</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {comparisonResult.key_differences.map((diff, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommended Reading Order */}
                  {comparisonResult.recommended_reading_order.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle>推荐阅读顺序</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {comparisonResult.recommended_reading_order.map((id, idx) => {
                            const paper = getPaperById(id);
                            if (!paper) return null;

                            return (
                              <div
                                key={id}
                                className="flex items-center gap-3 p-3 rounded bg-secondary/30"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium line-clamp-1">
                                    {paper.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {paper.category}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Audience-specific Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {comparisonResult.for_researchers?.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            研究人员
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {comparisonResult.for_researchers.map((id) => {
                            const paper = getPaperById(id);
                            return paper ? (
                              <p key={id} className="text-sm line-clamp-2 mb-1">
                                • {paper.title}
                              </p>
                            ) : null;
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {comparisonResult.for_engineers?.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            工程师
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {comparisonResult.for_engineers.map((id) => {
                            const paper = getPaperById(id);
                            return paper ? (
                              <p key={id} className="text-sm line-clamp-2 mb-1">
                                • {paper.title}
                              </p>
                            ) : null;
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {comparisonResult.for_students?.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            学生
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {comparisonResult.for_students.map((id) => {
                            const paper = getPaperById(id);
                            return paper ? (
                              <p key={id} className="text-sm line-clamp-2 mb-1">
                                • {paper.title}
                              </p>
                            ) : null;
                          })}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
