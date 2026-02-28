import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { StudyGroup } from '@/types';
import {
  Users,
  BookOpen,
  MessageSquare,
  Plus,
  Lock,
  Globe,
  Search,
  X,
  Info,
  LogOut,
  UserRound,
  ArrowRight,
  Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type GroupForm = {
  name: string;
  description: string;
  is_public: boolean;
  invite_only: boolean;
  focus_areas: string;
};

type GroupMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at?: string;
};

const StudyGroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());

  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersGroupName, setMembersGroupName] = useState('');

  const [form, setForm] = useState<GroupForm>({
    name: '',
    description: '',
    is_public: true,
    invite_only: false,
    focus_areas: '',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.studyGroups.list({ page: '1', page_size: '80' }) as any;
      if (response.success) {
        const list = response.data || [];
        setGroups(list);
        await resolveMyMembership(list);
      }
    } catch (error) {
      console.error('Failed to fetch study groups:', error);
      toast.error('加载学习小组失败');
    } finally {
      setLoading(false);
    }
  };

  const resolveMyMembership = async (list: StudyGroup[]) => {
    if (!user?.id) return;
    const ids = new Set<string>();
    for (const g of list) {
      if (g.owner_id === user.id) {
        ids.add(g.id);
        continue;
      }
      try {
        const membersResp = await api.studyGroups.getMembers(g.id) as any;
        const groupMembers = membersResp?.data || [];
        if (groupMembers.find((m: any) => m.user_id === user.id)) ids.add(g.id);
      } catch {
        // Ignore private groups that user cannot access.
      }
    }
    setMyGroupIds(ids);
  };

  const joinGroup = async (groupId: string) => {
    try {
      await api.studyGroups.join(groupId);
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
      setMyGroupIds((prev) => new Set([...prev, groupId]));
      toast.success('已加入学习小组');
    } catch (error: any) {
      console.error('Failed to join group:', error);
      toast.error(error?.message || '加入失败');
    }
  };

  const leaveGroup = async (group: StudyGroup) => {
    if (!myGroupIds.has(group.id)) return;
    if (group.owner_id === user?.id) {
      toast.error('你是组长，不能直接退出；请先转移或删除小组');
      return;
    }
    try {
      await api.studyGroups.leave(group.id);
      setGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g));
      setMyGroupIds((prev) => {
        const next = new Set(prev);
        next.delete(group.id);
        return next;
      });
      toast.success('已退出小组');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || '退出失败');
    }
  };

  const showMembers = async (group: StudyGroup) => {
    setMembersDialogOpen(true);
    setMembersLoading(true);
    setMembersGroupName(group.name);
    setMembers([]);
    try {
      const resp = await api.studyGroups.getMembers(group.id) as any;
      if (resp.success) {
        setMembers(resp.data || []);
      }
    } catch {
      toast.error('无法读取成员列表（可能为私有小组）');
    } finally {
      setMembersLoading(false);
    }
  };

  const createGroup = async () => {
    if (!form.name.trim()) return toast.error('请输入小组名称');
    if (form.name.trim().length < 3) return toast.error('小组名称至少3个字符');
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        is_public: form.is_public,
        invite_only: form.invite_only,
        focus_areas: form.focus_areas.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await api.studyGroups.create(payload);
      toast.success('小组创建成功');
      setShowCreateModal(false);
      setForm({ name: '', description: '', is_public: true, invite_only: false, focus_areas: '' });
      await fetchGroups();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter((group) => {
    const keyword = searchQuery.toLowerCase();
    const matchesSearch =
      group.name.toLowerCase().includes(keyword) ||
      (group.description?.toLowerCase().includes(keyword)) ||
      (group.focus_areas || []).some((x) => x.toLowerCase().includes(keyword));
    const matchesFilter =
      filter === 'all' ||
      (filter === 'public' && group.is_public) ||
      (filter === 'my' && myGroupIds.has(group.id));
    return matchesSearch && matchesFilter;
  });

  const stat = useMemo(() => {
    const my = groups.filter((g) => myGroupIds.has(g.id)).length;
    const pub = groups.filter((g) => g.is_public).length;
    return { total: groups.length, my, pub };
  }, [groups, myGroupIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 flex items-center justify-center"><div className="text-muted-foreground">加载中...</div></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />学习小组
                </h1>
                <p className="mt-2 text-muted-foreground">围绕论文方向组队共学：精读、讨论、整理和复盘。</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/papers">
                    <Compass className="w-4 h-4 mr-2" />去论文库
                  </Link>
                </Button>
                <Button onClick={() => setShowCreateModal(true)} className="gradient-primary">
                  <Plus className="w-5 h-5 mr-2" />创建小组
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <Card className="border-border/50 shadow-card"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">全部小组</p><p className="text-2xl font-bold">{stat.total}</p></CardContent></Card>
              <Card className="border-border/50 shadow-card"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">我的小组</p><p className="text-2xl font-bold">{stat.my}</p></CardContent></Card>
              <Card className="border-border/50 shadow-card"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">公开小组</p><p className="text-2xl font-bold">{stat.pub}</p></CardContent></Card>
            </div>

            <Card className="mt-4 border-border/50 shadow-card">
              <CardContent className="pt-4 flex items-start gap-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5" />
                <div>建议先按方向创建小组（如 MoE、量化、RAG、对齐），每周固定产出 1 次总结，沉淀可复用学习笔记。</div>
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索学习小组 / 方向标签..." className="pl-10" />
                </div>
              </div>

              <div className="flex gap-2">
                {[{ value: 'all', label: '全部' }, { value: 'public', label: '公开' }, { value: 'my', label: '我的' }].map((f) => (
                  <Button key={f.value} variant={filter === f.value ? 'default' : 'outline'} onClick={() => setFilter(f.value as any)}>{f.label}</Button>
                ))}
              </div>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <Card className="border-border/50 shadow-card"><CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">暂无学习小组</h3>
              <p className="text-muted-foreground mb-4">{searchQuery ? '没有找到匹配的小组' : '创建第一个学习小组开始协作学习'}</p>
              {!searchQuery && <Button onClick={() => setShowCreateModal(true)}>创建学习小组</Button>}
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const joined = myGroupIds.has(group.id);
                const isOwner = group.owner_id === user?.id;
                return (
                  <Card key={group.id} className="border-border/50 shadow-card hover:shadow-lg transition-shadow overflow-hidden">
                    <CardHeader className="pb-3 bg-secondary/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                            {group.is_public ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(group.focus_areas || []).slice(0, 4).map((area, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{group.description || '暂无描述'}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <button className="flex items-center gap-1 hover:text-foreground" onClick={() => showMembers(group)}>
                          <Users className="w-4 h-4" /><span>{group.member_count} 成员</span>
                        </button>
                        <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /><span>{group.discussion_count} 讨论</span></div>
                      </div>

                      <div className="flex gap-2">
                        {!joined ? (
                          <Button className="flex-1" onClick={() => joinGroup(group.id)}>
                            {group.is_public ? '加入小组' : '申请加入'}
                          </Button>
                        ) : (
                          <>
                            <Button className="flex-1" variant="secondary" disabled>
                              {isOwner ? '你是组长' : '已加入'}
                            </Button>
                            {!isOwner && (
                              <Button variant="outline" onClick={() => leaveGroup(group)}>
                                <LogOut className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button asChild variant="outline">
                          <Link to="/papers">
                            <BookOpen className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                        <span>创建于 {new Date(group.created_at).toLocaleDateString('zh-CN')}</span>
                        <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => showMembers(group)}>
                          成员 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-xl shadow-xl max-w-lg w-full border border-border">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">创建学习小组</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">小组名称</label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="输入小组名称（建议体现研究方向）" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">描述</label>
                    <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="说明小组目标、节奏和输出形式（例：每周共读+总结）" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">关注方向（逗号分隔）</label>
                    <Input value={form.focus_areas} onChange={(e) => setForm({ ...form, focus_areas: e.target.value })} placeholder="例如：量化, 蒸馏, MoE, 长上下文" />
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2"><input type="radio" checked={form.is_public} onChange={() => setForm({ ...form, is_public: true })} />公开</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={!form.is_public} onChange={() => setForm({ ...form, is_public: false })} />私有</label>
                    </div>
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <input type="checkbox" checked={form.invite_only} onChange={(e) => setForm({ ...form, invite_only: e.target.checked })} />
                      仅邀请加入
                    </label>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-border bg-secondary/20 flex justify-end gap-3 rounded-b-xl">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>取消</Button>
                  <Button onClick={createGroup} disabled={creating}>{creating ? '创建中...' : '创建'}</Button>
                </div>
              </div>
            </div>
          )}

          <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{membersGroupName} - 成员列表</DialogTitle>
                <DialogDescription>用于快速确认小组活跃度与角色分布。</DialogDescription>
              </DialogHeader>
              {membersLoading ? (
                <div className="text-sm text-muted-foreground">加载中...</div>
              ) : members.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无可展示成员</div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                  {members.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border/60 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <UserRound className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{m.user_id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>{m.role === 'owner' ? '组长' : '成员'}</Badge>
                        <Badge variant="outline">{m.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default StudyGroupsPage;
