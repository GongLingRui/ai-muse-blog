import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Users, Sparkles, BarChart3, AlertTriangle, Bell, BellOff, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type TeamPreset = { id: string; name: string; description: string };
type DigestPaper = {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  category: string;
  summary: string;
  paper_url: string;
  pdf_url?: string;
};

type DigestData = {
  team: string;
  team_name: string;
  summary: string;
  highlights: string[];
  risks: string[];
  trend: string;
  metrics: {
    paper_count: number;
    category_distribution: Array<{ category: string; count: number }>;
    generated_at?: string;
  };
  papers: DigestPaper[];
};

const TeamDigest = () => {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<TeamPreset[]>([]);
  const [team, setTeam] = useState<string>("qwen");
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; subscription_type: string; value: string }>>([]);

  useEffect(() => {
    fetchTeams();
    if (isAuthenticated) fetchSubscriptions();
  }, [isAuthenticated]);

  useEffect(() => {
    if (team) fetchDigest(team, true);
  }, [team]);

  const fetchTeams = async () => {
    try {
      const resp = await api.daily.getDigestTeams() as { success: boolean; data: TeamPreset[] };
      if (resp.success) {
        setTeams(resp.data);
        if (!resp.data.find((x) => x.id === team) && resp.data.length > 0) {
          setTeam(resp.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("加载团队列表失败");
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const resp = await api.arxiv.subscriptions.list() as { success: boolean; data: Array<{ id: string; subscription_type: string; value: string }> };
      if (resp.success) setSubscriptions(resp.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDigest = async (teamId: string, refresh = false) => {
    setLoading(true);
    try {
      const resp = await api.daily.getTeamDigest(teamId, {
        days: "1",
        limit: "12",
        refresh: refresh ? "true" : "false",
      }) as { success: boolean; data: DigestData };
      if (resp.success) {
        setDigest(resp.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("生成团队日报失败");
    } finally {
      setLoading(false);
    }
  };

  const teamMeta = useMemo(() => teams.find((x) => x.id === team), [teams, team]);
  const currentSubscription = useMemo(
    () => subscriptions.find((s) => s.subscription_type === "team" && s.value.toLowerCase() === team.toLowerCase()),
    [subscriptions, team]
  );

  const toggleTeamSubscription = async () => {
    if (!team) return;
    if (!isAuthenticated) {
      toast.error("请先登录后再订阅团队");
      return;
    }
    setSubscribing(true);
    try {
      if (currentSubscription?.id) {
        await api.arxiv.subscriptions.delete(currentSubscription.id);
        toast.success("已取消该团队订阅");
      } else {
        await api.arxiv.subscriptions.create({
          subscription_type: "team",
          value: team,
          is_active: true,
          notify: true,
        });
        toast.success("已订阅该团队");
      }
      await fetchSubscriptions();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "订阅操作失败");
    } finally {
      setSubscribing(false);
    }
  };

  const maxCount = useMemo(() => {
    const counts = digest?.metrics?.category_distribution?.map((x) => x.count) || [1];
    return Math.max(...counts, 1);
  }, [digest]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">团队每日 Digest</h1>
                <Badge className="gradient-primary text-white border-0">GLM 分析</Badge>
              </div>
              <p className="text-muted-foreground">按团队聚合最新论文，并自动生成中文摘要、亮点与风险提示</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger className="w-[240px] bg-secondary/30 border-border/50">
                  <SelectValue placeholder="选择团队" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchDigest(team, true)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                刷新日报
              </Button>
              <Button
                variant={currentSubscription ? "secondary" : "default"}
                onClick={toggleTeamSubscription}
                disabled={subscribing || !isAuthenticated}
              >
                {subscribing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : currentSubscription ? (
                  <BellOff className="h-4 w-4 mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {!isAuthenticated ? "登录后订阅" : currentSubscription ? "取消订阅" : "订阅团队"}
              </Button>
            </div>
          </div>

          {teamMeta && (
            <Card className="border-border/50 shadow-card">
              <CardContent className="pt-4 text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <span className="text-foreground font-medium mr-2">{teamMeta.name}</span>
                  {teamMeta.description}
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/papers" className="text-primary underline inline-flex items-center gap-1">去论文库 <ArrowRight className="h-3 w-3" /></Link>
                  <Link to="/daily" className="text-primary underline inline-flex items-center gap-1">每日更新 <BookOpen className="h-3 w-3" /></Link>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card><CardContent className="py-16 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
          ) : digest ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 border-border/50 shadow-card">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />中文摘要</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-foreground/90 whitespace-pre-line">{digest.summary}</p>
                    {digest.trend && <p className="text-sm mt-3 text-primary">趋势：{digest.trend}</p>}
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-card">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />统计</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>团队：<span className="font-medium">{digest.team_name}</span></div>
                    <div>论文数：<span className="font-medium">{digest.metrics.paper_count}</span></div>
                    <div>生成时间：<span className="font-medium">{digest.metrics.generated_at ? new Date(digest.metrics.generated_at).toLocaleString("zh-CN") : "-"}</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border/50 shadow-card">
                  <CardHeader><CardTitle>亮点</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {(digest.highlights || []).map((h, i) => <p key={i} className="text-sm">{i + 1}. {h}</p>)}
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-card">
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />注意点</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {(digest.risks || []).map((r, i) => <p key={i} className="text-sm">{i + 1}. {r}</p>)}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50 shadow-card">
                <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />分类分布</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(digest.metrics.category_distribution || []).map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-sm"><span>{item.category}</span><span>{item.count}</span></div>
                      <div className="h-2 rounded bg-secondary/60 overflow-hidden">
                        <div className="h-2 bg-primary" style={{ width: `${Math.max(8, (item.count / maxCount) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-card">
                <CardHeader><CardTitle>关键论文</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {digest.papers.map((p) => (
                    <div key={p.id} className="border border-border/50 rounded-lg p-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline">{p.category}</Badge>
                        <span className="text-xs text-muted-foreground">{p.arxiv_id}</span>
                      </div>
                      <div className="font-medium mb-1">{p.title}</div>
                      <div className="text-xs text-muted-foreground mb-2">{p.authors}</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.summary}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <a href={p.paper_url} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">arXiv <ExternalLink className="h-3 w-3" /></a>
                        {p.pdf_url && <a href={p.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-1">PDF <ExternalLink className="h-3 w-3" /></a>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default TeamDigest;
