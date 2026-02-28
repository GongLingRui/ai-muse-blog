import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { BookOpen, Clock, Flame, TrendingUp, Calendar, Target, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProgressItem {
  id: string;
  status: 'not_read' | 'reading' | 'read';
  reading_time_minutes?: number;
  updated_at?: string;
  created_at?: string;
}

const ReadingStatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, progressRes] = await Promise.all([
        api.readingProgress.statistics() as any,
        api.readingProgress.list({ page: '1', page_size: '200' }) as any,
      ]);
      if (statsRes.success) setStats(statsRes.data || {});
      if (progressRes.success) setProgress(progressRes.data || []);
    } catch (error) {
      console.error('Failed to fetch reading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPapers = (stats?.not_read_count || 0) + (stats?.reading_count || 0) + (stats?.read_count || 0);
  const papersRead = stats?.read_count || 0;
  const totalReadingTime = stats?.total_reading_time_minutes || 0;

  const dailyAverage = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    return Math.round(totalReadingTime / Math.max(days, 1));
  }, [totalReadingTime, timeRange]);

  const streak = useMemo(() => {
    // lightweight streak estimation from update dates
    const days = new Set(
      progress
        .filter((p) => (p.status === 'read' || p.status === 'reading') && (p.updated_at || p.created_at))
        .map((p) => new Date((p.updated_at || p.created_at) as string).toISOString().slice(0, 10))
    );
    let current = 0;
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) current += 1;
      else break;
    }
    return current;
  }, [progress]);

  const weeklyData = useMemo(() => {
    const arr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, idx) => ({ day, minutes: 0, papers: 0, idx }));
    progress.forEach((p) => {
      const t = p.updated_at || p.created_at;
      if (!t) return;
      const d = new Date(t);
      const jsDay = d.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      arr[idx].minutes += p.reading_time_minutes || 0;
      if (p.status === 'read') arr[idx].papers += 1;
    });
    return arr;
  }, [progress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 flex items-center justify-center"><div className="text-muted-foreground">加载中...</div></main>
      </div>
    );
  }

  const progressPct = totalPapers > 0 ? Math.round((papersRead / totalPapers) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />阅读统计
              </h1>
              <p className="mt-2 text-muted-foreground">基于真实阅读进度自动生成，帮助你优化学习节奏。</p>
            </div>
            <div className="flex bg-secondary/40 rounded-lg p-1">
              {[{ value: 'week', label: '本周' }, { value: 'month', label: '本月' }, { value: 'year', label: '今年' }].map((item) => (
                <Button key={item.value} size="sm" variant={timeRange === item.value ? 'default' : 'ghost'} onClick={() => setTimeRange(item.value as any)}>{item.label}</Button>
              ))}
            </div>
          </div>

          <Card className="border-border/50 shadow-card">
            <CardContent className="pt-4 flex items-start gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5" />
              <div>统计来源：阅读进度状态（未读/在读/已读）和阅读时长。连续天数基于近60天活跃记录估算。</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="总论文数" value={String(totalPapers)} icon={<BookOpen className="w-6 h-6 text-primary" />} sub="已纳入阅读进度" />
            <StatCard title="已读论文" value={String(papersRead)} icon={<TrendingUp className="w-6 h-6 text-green-600" />} sub={`完成率 ${progressPct}%`} />
            <StatCard title="阅读时长" value={`${Math.floor(totalReadingTime / 60)}h ${totalReadingTime % 60}m`} icon={<Clock className="w-6 h-6 text-blue-600" />} sub={`日均 ${dailyAverage} 分钟`} />
            <StatCard title="连续活跃" value={`${streak} 天`} icon={<Flame className="w-6 h-6 text-orange-600" />} sub="连续学习追踪" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/50 shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />周分布</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {weeklyData.map((day) => {
                  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);
                  const barWidth = (day.minutes / maxMinutes) * 100;
                  return (
                    <div key={day.day} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground w-12">{day.day}</span>
                        <span className="text-muted-foreground">{day.minutes} 分钟</span>
                        <span className="text-foreground">{day.papers} 篇</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(4, barWidth)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />阅读建议</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>1. 建议每日保持 {dailyAverage >= 45 ? '45+' : '至少45'} 分钟深度阅读。</p>
                <p>2. 当前在读 {stats?.reading_count || 0} 篇，优先清理在读列表。</p>
                <p>3. 每周目标可设为 3-5 篇精读，避免只收藏不阅读。</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, sub }: { title: string; value: string; icon: ReactNode; sub: string }) => (
  <Card className="border-border/50 shadow-card">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div className="p-3 bg-secondary rounded-lg">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default ReadingStatsPage;
