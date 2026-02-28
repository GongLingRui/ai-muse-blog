import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  TrendingUp,
  Calendar,
  Filter,
  FileText,
  Play,
  Eye,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ReadingProgress {
  id: string;
  paper_id: string;
  status: "not_read" | "reading" | "read";
  progress_percentage: number;
  current_page: number | null;
  total_pages: number | null;
  notes_count: number;
  started_at: string | null;
  completed_at: string | null;
  last_read_at: string | null;
  estimated_reading_time: number | null;
  paper: {
    id: string;
    arxiv_id: string;
    title: string;
    authors: string;
    summary: string;
    published_date: string;
    category: string;
    pdf_url: string | null;
  };
}

interface Statistics {
  total_papers: number;
  not_read_count: number;
  reading_count: number;
  read_count: number;
  average_progress: number;
  total_reading_time: number;
  this_week_count: number;
  this_month_count: number;
  longest_streak: number;
  current_streak: number;
}

const ReadingProgress = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("last_read");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progressResponse, statsResponse] = await Promise.all([
        api.readingProgress.list() as {
          success: boolean;
          data: ReadingProgress[];
        },
        api.readingProgress.statistics() as {
          success: boolean;
          data: Statistics;
        },
      ]);

      if (progressResponse.success) {
        setProgressList(progressResponse.data);
      }

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch reading progress:", error);
      toast.error("加载阅读进度失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReading = async (paperId: string) => {
    setActionLoading(paperId);
    try {
      await api.readingProgress.markAsReading(paperId);
      toast.success("已标记为阅读中");
      fetchData();
    } catch (error) {
      console.error("Failed to mark as reading:", error);
      toast.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsRead = async (paperId: string) => {
    setActionLoading(paperId);
    try {
      await api.readingProgress.markAsRead(paperId);
      toast.success("已标记为已读完");
      fetchData();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProgress = async (paperId: string, progress: number) => {
    try {
      await api.readingProgress.update(paperId, { progress_percentage: progress });
      // Optimistic update
      setProgressList(prev =>
        prev.map(item =>
          item.paper_id === paperId
            ? { ...item, progress_percentage: progress }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("更新进度失败");
      fetchData();
    }
  };

  // Filter and sort
  const filteredAndSorted = progressList
    .filter((item) => {
      const matchesSearch =
        item.paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paper.authors.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "last_read":
          return (
            new Date(b.last_read_at || 0).getTime() -
            new Date(a.last_read_at || 0).getTime()
          );
        case "started_at":
          return (
            new Date(b.started_at || 0).getTime() -
            new Date(a.started_at || 0).getTime()
          );
        case "progress":
          return b.progress_percentage - a.progress_percentage;
        case "title":
          return a.paper.title.localeCompare(b.paper.title);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            已读完
          </Badge>
        );
      case "reading":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Play className="h-3 w-3 mr-1" />
            阅读中
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Circle className="h-3 w-3 mr-1" />
            未读
          </Badge>
        );
    }
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未设置";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                阅读进度
              </h1>
              <p className="text-muted-foreground">
                跟踪你的论文阅读进度和统计
              </p>
            </div>

            {/* Statistics Cards */}
            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          总论文数
                        </p>
                        <p className="text-2xl font-bold">
                          {statistics.total_papers}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          已读完
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {statistics.read_count}
                        </p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          阅读中
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {statistics.reading_count}
                        </p>
                      </div>
                      <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          阅读时长
                        </p>
                        <p className="text-2xl font-bold">
                          {formatReadingTime(statistics.total_reading_time)}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* More Statistics */}
            {statistics && statistics.total_papers > 0 && (
              <Card className="border-border/50 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    阅读统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        平均进度
                      </p>
                      <p className="text-lg font-semibold">
                        {statistics.average_progress.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        本月阅读
                      </p>
                      <p className="text-lg font-semibold">
                        {statistics.this_month_count} 篇
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        本周阅读
                      </p>
                      <p className="text-lg font-semibold">
                        {statistics.this_week_count} 篇
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        当前连续
                      </p>
                      <p className="text-lg font-semibold">
                        {statistics.current_streak} 天
                      </p>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        总体完成度
                      </span>
                      <span className="font-medium">
                        {statistics.average_progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={statistics.average_progress}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索论文标题或作者..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/30 border-border/50"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] bg-secondary/30 border-border/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="not_read">未读</SelectItem>
                  <SelectItem value="reading">阅读中</SelectItem>
                  <SelectItem value="read">已读完</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px] bg-secondary/30 border-border/50">
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_read">最近阅读</SelectItem>
                  <SelectItem value="started_at">开始时间</SelectItem>
                  <SelectItem value="progress">进度</SelectItem>
                  <SelectItem value="title">标题</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress List */}
            {loading ? (
              <Card className="border-border/50">
                <CardContent className="py-12">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredAndSorted.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSorted.map((item) => (
                  <Card
                    key={item.id}
                    className="border-border/50 shadow-sm hover:shadow-md transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Paper Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3
                              className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                              onClick={() =>
                                navigate(`/papers/${item.paper_id}`)
                              }
                            >
                              {item.paper.title}
                            </h3>
                            {getStatusBadge(item.status)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {item.paper.authors}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                            <Badge variant="outline" className="text-xs">
                              {item.paper.category}
                            </Badge>
                            {item.current_page && item.total_pages && (
                              <span>
                                第 {item.current_page} / {item.total_pages} 页
                              </span>
                            )}
                            {item.estimated_reading_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatReadingTime(
                                  item.estimated_reading_time
                                )}
                              </span>
                            )}
                            {item.notes_count > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {item.notes_count} 条笔记
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                阅读进度
                              </span>
                              <span className="font-medium">
                                {item.progress_percentage}%
                              </span>
                            </div>
                            <Progress
                              value={item.progress_percentage}
                              className="h-2"
                            />
                          </div>

                          {/* Dates */}
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              开始: {formatDate(item.started_at)}
                            </span>
                            {item.last_read_at && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                最后阅读: {formatDate(item.last_read_at)}
                              </span>
                            )}
                            {item.completed_at && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                完成: {formatDate(item.completed_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col gap-2 lg:w-32">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              navigate(`/papers/${item.paper_id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          {item.status !== "reading" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                handleMarkAsReading(item.paper_id)
                              }
                              disabled={actionLoading === item.paper_id}
                            >
                              {actionLoading === item.paper_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  开始阅读
                                </>
                              )}
                            </Button>
                          )}
                          {item.status !== "read" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 gradient-primary"
                              onClick={() =>
                                handleMarkAsRead(item.paper_id)
                              }
                              disabled={actionLoading === item.paper_id}
                            >
                              {actionLoading === item.paper_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  标记读完
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <Card className="border-border/50">
                <CardContent className="py-16">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {searchQuery || statusFilter !== "all"
                        ? "没有找到匹配的阅读记录"
                        : "还没有阅读记录"}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || statusFilter !== "all"
                        ? "尝试调整搜索或筛选条件"
                        : "开始阅读论文来跟踪你的进度"}
                    </p>
                    {!searchQuery && statusFilter === "all" && (
                      <Button
                        onClick={() => navigate("/papers")}
                        className="gradient-primary"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        浏览论文
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ReadingProgress;
