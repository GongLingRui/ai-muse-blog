import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  ExternalLink,
  Download,
  Star,
  MessageSquare,
  BookmarkPlus,
  Eye,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Brain,
  Target,
  Lightbulb,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Filter,
  Users,
  GraduationCap,
  Briefcase,
  Plus,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import AnnotationEditor from "@/components/AnnotationEditor";
import AIReadingAssistant from "@/components/AIReadingAssistant";
import HighlightList from "@/components/HighlightList";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface Note {
  id: string;
  title: string;
  content: string;
  note_type: string;
  created_at: string;
}

interface Discussion {
  id: string;
  content: string;
  discussion_type: string;
  user_name: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote?: number;
}

interface Annotation {
  id: string;
  content: string;
  annotation_type: string;
  color: string;
  page_number?: number;
  highlighted_text?: string;
  created_at: string;
}

const DailyPaperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<PaperAnalysis | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [readerFullscreen, setReaderFullscreen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Discussions
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("general");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    if (id) {
      fetchPaper();
      fetchNotes();
      fetchDiscussions();
      fetchAnnotations();
    }
  }, [id]);

  const fetchPaper = async () => {
    try {
      const response = await api.papers.get(id!) as { success: boolean; data: Paper };
      if (response.success) {
        setPaper(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch paper:", error);
      toast.error("加载论文失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.notes.getPaperNotes(id!) as { success: boolean; data: Note[] };
      if (response.success) {
        setNotes(response.data);
      }
    } catch (error: any) {
      if (!error?.message?.includes('404')) {
        console.error("Failed to fetch notes:", error);
      }
    }
  };

  const fetchDiscussions = async () => {
    try {
      const response = await api.discussions.getPaperDiscussions(id!) as {
        success: boolean;
        data: Discussion[];
      };
      if (response.success) {
        setDiscussions(response.data);
      }
    } catch (error: any) {
      if (!error?.message?.includes('404')) {
        console.error("Failed to fetch discussions:", error);
      }
    }
  };

  const fetchAnnotations = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.annotations.list("paper", id!) as {
        success: boolean;
        data: Annotation[];
      };
      if (response.success) {
        setAnnotations(response.data || []);
      }
    } catch (error: any) {
      // Silently ignore 401 errors (not authenticated) and 404 (no annotations)
      if (!error?.message?.includes('401') && !error?.message?.includes('404')) {
        console.error("Failed to fetch annotations:", error);
      }
    }
  };

  const handleAnalyzePaper = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录后再使用AI分析功能");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await api.daily.analyze({
        paper_id: id!,
        analysis_type: "full",
      }) as {
        success: boolean;
        data: PaperAnalysis;
      };

      if (response.success) {
        setAiAnalysis(response.data);
        toast.success("AI分析完成！");
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      toast.error(error?.detail || "AI分析失败，请稍后重试");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysisToNote = async () => {
    if (!aiAnalysis || !paper) return;
    if (!isAuthenticated) {
      toast.error("请先登录后再保存笔记");
      return;
    }

    setSavingNote(true);
    try {
      const response = await api.daily.saveAnalysisToNote({
        paper_id: paper.id,
        analysis: aiAnalysis,
        note_title: `${paper.title.substring(0, 30)}... - AI解读`,
      }) as { success: boolean; data: any };

      if (response.success) {
        toast.success("AI分析已保存到笔记！");
        fetchNotes();
      }
    } catch (error: any) {
      console.error("Failed to save note:", error);
      toast.error(error?.detail || "保存失败");
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateNote = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    if (!newNoteContent.trim()) {
      toast.error("请输入笔记内容");
      return;
    }

    setSubmittingNote(true);
    try {
      await api.notes.create(id!, {
        title: newNoteTitle,
        content: newNoteContent,
        note_type: newNoteType,
      });
      toast.success("笔记创建成功");
      setNewNoteTitle("");
      setNewNoteContent("");
      fetchNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("笔记创建失败");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handlePostComment = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    if (!newComment.trim()) {
      toast.error("请输入评论内容");
      return;
    }

    setSubmittingComment(true);
    try {
      await api.discussions.create(id!, {
        content: newComment,
        discussion_type: commentType,
      });
      toast.success("评论成功");
      setNewComment("");
      fetchDiscussions();
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("评论失败");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-border/50">
              <CardContent className="py-12">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <Card className="border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h2 className="text-xl font-semibold mb-2">论文不存在</h2>
                  <Button onClick={() => navigate("/daily")} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回每日论文
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/daily")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回每日论文
          </Button>

          {/* Paper Header */}
          <Card className="border-border/50 shadow-card mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-4">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {paper.category}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {paper.view_count}
                  </span>
                </div>
              </div>
              <CardTitle className="text-2xl mb-4">{paper.title}</CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {paper.authors}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(paper.published_date)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{paper.summary}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={() => window.open(paper.pdf_url, "_blank")}>
                  <Download className="h-4 w-4 mr-2" />
                  下载PDF
                </Button>
                <Button
                  onClick={() => window.open(paper.pdf_url, "_blank")}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  打开arXiv
                </Button>
                <Button
                  onClick={handleAnalyzePaper}
                  disabled={analyzing}
                  className="gradient-primary text-white"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI解读
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">论文概览</TabsTrigger>
              <TabsTrigger value="ai-analysis">AI解读</TabsTrigger>
              <TabsTrigger value="reader">在线阅读</TabsTrigger>
              <TabsTrigger value="notes">我的笔记</TabsTrigger>
              <TabsTrigger value="discussions">讨论</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">论文信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>arXiv ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{paper.arxiv_id}</p>
                  </div>
                  <div>
                    <Label>分类</Label>
                    <p className="text-sm text-muted-foreground">{paper.category}</p>
                  </div>
                  <div>
                    <Label>摘要</Label>
                    <p className="text-sm text-muted-foreground leading-relaxed">{paper.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="ai-analysis">
              {!aiAnalysis ? (
                <Card className="border-border/50">
                  <CardContent className="py-16 text-center">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">暂无AI分析</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      点击上方"AI解读"按钮开始分析
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Save Button */}
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

                  {/* Chinese Summary */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">中文摘要</h3>
                    </div>
                    <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                      {aiAnalysis.summary_cn}
                    </p>
                  </div>

                  {/* Reading Info */}
                  <div className="flex items-center gap-4">
                    <Badge className={getDifficultyColor(aiAnalysis.reading_difficulty)}>
                      难度：{aiAnalysis.reading_difficulty}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">适合人群：</span>
                      {aiAnalysis.recommended_for.map((role, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          {getRecommendedForIcon(role)}
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Key Points */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-semibold">核心要点</h3>
                    </div>
                    <div className="grid gap-2">
                      {aiAnalysis.key_points.map((point, idx) => (
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

                  {/* Innovations */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold">创新点</h3>
                    </div>
                    <div className="grid gap-2">
                      {aiAnalysis.innovations.map((innovation, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <p className="text-sm text-green-800 dark:text-green-200">{innovation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Methods */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-semibold">方法论</h3>
                    </div>
                    <div className="grid gap-2">
                      {aiAnalysis.methods.map((method, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800"
                        >
                          <p className="text-sm text-purple-800 dark:text-purple-200">{method}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold">主要结果</h3>
                    </div>
                    <div className="grid gap-2">
                      {aiAnalysis.results.map((result, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <p className="text-sm text-blue-800 dark:text-blue-200">{result}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limitations */}
                  {aiAnalysis.limitations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <h3 className="font-semibold">局限性</h3>
                      </div>
                      <div className="grid gap-2">
                        {aiAnalysis.limitations.map((limitation, idx) => (
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

                  {/* Future Work */}
                  {aiAnalysis.future_work.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ChevronRight className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <h3 className="font-semibold">未来方向</h3>
                      </div>
                      <div className="grid gap-2">
                        {aiAnalysis.future_work.map((work, idx) => (
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

                  {/* Tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      <h3 className="font-semibold">相关标签</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.tags_cn.map((tag, idx) => (
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
                </div>
              )}
            </TabsContent>

            {/* Reader Tab */}
            <TabsContent value="reader">
              <div className="flex gap-4">
                {/* PDF Reader */}
                <Card className="border-border/50 flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        在线阅读
                      </CardTitle>
                      <Button
                        onClick={() => setReaderFullscreen(!readerFullscreen)}
                        variant="outline"
                        size="sm"
                      >
                        {readerFullscreen ? (
                          <>
                            <Minimize2 className="h-4 w-4 mr-2" />
                            退出全屏
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-4 w-4 mr-2" />
                            全屏阅读
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!showReader ? (
                      <div className="text-center py-12 space-y-4">
                        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                          <h3 className="text-lg font-semibold mb-2">在线阅读论文</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            点击下方按钮在浏览器中直接阅读论文，无需下载
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowReader(true)}
                          className="gradient-primary text-primary-foreground"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          开始阅读
                        </Button>
                      </div>
                    ) : (
                      <div
                        ref={pdfContainerRef}
                        className={cn(
                          "relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden",
                          readerFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-[700px]"
                        )}
                      >
                        {readerFullscreen && (
                          <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <Button
                              onClick={() => setReaderFullscreen(false)}
                              variant="secondary"
                              size="sm"
                            >
                              <Minimize2 className="h-4 w-4 mr-2" />
                              退出全屏
                            </Button>
                          </div>
                        )}
                        <iframe
                          src={paper.pdf_url}
                          className="w-full h-full border-0"
                          title="PDF Reader"
                          onError={() => {
                            toast.error("PDF 加载失败，请尝试在 arXiv 打开");
                            setShowReader(false);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Right Sidebar - AI Assistant & Highlights */}
                <div className="w-80 space-y-4 hidden lg:block">
                  {/* AI Reading Assistant */}
                  <AIReadingAssistant paper={paper} onTextSelected={setSelectedText} />

                  {/* Highlights */}
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookMarked className="h-4 w-4" />
                        划线笔记
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HighlightList
                        paperId={id!}
                        highlights={annotations}
                        onRefresh={fetchAnnotations}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Annotation Editor for mobile */}
              {isAuthenticated && (
                <AnnotationEditor
                  contentType="paper"
                  contentId={id!}
                  selectedText={selectedText}
                  onSave={() => {
                    fetchAnnotations();
                    setSelectedText("");
                  }}
                />
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    我的笔记
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAuthenticated ? (
                    <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                      <Input
                        placeholder="笔记标题（可选）"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                      />
                      <div className="flex gap-3">
                        <Select value={newNoteType} onValueChange={setNewNoteType}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">一般</SelectItem>
                            <SelectItem value="summary">总结</SelectItem>
                            <SelectItem value="critique">批评</SelectItem>
                            <SelectItem value="method">方法</SelectItem>
                            <SelectItem value="result">结果</SelectItem>
                            <SelectItem value="future_work">未来工作</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="写下你的笔记..."
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleCreateNote}
                          disabled={submittingNote || !newNoteContent.trim()}
                        >
                          {submittingNote ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              保存中...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              保存笔记
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      请先登录以查看和创建笔记
                    </p>
                  )}

                  <div className="space-y-3">
                    {notes.map((note) => (
                      <Card key={note.id} className="border-border/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              {note.title && <h4 className="font-medium">{note.title}</h4>}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {note.note_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(note.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discussions Tab */}
            <TabsContent value="discussions">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    讨论区
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isAuthenticated && (
                    <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                      <div className="flex gap-3">
                        <Select value={commentType} onValueChange={setCommentType}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">一般讨论</SelectItem>
                            <SelectItem value="question">提问</SelectItem>
                            <SelectItem value="insight">见解</SelectItem>
                            <SelectItem value="criticism">批评</SelectItem>
                            <SelectItem value="summary">总结</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          placeholder="分享你的想法..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handlePostComment}
                          disabled={submittingComment || !newComment.trim()}
                        >
                          {submittingComment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              发布中...
                            </>
                          ) : (
                            "发布评论"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {discussions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        还没有讨论，快来发表第一条评论吧！
                      </p>
                    ) : (
                      discussions.map((discussion) => (
                        <div key={discussion.id} className="border-b border-border/50 pb-4 last:border-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{discussion.user_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {discussion.discussion_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(discussion.created_at)}
                                </span>
                              </div>
                              <p className="text-sm">{discussion.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DailyPaperDetail;
