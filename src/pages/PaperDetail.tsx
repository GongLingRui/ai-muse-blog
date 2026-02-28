import { useEffect, useState } from "react";
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
  FolderPlus,
  TrendingUp,
  Eye,
  Quote,
  Plus,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Brain,
  GitCompare,
  Award,
  Sparkles,
  HelpCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
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
  pdf_url: string;
  view_count: number;
}

interface Rating {
  id: string;
  rating: number;
  review: string;
  user_name: string;
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
  replies: Discussion[];
  user_vote?: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  note_type: string;
  created_at: string;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  papers_count: number;
}

const PaperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);

  // Discussions
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("general");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);

  // Reading progress
  const [readingProgress, setReadingProgress] = useState<any>(null);

  // Citations
  const [citationStats, setCitationStats] = useState<any>(null);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // AI Scoring
  const [aiScore, setAiScore] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Q&A
  const [showQADialog, setShowQADialog] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);

  // Terminology
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [paperTerms, setPaperTerms] = useState<any[]>([]);

  // PDF Reader
  const [showReader, setShowReader] = useState(false);
  const [readerFullscreen, setReaderFullscreen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPaper();
      fetchUserRating(); // Fetch ratings for all users
      fetchDiscussions();
      fetchNotes();
      fetchCitations();
      fetchAISummary();
      if (isAuthenticated) {
        fetchCollections();
        fetchReadingProgress();
      }
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

  const fetchUserRating = async () => {
    try {
      const response = await api.ratings.getPaperRatings(id!) as {
        success: boolean;
        data: { ratings: Rating[]; user_rating: any };
      };
      if (response.success) {
        // Always set ratings list (available to all users)
        setRatings(response.data.ratings || []);
        // Only set user's rating if authenticated
        if (isAuthenticated && response.data.user_rating) {
          setUserRating(response.data.user_rating.rating);
          setReviewText(response.data.user_rating.review || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch rating:", error);
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
      // Silently ignore 404 errors (no discussions yet)
      if (!error?.message?.includes('404')) {
        console.error("Failed to fetch discussions:", error);
      }
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
      // Silently ignore 404 errors (no notes yet)
      if (!error?.message?.includes('404')) {
        console.error("Failed to fetch notes:", error);
      }
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await api.collections.list() as { success: boolean; data: Collection[] };
      if (response.success) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  };

  const fetchReadingProgress = async () => {
    try {
      const response = await api.readingProgress.get(id!) as { success: boolean; data: any };
      if (response.success && response.data) {
        setReadingProgress(response.data);
      }
    } catch (error) {
      // Not found is OK
    }
  };

  const fetchCitations = async () => {
    try {
      const response = await api.citations.getStats(id!) as { success: boolean; data: any };
      if (response.success) {
        setCitationStats(response.data);
      }
    } catch (error: any) {
      // Silently ignore 404 errors (no citation data yet)
      if (!error?.message?.includes('404')) {
        console.error("Failed to fetch citations:", error);
      }
    }
  };

  const fetchAISummary = async () => {
    try {
      const response = await api.ai.getSummary('paper', id!) as { success: boolean; data: any };
      if (response.success && response.data) {
        setAiSummary(response.data);
      }
    } catch (error) {
      // Silently ignore - summary might not exist yet
    }
  };

  const generateAISummary = async (quickRead = false) => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    setSummaryLoading(true);
    try {
      const response = await api.ai.generateSummary({
        content_type: 'paper',
        content_id: id!,
        summary_type: quickRead ? 'brief' : 'detailed',
        language: 'zh',
      }) as { success: boolean; data: any };

      if (response.success) {
        setAiSummary(response.data);
        toast.success(quickRead ? "快速阅读模式生成成功！" : "AI 摘要生成成功！");
      }
    } catch (error: any) {
      console.error("Failed to generate AI summary:", error);
      toast.error("AI 摘要生成失败：" + (error.message || "未知错误"));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAIScore = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    setScoreLoading(true);
    try {
      const response = await api.aiScoring.scorePaper({
        paper_id: id!,
      }) as { success: boolean; data: any };

      if (response.success) {
        setAiScore(response.data);
        toast.success("AI 评分完成！");
      }
    } catch (error: any) {
      console.error("Failed to score paper:", error);
      toast.error("AI 评分失败：" + (error.message || "未知错误"));
    } finally {
      setScoreLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!qaQuestion.trim()) {
      toast.error("请输入问题");
      return;
    }

    setQaLoading(true);
    try {
      const response = await api.aiQa.askQuestion({
        paper_id: id!,
        question: qaQuestion,
      }) as { success: boolean; data: any };

      if (response.success) {
        setQaAnswer(response.data.answer || "抱歉，无法回答这个问题。");
      }
    } catch (error: any) {
      console.error("Failed to ask question:", error);
      toast.error("提问失败");
      setQaAnswer("抱歉，提问出现问题。请稍后重试。");
    } finally {
      setQaLoading(false);
    }
  };

  const handleExplainTerms = async () => {
    if (!paper) return;

    try {
      const response = await api.terminology.explainPaperTerms({
        title: paper.title,
        summary: paper.summary,
      }) as { success: boolean; data: any };

      if (response.success) {
        setPaperTerms(response.data.terms || []);
        setShowTermsDialog(true);
      }
    } catch (error) {
      console.error("Failed to explain terms:", error);
      toast.error("获取术语解释失败");
    }
  };

  const handleAddToComparison = () => {
    // Store current paper in localStorage for comparison page
    if (!paper) return;

    const comparisonPapers = JSON.parse(localStorage.getItem("comparison_papers") || "[]");
    if (comparisonPapers.some((p: any) => p.id === paper.id)) {
      toast.info("论文已在对比列表中");
      return;
    }

    if (comparisonPapers.length >= 5) {
      toast.error("最多只能对比5篇论文");
      return;
    }

    comparisonPapers.push({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      summary: paper.summary,
      category: paper.category,
      published_date: paper.published_date,
    });

    localStorage.setItem("comparison_papers", JSON.stringify(comparisonPapers));
    toast.success("已添加到对比列表");
  };

  const handleDownloadPDF = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    setDownloading(true);
    try {
      const response = await api.paperFiles.download(id!) as {
        success: boolean;
        data: { file_url: string };
      };
      if (response.success) {
        window.open(response.data.file_url, "_blank");
        toast.success("PDF下载成功");
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("PDF下载失败");
    } finally {
      setDownloading(false);
    }
  };

  const handleRatePaper = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    if (userRating === 0) {
      toast.error("请选择评分星级");
      return;
    }

    setSubmittingRating(true);
    try {
      await api.ratings.createOrUpdate(id!, { rating: userRating, review: reviewText });
      toast.success("评分成功");
    } catch (error) {
      console.error("Failed to rate paper:", error);
      toast.error("评分失败");
    } finally {
      setSubmittingRating(false);
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

  const handleVoteDiscussion = async (discussionId: string, voteValue: number) => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    try {
      await api.discussions.vote(discussionId, { vote_value: voteValue });
      fetchDiscussions();
    } catch (error) {
      console.error("Failed to vote:", error);
      toast.error("投票失败");
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

  const handleAddToCollection = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    if (!selectedCollection) {
      toast.error("请选择收藏夹");
      return;
    }

    try {
      await api.collections.addPaper(selectedCollection, { paper_id: id });
      toast.success("已添加到收藏夹");
      setAddToCollectionOpen(false);
    } catch (error) {
      console.error("Failed to add to collection:", error);
      toast.error("添加失败");
    }
  };

  const handleMarkAsRead = async () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    try {
      await api.readingProgress.markAsRead(id!);
      toast.success("已标记为已读");
      fetchReadingProgress();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("标记失败");
    }
  };

  const toggleReplies = (discussionId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(discussionId)) {
      newExpanded.delete(discussionId);
    } else {
      newExpanded.add(discussionId);
    }
    setExpandedReplies(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number, interactive = false, onRate = (r: number) => {}) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onRate(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-4xl">
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
          <div className="container mx-auto max-w-4xl">
            <Card className="border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h2 className="text-xl font-semibold mb-2">论文不存在</h2>
                  <Button onClick={() => navigate("/papers")} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回论文列表
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
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/papers")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
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
                  {citationStats && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Quote className="h-3 w-3" />
                      {citationStats.total_citations}
                    </span>
                  )}
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
              <p className="text-muted-foreground leading-relaxed mb-6">{paper.summary}</p>

              {/* AI Summary Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    AI 智能摘要
                  </h3>
                  {!aiSummary && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => generateAISummary(false)}
                        disabled={summaryLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {summaryLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            详细分析
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateAISummary(true)}
                        disabled={summaryLoading}
                      >
                        {summaryLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            5分钟速读
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {aiSummary && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        由 <span className="font-medium text-primary">{aiSummary.model_name || 'AI'}</span> 生成
                        {aiSummary.detected_paper_type_name && (
                          <>
                            <span className="mx-2">•</span>
                            <Badge variant="outline" className="text-xs">
                              {aiSummary.detected_paper_type_name}
                            </Badge>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => generateAISummary(aiSummary.summary_type === 'brief')}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {aiSummary.summary_type === 'brief' ? '详细分析' : '5分钟速读'}
                      </Button>
                    </div>

                    {aiSummary.summary && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">
                          {aiSummary.summary_type === 'brief' ? '快速总结' : '中文摘要'}
                        </h4>
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{aiSummary.summary}</p>
                      </div>
                    )}

                    {aiSummary.summary_zh && aiSummary.summary_type !== 'brief' && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">中文摘要</h4>
                        <p className="text-sm leading-relaxed text-foreground/90">{aiSummary.summary_zh}</p>
                      </div>
                    )}

                    {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">核心要点</h4>
                        <ul className="space-y-1">
                          {aiSummary.key_points.map((point: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-blue-500 font-bold">{idx + 1}.</span>
                              <span className="text-foreground/90">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSummary.suggested_tags && aiSummary.suggested_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {aiSummary.suggested_tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Tools Bar */}
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    更多 AI 功能
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAIScore}
                      disabled={scoreLoading}
                      className="text-xs"
                    >
                      {scoreLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          评分中...
                        </>
                      ) : (
                        <>
                          <Award className="h-3 w-3 mr-1" />
                          AI 评分
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowQADialog(true)}
                      className="text-xs"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      AI 问答
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExplainTerms}
                      className="text-xs"
                    >
                      <HelpCircle className="h-3 w-3 mr-1" />
                      术语解释
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddToComparison}
                      className="text-xs"
                    >
                      <GitCompare className="h-3 w-3 mr-1" />
                      添加对比
                    </Button>
                  </div>

                  {/* AI Score Display */}
                  {aiScore && (
                    <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">AI 综合评分</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">
                            {aiScore.overall_score}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">创新性: </span>
                          <span className="font-medium">{aiScore.novelty_score}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">技术质量: </span>
                          <span className="font-medium">{aiScore.technical_quality_score}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">清晰度: </span>
                          <span className="font-medium">{aiScore.clarity_score}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">可复现性: </span>
                          <span className="font-medium">{aiScore.reproducibility_score}</span>
                        </div>
                      </div>
                      {aiScore.impact_prediction && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <span className="text-muted-foreground text-xs">预期影响: </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {aiScore.impact_prediction}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Q&A Dialog */}
          <Dialog open={showQADialog} onOpenChange={setShowQADialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI 问答助手</DialogTitle>
                <DialogDescription>
                  关于这篇论文的任何问题，AI助手都会为你解答
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!qaAnswer && (
                  <div className="space-y-2">
                    <Label htmlFor="qa-question">你的问题</Label>
                    <Textarea
                      id="qa-question"
                      value={qaQuestion}
                      onChange={(e) => setQaQuestion(e.target.value)}
                      placeholder="例如：这篇论文的主要创新点是什么？"
                      rows={3}
                      className="bg-secondary/30"
                    />
                  </div>
                )}

                {qaAnswer && (
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{qaAnswer}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {qaAnswer && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQaAnswer("");
                        setQaQuestion("");
                      }}
                    >
                      继续提问
                    </Button>
                  )}
                  <Button
                    onClick={qaAnswer ? () => setShowQADialog(false) : handleAskQuestion}
                    disabled={qaLoading || !qaQuestion.trim()}
                  >
                    {qaLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        思考中...
                      </>
                    ) : qaAnswer ? (
                      "完成"
                    ) : (
                      "提问"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Terms Dialog */}
          <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
            <DialogContent className="max-w-3xl max-h-[600px]">
              <DialogHeader>
                <DialogTitle>术语解释</DialogTitle>
                <DialogDescription>
                  论文中涉及的专业术语解释
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[400px]">
                <div className="space-y-4 pr-4">
                  {paperTerms.map((term, idx) => (
                    <div key={idx} className="p-4 bg-secondary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{term.category}</Badge>
                        <h4 className="font-semibold">{term.term_en}</h4>
                        <span className="text-muted-foreground text-sm">{term.term_cn}</span>
                      </div>
                      <p className="text-sm mb-2">{term.definition}</p>
                      {term.key_points && term.key_points.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium mb-1">关键点:</p>
                          <ul className="text-xs space-y-1">
                            {term.key_points.map((point: string, pidx) => (
                              <li key={pidx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {term.practical_tips && (
                        <p className="text-xs text-muted-foreground">
                          💡 {term.practical_tips}
                        </p>
                      )}
                    </div>
                  ))}

                  {paperTerms.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      暂无术语解释
                    </p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={handleDownloadPDF} disabled={downloading}>
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      下载中...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      下载PDF
                    </>
                  )}
                </Button>
                <Button onClick={() => window.open(paper.pdf_url, "_blank")} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  打开arXiv
                </Button>
                {isAuthenticated && (
                  <>
                    <Button onClick={handleMarkAsRead} variant="outline">
                      <Check className="h-4 w-4 mr-2" />
                      {readingProgress?.status === "read" ? "已读" : "标记已读"}
                    </Button>
                    <Dialog open={addToCollectionOpen} onOpenChange={setAddToCollectionOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <FolderPlus className="h-4 w-4 mr-2" />
                          添加到收藏夹
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>添加到收藏夹</DialogTitle>
                          <DialogDescription>选择一个收藏夹添加此论文</DialogDescription>
                        </DialogHeader>
                        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择收藏夹" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((c, index) => (
                              <SelectItem key={`collection-${c.id}-${index}`} value={c.id}>
                                {c.name} ({c.papers_count})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <DialogFooter>
                          <Button onClick={handleAddToCollection}>添加</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="discussions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="discussions">讨论</TabsTrigger>
              <TabsTrigger value="ratings">评分</TabsTrigger>
              <TabsTrigger value="notes">笔记</TabsTrigger>
              <TabsTrigger value="citations">引用</TabsTrigger>
              <TabsTrigger value="reader">在线阅读</TabsTrigger>
            </TabsList>

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
                  {/* Post Comment */}
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

                  {/* Discussions List */}
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
                            <div className="flex flex-col gap-1">
                              {isAuthenticated && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVoteDiscussion(discussion.id, 1)}
                                    className={discussion.user_vote === 1 ? "text-green-600" : ""}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                    {discussion.upvotes}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVoteDiscussion(discussion.id, -1)}
                                    className={discussion.user_vote === -1 ? "text-red-600" : ""}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                    {discussion.downvotes}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ratings Tab */}
            <TabsContent value="ratings">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    评分
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rate Paper */}
                  {isAuthenticated ? (
                    <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <Label>你的评分</Label>
                        <div className="mt-2">
                          {renderStars(userRating, true, (r) => setUserRating(r))}
                        </div>
                      </div>
                      <div>
                        <Label>评论（可选）</Label>
                        <Textarea
                          placeholder="写下你的评价..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleRatePaper}
                          disabled={submittingRating || userRating === 0}
                        >
                          {submittingRating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              提交中...
                            </>
                          ) : (
                            "提交评分"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      请先登录以评分
                    </p>
                  )}

                  {/* Ratings List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">所有评分</h3>
                    {ratings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        还没有评分，快来第一个评价吧！
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {ratings.map((rating) => (
                          <div key={rating.id} className="p-4 border border-border/50 rounded-lg">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{rating.user_name}</span>
                                  <div className="flex">
                                    {renderStars(rating.rating, false)}
                                  </div>
                                </div>
                                {rating.review && (
                                  <p className="text-sm text-muted-foreground mt-1">{rating.review}</p>
                                )}
                                <span className="text-xs text-muted-foreground mt-2 block">
                                  {formatDate(rating.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
                  {/* Create Note */}
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

                  {/* Notes List */}
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

            {/* Citations Tab */}
            <TabsContent value="citations">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Quote className="h-5 w-5" />
                    引用信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {citationStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                          <p className="text-2xl font-bold">{citationStats.total_citations}</p>
                          <p className="text-sm text-muted-foreground">总引用数</p>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                          <p className="text-2xl font-bold">{citationStats.arxiv_citations}</p>
                          <p className="text-sm text-muted-foreground">arXiv</p>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                          <p className="text-2xl font-bold">{citationStats.google_scholar_citations}</p>
                          <p className="text-sm text-muted-foreground">Google Scholar</p>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg text-center">
                          <p className="text-2xl font-bold">{citationStats.semantic_scholar_citations}</p>
                          <p className="text-sm text-muted-foreground">Semantic Scholar</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => api.citations.fetchFromAPI(id!).then(() => {
                          toast.success("引用数据已更新");
                          fetchCitations();
                        })}
                        variant="outline"
                        className="w-full"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        从外部API更新引用数据
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      暂无引用数据
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PDF Reader Tab */}
            <TabsContent value="reader">
              <Card className="border-border/50">
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
                      <div className="pt-4">
                        <Button
                          onClick={() => window.open(paper.pdf_url, "_blank")}
                          variant="outline"
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          在 arXiv 打开
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PaperDetail;
