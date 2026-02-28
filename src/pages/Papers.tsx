import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
  TrendingUp,
  Eye,
  Plus,
  RefreshCw,
  Rss,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  paper_type?: string;
  topic_tags?: string[];
  summary_zh?: string;
  summary_key_points?: string[];
  pdf_url?: string | null;
  view_count: number;
}

type ArxivCategory = { id: string; name: string };
type PaperTopic = { slug: string; name: string; paper_type: string };
type PaperTopicStat = PaperTopic & { count: number };
type TopicCatalogItem = {
  slug: string;
  name: string;
  paper_type: string;
  description: string;
  classic_papers: string[];
  x_links: string[];
  arxiv_links: string[];
};
type TopicTreeGroup = {
  group_id: string;
  group_name: string;
  group_description: string;
  children: TopicCatalogItem[];
};
type TeamPreset = { id: string; name: string; description: string };
type ArxivSubscription = {
  id: string;
  subscription_type: "category" | "query" | "team";
  value: string;
  is_active: boolean;
  notify: boolean;
  last_synced_at?: string | null;
};

const Papers = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [tab, setTab] = useState<"library" | "recommend" | "subscribe">("library");

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"published_date" | "view_count">("published_date");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [recommendations, setRecommendations] = useState<Paper[]>([]);
  const [recoLoading, setRecoLoading] = useState(false);

  const [categories, setCategories] = useState<ArxivCategory[]>([]);
  const [topics, setTopics] = useState<PaperTopic[]>([]);
  const [topicStats, setTopicStats] = useState<PaperTopicStat[]>([]);
  const [topicCatalog, setTopicCatalog] = useState<TopicCatalogItem[]>([]);
  const [topicTree, setTopicTree] = useState<TopicTreeGroup[]>([]);
  const [teams, setTeams] = useState<TeamPreset[]>([]);
  const [subscriptions, setSubscriptions] = useState<ArxivSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [newCategory, setNewCategory] = useState<string>("");
  const [newQuery, setNewQuery] = useState<string>("");
  const [newTeam, setNewTeam] = useState<string>("");
  const [notify, setNotify] = useState(true);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [arxivId, setArxivId] = useState("");
  const [addingPaper, setAddingPaper] = useState(false);

  useEffect(() => {
    if (tab === "library") fetchPapers();
    if (tab === "recommend") fetchRecommendations();
    if (tab === "subscribe") {
      fetchSubscriptions();
    }
  }, [tab]);

  useEffect(() => {
    fetchCategories();
    fetchTopics();
    fetchTeams();
  }, []);

  useEffect(() => {
    if (tab !== "library") return;
    fetchPapers();
  }, [categoryFilter, sortBy, page, tab]);

  const fetchPapers = async (reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        page_size: "12",
        sort: sortBy,
        order: "desc",
      };

      if (categoryFilter && categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }
      if (selectedTopics.length > 0) {
        params.tag = selectedTopics.join(",");
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
          setPage(2);
        } else {
          setPapers((prev) => [...prev, ...response.data]);
        }
        setTotal(response.pagination.total);
        setHasMore(response.pagination.has_more);
      }
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("加载论文失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "library") return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchPapers(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, selectedTopics.join(","), sortBy]);

  const fetchRecommendations = async () => {
    setRecoLoading(true);
    try {
      const response = await api.arxiv.recommendations({ limit: "24" }) as {
        success: boolean;
        data: Paper[];
      };
      if (response.success) setRecommendations(response.data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast.error("加载推荐失败");
    } finally {
      setRecoLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.arxiv.categories() as { success: boolean; data: ArxivCategory[] };
      if (response.success) setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTopics = async () => {
    try {
      const [topicsResp, statsResp, treeResp] = await Promise.all([
        api.papers.topics() as Promise<{ success: boolean; data: PaperTopic[] }>,
        api.papers.topicStats() as Promise<{ success: boolean; data: PaperTopicStat[] }>,
        api.papers.topicTree() as Promise<{ success: boolean; data: TopicTreeGroup[] }>,
      ]);
      if (topicsResp.success) setTopics(topicsResp.data);
      if (statsResp.success) setTopicStats(statsResp.data);
      if (treeResp.success) setTopicTree(treeResp.data);
      const catalogResp = await api.papers.topicCatalog() as { success: boolean; data: TopicCatalogItem[] };
      if (catalogResp.success) setTopicCatalog(catalogResp.data);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.arxiv.teams() as { success: boolean; data: TeamPreset[] };
      if (response.success) setTeams(response.data);
    } catch (error) {
      console.error("Failed to fetch team presets:", error);
    }
  };

  const fetchSubscriptions = async () => {
    if (!isAuthenticated) return;
    setSubsLoading(true);
    try {
      const response = await api.arxiv.subscriptions.list() as {
        success: boolean;
        data: ArxivSubscription[];
      };
      if (response.success) setSubscriptions(response.data);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("加载订阅失败");
    } finally {
      setSubsLoading(false);
    }
  };

  const addCategorySubscription = async () => {
    if (!isAuthenticated) return toast.error("请先登录");
    if (!newCategory) return toast.error("请选择分类");
    try {
      await api.arxiv.subscriptions.create({
        subscription_type: "category",
        value: newCategory,
        notify,
      });
      toast.success("订阅成功");
      setNewCategory("");
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to create subscription:", error);
      toast.error("订阅失败");
    }
  };

  const addQuerySubscription = async () => {
    if (!isAuthenticated) return toast.error("请先登录");
    if (!newQuery.trim()) return toast.error("请输入查询关键词/语句");
    try {
      await api.arxiv.subscriptions.create({
        subscription_type: "query",
        value: newQuery.trim(),
        notify,
      });
      toast.success("订阅成功");
      setNewQuery("");
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to create subscription:", error);
      toast.error("订阅失败");
    }
  };

  const addTeamSubscription = async () => {
    if (!isAuthenticated) return toast.error("请先登录");
    if (!newTeam) return toast.error("请选择团队");
    try {
      await api.arxiv.subscriptions.create({
        subscription_type: "team",
        value: newTeam,
        notify,
      });
      toast.success("团队订阅成功");
      setNewTeam("");
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to create team subscription:", error);
      toast.error("团队订阅失败");
    }
  };

  const toggleTopic = (name: string) => {
    setSelectedTopics((prev) => (
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    ));
    setPage(1);
  };

  const removeSubscription = async (id: string) => {
    try {
      await api.arxiv.subscriptions.delete(id);
      toast.success("已取消订阅");
      await fetchSubscriptions();
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      toast.error("取消订阅失败");
    }
  };

  const syncSubscriptions = async () => {
    if (!isAuthenticated) return toast.error("请先登录");
    setSyncing(true);
    try {
      const resp = await api.arxiv.subscriptions.sync(50) as { success: boolean; data?: { created: number } };
      if (resp.success) {
        toast.success(`同步完成：新增 ${resp.data?.created ?? 0} 篇论文`);
        await fetchSubscriptions();
        setTab("library");
        setPage(1);
        await fetchPapers(true);
      }
    } catch (error) {
      console.error("Failed to sync subscriptions:", error);
      toast.error("同步失败（请确认后端可访问 arXiv）");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddPaper = async () => {
    if (!arxivId.trim()) {
      toast.error("请输入 arXiv ID");
      return;
    }

    setAddingPaper(true);
    try {
      await api.papers.create({ arxiv_id: arxivId.trim() });

      toast.success("论文添加成功");
      setAddDialogOpen(false);
      setArxivId("");
      setPage(1);
      fetchPapers(true);
    } catch (error) {
      console.error("Failed to add paper:", error);
      toast.error("添加失败，请检查 arXiv ID 是否正确");
    } finally {
      setAddingPaper(false);
    }
  };

  const handlePaperClick = (paper: Paper) => {
    // Navigate to paper detail page
    navigate(`/papers/${paper.id}`);
  };

  const handleOpenPDF = (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    // Increment view count
    api.papers.view(paper.id).catch(console.error);
    if (paper.pdf_url) window.open(paper.pdf_url, "_blank");
    else toast.error("该论文暂无 PDF 链接");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "cs.AI": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "cs.CL": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "cs.CV": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "cs.LG": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      "stat.ML": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
      "math.OC": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[category] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                AI 论文库
              </h1>
              <p className="text-muted-foreground">
                发现和探索来自 arXiv 的最新 AI 论文
              </p>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  添加论文
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>添加论文</DialogTitle>
                  <DialogDescription>
                    输入 arXiv ID 来添加新论文到库中
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="arxivId">arXiv ID</Label>
                    <Input
                      id="arxivId"
                      placeholder="例如: 2301.07041 或 cs.AI/2301.07041"
                      value={arxivId}
                      onChange={(e) => setArxivId(e.target.value)}
                      className="bg-secondary/30 border-border/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      输入论文的 arXiv ID，系统会自动获取论文信息
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                    disabled={addingPaper}
                  >
                    取消
                  </Button>
                  <Button onClick={handleAddPaper} disabled={addingPaper}>
                    {addingPaper ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        添加中...
                      </>
                    ) : (
                      "添加论文"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="library">
                <BookOpen className="h-4 w-4 mr-2" />
                论文库
              </TabsTrigger>
              <TabsTrigger value="recommend">
                <TrendingUp className="h-4 w-4 mr-2" />
                推荐
              </TabsTrigger>
              <TabsTrigger value="subscribe">
                <Rss className="h-4 w-4 mr-2" />
                订阅
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library">
              {/* Filters */}
              <Card className="mb-6 border-border/50 shadow-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索论文标题或摘要..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary/30 border-border/50"
                      />
                    </div>

                    {/* Category Filter */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full md:w-[180px] bg-secondary/30 border-border/50">
                        <SelectValue placeholder="所有分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有分类</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-full md:w-[150px] bg-secondary/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published_date">最新发布</SelectItem>
                        <SelectItem value="view_count">最多浏览</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">标签云（可多选）</span>
                      {selectedTopics.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTopics([])}>
                          清空标签
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(topicTree.length > 0 ? topicTree : [{ group_id: "all", group_name: "全部", group_description: "", children: topicCatalog }]).map((group) => (
                        <div key={group.group_id}>
                          <div className="text-xs font-medium text-muted-foreground mb-1">{group.group_name}</div>
                          <div className="flex flex-wrap gap-2">
                            {group.children.map((child) => {
                              const count = topicStats.find((s) => s.slug === child.slug)?.count ?? 0;
                              const active = selectedTopics.includes(child.name);
                              return (
                                <Badge
                                  key={child.slug}
                                  variant={active ? "default" : "outline"}
                                  className={`cursor-pointer ${active ? "bg-primary text-primary-foreground" : ""}`}
                                  onClick={() => toggleTopic(child.name)}
                                >
                                  {child.name} {count > 0 ? `(${count})` : ""}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTopics.length > 0 && (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {topicCatalog
                        .filter((item) => selectedTopics.includes(item.name))
                        .map((item) => (
                          <div key={item.slug} className="rounded-lg border border-border/50 p-3 bg-secondary/20">
                            <div className="font-medium">{item.name}</div>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            <div className="text-xs mt-2">
                              <span className="font-medium">经典论文：</span>
                              {item.classic_papers.join("、")}
                            </div>
                            <div className="text-xs mt-2 flex flex-wrap gap-2">
                              {item.arxiv_links.slice(0, 1).map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-primary underline">
                                  arXiv搜索
                                </a>
                              ))}
                              {item.x_links.slice(0, 1).map((link, idx) => (
                                <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-primary underline">
                                  X搜索
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Count */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  共 <span className="font-medium text-foreground">{total}</span> 篇论文
                </p>
              </div>

              {/* Papers Grid */}
              {loading && papers.length === 0 ? (
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">加载论文中...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : papers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {papers.map((paper, index) => (
                    <Card
                      key={`papers-${paper.id}-${index}`}
                      className="border-border/50 shadow-card hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => handlePaperClick(paper)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={getCategoryColor(paper.category)}>
                            {paper.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
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
                            {paper.topic_tags.slice(0, 3).map((t, idx) => (
                              <Badge key={`${paper.id}-tag-${idx}`} variant="secondary">{t}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {paper.authors.split(", ").slice(0, 2).join(", ")}
                            {paper.authors.split(",").length > 2 && " 等"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(paper.published_date)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => handleOpenPDF(e, paper)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看详情/PDF
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        暂无论文
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {searchQuery || categoryFilter || selectedTopics.length > 0
                          ? "没有找到匹配的论文，请尝试其他搜索条件"
                          : "还没有添加任何论文，点击上方按钮添加第一篇"}
                      </p>
                      {isAuthenticated && !searchQuery && !categoryFilter && selectedTopics.length === 0 && (
                        <Button onClick={() => setAddDialogOpen(true)} className="gradient-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          添加第一篇论文
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Load More */}
              {hasMore && papers.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPage((prev) => prev + 1);
                      fetchPapers();
                    }}
                    disabled={loading}
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
            </TabsContent>

            <TabsContent value="recommend">
              <Card className="border-border/50 shadow-card mb-6">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">基于你的订阅（或全站最新）生成推荐</p>
                    <p className="text-sm text-muted-foreground">数据来自数据库/实时同步结果</p>
                  </div>
                  <Button variant="outline" onClick={fetchRecommendations} disabled={recoLoading}>
                    {recoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    刷新
                  </Button>
                </CardContent>
              </Card>

              {recoLoading ? (
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-12 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    加载推荐中...
                  </CardContent>
                </Card>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((paper, index) => (
                    <Card
                      key={`recommendations-${paper.id}-${index}`}
                      className="border-border/50 shadow-card hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handlePaperClick(paper)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={getCategoryColor(paper.category)}>
                            {paper.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {paper.view_count}
                          </span>
                        </div>
                        <CardTitle className="text-base line-clamp-2 min-h-[48px]">
                          {paper.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {paper.summary}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={(e) => handleOpenPDF(e, paper)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          查看详情/PDF
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-16 text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">暂无推荐</h2>
                    <p className="text-muted-foreground">可以先去“订阅”页选择分类并同步。</p>
                    <div className="mt-6">
                      <Button onClick={() => setTab("subscribe")} className="gradient-primary">
                        去订阅
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subscribe">
              {!isAuthenticated ? (
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-16 text-center">
                    <Rss className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">需要登录</h2>
                    <p className="text-muted-foreground">登录后可选择订阅分类/关键词，并定时同步新论文。</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">添加订阅</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={notify} onCheckedChange={(v) => setNotify(Boolean(v))} />
                        <span className="text-sm text-muted-foreground">同步到新论文时发送站内通知</span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger className="w-full md:w-[260px] bg-secondary/30 border-border/50">
                            <SelectValue placeholder="选择分类（例如 cs.AI）" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.id} - {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={addCategorySubscription} variant="outline">
                          订阅分类
                        </Button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          placeholder={"自定义查询（例如: ti:\"diffusion\" AND cat:cs.CV）"}
                          value={newQuery}
                          onChange={(e) => setNewQuery(e.target.value)}
                          className="bg-secondary/30 border-border/50"
                        />
                        <Button onClick={addQuerySubscription} variant="outline">
                          订阅查询
                        </Button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Select value={newTeam} onValueChange={setNewTeam}>
                          <SelectTrigger className="w-full md:w-[260px] bg-secondary/30 border-border/50">
                            <SelectValue placeholder="订阅团队（Qwen/Seed等）" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={addTeamSubscription} variant="outline">
                          订阅团队
                        </Button>
                      </div>

                      <div className="pt-2">
                        <Button onClick={syncSubscriptions} disabled={syncing}>
                          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          立即同步（抓取真实 arXiv 数据）
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">我的订阅</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subsLoading ? (
                        <div className="py-10 flex items-center justify-center text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          加载订阅中...
                        </div>
                      ) : subscriptions.length > 0 ? (
                        <div className="space-y-3">
                          {subscriptions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between gap-3 border border-border/50 rounded-lg p-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {s.subscription_type === "category" ? "分类" : s.subscription_type === "team" ? "团队" : "查询"}
                                  </Badge>
                                  <span className="font-medium truncate">{s.value}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {s.last_synced_at ? `上次同步：${new Date(s.last_synced_at).toLocaleString("zh-CN")}` : "尚未同步"}
                                </div>
                              </div>
                              <Button variant="ghost" className="text-destructive" onClick={() => removeSubscription(s.id)}>
                                取消
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-muted-foreground">
                          暂无订阅。先添加一个分类订阅，然后点击“立即同步”。
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Papers;
