import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { SearchHistoryItem } from '@/types';
import { Search, Clock, TrendingUp, Calendar, Filter, Trash2, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SearchHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'papers' | 'articles' | 'users'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, popularRes] = await Promise.all([
        api.searchHistory.list() as any,
        api.searchHistory.getPopular(10) as any,
      ]);

      if (historyRes.success) {
        setHistory(historyRes.data || []);
      }
      if (popularRes.success) {
        setPopular(popularRes.data?.map((p: any) => p.query) || []);
      }
    } catch (error) {
      console.error('Failed to fetch search data:', error);
      toast.error('加载搜索数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    navigate(`/papers?search=${encodeURIComponent(query)}`);
  };

  const clearHistory = async () => {
    try {
      await api.searchHistory.clear();
      setHistory([]);
      toast.success('搜索历史已清空');
    } catch (e) {
      console.error(e);
      toast.error('清空失败');
    }
  };

  const filterHistory = (items: SearchHistoryItem[]) => {
    return items.filter(item => {
      if (filterType !== 'all') {
        const normalized = item.search_type === 'paper' ? 'papers' : item.search_type;
        if (normalized !== filterType) return false;
      }

      if (timeRange !== 'all') {
        const now = new Date();
        const itemDate = new Date(item.created_at);
        const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

        if (timeRange === 'today' && diffDays > 0) return false;
        if (timeRange === 'week' && diffDays > 7) return false;
        if (timeRange === 'month' && diffDays > 30) return false;
      }

      return true;
    });
  };

  const getSearchTypeLabel = (type: string) => {
    const normalized = type === 'paper' ? 'papers' : type;
    const labels = {
      papers: '论文',
      articles: '文章',
      users: '用户',
      all: '全部',
    };
    return labels[normalized as keyof typeof labels] || type;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
    if (diffMinutes < 43200) return `${Math.floor(diffMinutes / 1440)}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const filteredHistory = filterHistory(history);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Search className="w-8 h-8 text-primary" />
              搜索历史
            </h1>
            <p className="mt-2 text-muted-foreground">快速回到你关心的论文方向，并复用热门检索词。</p>
          </div>

          <Card className="mb-6 border-border/50 shadow-card">
            <CardContent className="pt-4 flex items-start gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5" />
              <div>提示：历史会记录你的论文检索条件（关键词、标签、作者），可直接再次搜索。</div>
            </CardContent>
          </Card>

          {loading ? (
            <Card><CardContent className="py-12 text-center">加载中...</CardContent></Card>
          ) : (
            <>
              {popular.length > 0 && (
                <Card className="border-border/50 shadow-card mb-6">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />热门搜索</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {popular.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(query)}
                          className="px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-full text-sm text-foreground transition-colors flex items-center gap-2"
                        >
                          <span className="text-primary font-medium">#{index + 1}</span>
                          {query}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/50 shadow-card mb-6">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">筛选:</span>
                    </div>

                    <div className="flex gap-2">
                      {[{ value: 'all', label: '全部' },{ value: 'papers', label: '论文' },{ value: 'articles', label: '文章' },{ value: 'users', label: '用户' }].map((filter) => (
                        <button key={filter.value} onClick={() => setFilterType(filter.value as any)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filterType === filter.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}>
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      {[{ value: 'today', label: '今天' },{ value: 'week', label: '本周' },{ value: 'month', label: '本月' },{ value: 'all', label: '全部' }].map((range) => (
                        <button key={range.value} onClick={() => setTimeRange(range.value as any)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${timeRange === range.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}>
                          {range.label}
                        </button>
                      ))}
                    </div>

                    {filteredHistory.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={clearHistory}>
                        <Trash2 className="w-4 h-4 mr-1" />清空
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {filteredHistory.length === 0 ? (
                <Card className="border-border/50 shadow-card">
                  <CardContent className="py-12 text-center">
                    <Clock className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">暂无搜索记录</h3>
                    <p className="text-muted-foreground">{filterType !== 'all' || timeRange !== 'all' ? '没有找到匹配的搜索记录' : '开始搜索论文、文章和用户'}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 shadow-card divide-y divide-border/40">
                  {filteredHistory.map((item) => (
                    <div key={item.id} onClick={() => handleSearch(item.query)} className="p-5 hover:bg-secondary/30 cursor-pointer transition-colors flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-medium text-foreground truncate">{item.query}</h3>
                          <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full">{getSearchTypeLabel(item.search_type)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{getTimeAgo(item.created_at)}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(item.created_at).toLocaleString('zh-CN')}</div>
                        </div>
                      </div>

                      {item.results_count > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{item.results_count}</div>
                          <div className="text-xs text-muted-foreground">结果</div>
                        </div>
                      )}

                      <Button size="sm">再次搜索</Button>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchHistoryPage;
