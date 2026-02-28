import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Sparkles,
  Brain,
  Zap,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  Eye,
  MessageSquare,
  Star,
  Download,
  Maximize2,
  Lightbulb,
  Target,
  AlertCircle,
  Users,
  GraduationCap,
  Briefcase,
  BookmarkPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  categories: string[];
}

interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date: string;
  category: string;
  pdf_url: string;
  view_count: number;
}

interface PaperAnalysis {
  summary_cn: string;
  key_points: string[];
  innovations: string[];
  methods: string[];
  results: string[];
  limitations: string[];
  future_work: string[];
  reading_difficulty: string;
  recommended_for: string[];
  tags_cn: string[];
}

const DailyPapers = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("大模型");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingPaperId, setAnalyzingPaperId] = useState<string | null>(null);

  // Analysis Dialog
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [paperAnalysis, setPaperAnalysis] = useState<PaperAnalysis | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopics();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchPapers(selectedTopic);
    }
  }, [selectedTopic]);

  const fetchTopics = async () => {
    try {
      const response = await api.daily.getTopics() as { success: boolean; data: Topic[] };
      if (response.success) {
        setTopics(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const fetchPapers = async (topic: string) => {
    setLoading(true);
    try {
      const response = await api.daily.getPapers(topic, { days: "3", limit: "15" }) as {
        success: boolean;
        data: Paper[];
      };
      if (response.success) {
        setPapers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("加载论文失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.daily.getStats() as { success: boolean; data: any };
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleAnalyzePaper = async (paper: Paper) => {
    setAnalyzingPaperId(paper.id);
    setSelectedPaper(paper);
    setAnalysisDialogOpen(true);

    try {
      const response = await api.daily.analyze({
        paper_id: paper.id,
        analysis_type: "full",
      }) as {
        success: boolean;
        data: PaperAnalysis;
      };

      if (response.success) {
        setPaperAnalysis(response.data);
        toast.success("AI分析完成！");
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      toast.error(error?.detail || "AI分析失败，请稍后重试");
    } finally {
      setAnalyzingPaperId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPapers(selectedTopic);
    await fetchStats();
    setRefreshing(false);
    toast.success("已更新最新论文");
  };

  const handleSaveAnalysisToNote = async () => {
    if (!paperAnalysis || !selectedPaper) return;

    setSavingNote(true);
    try {
      const response = await api.daily.saveAnalysisToNote({
        paper_id: selectedPaper.id,
        analysis: paperAnalysis,
        note_title: `${selectedPaper.title.substring(0, 30)}... - AI解读`,
      }) as { success: boolean; data: any };

      if (response.success) {
        toast.success("已保存到笔记！");
      }
    } catch (error: any) {
      console.error("Failed to save note:", error);
      toast.error(error?.detail || "保存失败，请稍后重试");
    } finally {
      setSavingNote(false);
    }
  };

  const getTopicColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      purple: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
      green: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      indigo: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
      pink: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400",
      cyan: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400",
      orange: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
      yellow: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      teal: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays <= 7) return `${diffDays}天前`;

    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      "简单": "bg-green-100 text-green-700",
      "中等": "bg-yellow-100 text-yellow-700",
      "困难": "bg-red-100 text-red-700",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-700";
  };

  const getRecommendedForIcon = (role: string) => {
    if (role.includes("研究") || role.includes("学者")) return <GraduationCap className="h-4 w-4" />;
    if (role.includes("工程") || role.includes("开发")) return <Briefcase className="h-4 w-4" />;
    if (role.includes("学生") || role.includes("初学")) return <Users className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-foreground">每日论文更新</h1>
                <Badge className="gradient-primary text-white border-0">AI精选</Badge>
              </div>
              <p className="text-muted-foreground">
                每日自动推送最新AI论文，智谱AI深度解读，帮你快速把握前沿动态
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/daily-digest")}
                variant="outline"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                团队Digest
              </Button>
              {stats && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>今日新增 {stats.today_count} 篇</span>
                </div>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                刷新
              </Button>
            </div>
          </div>

          {/* Topics */}
          <div className="mb-6">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-4">
                {topics.map((topic, index) => (
                  <button
                    key={`topic-${topic.id}-${index}`}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      selectedTopic === topic.id
                        ? "bg-primary text-primary-foreground shadow-card"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{topic.icon}</span>
                    <span>{topic.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Selected Topic Info */}
          {topics.find((t) => t.id === selectedTopic) && (
            <Card className="border-border/50 shadow-card mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{topics.find((t) => t.id === selectedTopic)?.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">
                      {topics.find((t) => t.id === selectedTopic)?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {topics.find((t) => t.id === selectedTopic)?.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{papers.length}</div>
                    <div className="text-xs text-muted-foreground">篇论文</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Papers Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : papers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper, index) => (
                <Card
                  key={`daily-paper-${paper.id}-${index}`}
                  className="group border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={getTopicColor(topics.find((t) => t.id === selectedTopic)?.color || "blue")}>
                        {paper.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(paper.published_date)}
                      </span>
                    </div>
                    <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {paper.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {paper.summary}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>👥 {paper.authors.split(",")[0]} et al.</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/daily/papers/${paper.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gradient-primary text-white"
                        onClick={() => handleAnalyzePaper(paper)}
                        disabled={analyzingPaperId === paper.id}
                      >
                        {analyzingPaperId === paper.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            分析中
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI解读
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">暂无论文</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  该分类下暂时没有最新论文
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新获取
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Analysis Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
          {selectedPaper && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl mb-2">{selectedPaper.title}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {selectedPaper.authors} · {formatDate(selectedPaper.published_date)}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedPaper.pdf_url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Save to note button */}
              {paperAnalysis && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">AI深度分析已完成</span>
                  </div>
                  <Button
                    onClick={handleSaveAnalysisToNote}
                    disabled={savingNote}
                    className="gradient-primary text-white"
                  >
                    {savingNote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        保存到笔记
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                {analyzingPaperId === selectedPaper.id ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Brain className="h-12 w-12 text-primary animate-pulse" />
                    <div className="text-center">
                      <p className="font-medium">智谱AI正在深度分析...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        这可能需要10-20秒，请稍候
                      </p>
                    </div>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : paperAnalysis ? (
                  <>
                    {/* 中文摘要 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">中文摘要</h3>
                      </div>
                      <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                        {paperAnalysis.summary_cn}
                      </p>
                    </div>

                    {/* 阅读信息 */}
                    <div className="flex items-center gap-4">
                      <Badge className={getDifficultyColor(paperAnalysis.reading_difficulty)}>
                        难度：{paperAnalysis.reading_difficulty}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">适合人群：</span>
                        {paperAnalysis.recommended_for.map((role, idx) => (
                          <Badge key={idx} variant="outline" className="flex items-center gap-1">
                            {getRecommendedForIcon(role)}
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 重点内容 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-semibold">核心要点</h3>
                      </div>
                      <div className="grid gap-2">
                        {paperAnalysis.key_points.map((point, idx) => (
                          <div
                            key={idx}
                            className="flex gap-3 p-3 bg-secondary/30 rounded-lg border border-border"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <p className="text-sm">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 创新点 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold">创新点</h3>
                      </div>
                      <div className="grid gap-2">
                        {paperAnalysis.innovations.map((innovation, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                          >
                            <p className="text-sm text-green-800 dark:text-green-200">{innovation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 方法论 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold">方法论</h3>
                      </div>
                      <div className="grid gap-2">
                        {paperAnalysis.methods.map((method, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800"
                          >
                            <p className="text-sm text-purple-800 dark:text-purple-200">{method}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 主要结果 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold">主要结果</h3>
                      </div>
                      <div className="grid gap-2">
                        {paperAnalysis.results.map((result, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                          >
                            <p className="text-sm text-blue-800 dark:text-blue-200">{result}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 局限性 */}
                    {paperAnalysis.limitations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <h3 className="font-semibold">局限性</h3>
                        </div>
                        <div className="grid gap-2">
                          {paperAnalysis.limitations.map((limitation, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800"
                            >
                              <p className="text-sm text-orange-800 dark:text-orange-200">{limitation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 未来工作 */}
                    {paperAnalysis.future_work.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ChevronRight className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                          <h3 className="font-semibold">未来方向</h3>
                        </div>
                        <div className="grid gap-2">
                          {paperAnalysis.future_work.map((work, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800"
                            >
                              <p className="text-sm text-teal-800 dark:text-teal-200">{work}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 中文标签 */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        <h3 className="font-semibold">相关标签</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {paperAnalysis.tags_cn.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyPapers;
