import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Calendar,
  Tag,
  Filter,
  Star,
  SortAsc,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Note {
  id: string;
  paper_id: string;
  user_id: string;
  content: string;
  note_type: "question" | "insight" | "summary" | "other";
  is_public: boolean;
  page_number: number | null;
  created_at: string;
  updated_at: string;
  paper: {
    id: string;
    arxiv_id: string;
    title: string;
    authors: string;
    category: string;
    published_date: string;
  };
}

interface GroupedNotes {
  [paperId: string]: {
    paper: Note["paper"];
    notes: Note[];
  };
}

const noteTypes = [
  { value: "insight", name: "见解", color: "bg-blue-500" },
  { value: "question", name: "问题", color: "bg-orange-500" },
  { value: "summary", name: "摘要", color: "bg-green-500" },
  { value: "other", name: "其他", color: "bg-gray-500" },
];

const MyNotes = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<Note["note_type"]>("insight");
  const [newNoteIsPublic, setNewNoteIsPublic] = useState(false);
  const [newNotePage, setNewNotePage] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [groupByPaper, setGroupByPaper] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await api.notes.getMyNotes() as {
        success: boolean;
        data: Note[];
      };

      if (response.success) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      toast.error("加载笔记失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (paperId: string, paperTitle: string) => {
    setEditingNote(null);
    setNewNoteContent("");
    setNewNoteType("insight");
    setNewNoteIsPublic(false);
    setNewNotePage("");
    setDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
    setNewNoteType(note.note_type);
    setNewNoteIsPublic(note.is_public);
    setNewNotePage(note.page_number?.toString() || "");
    setDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error("请输入笔记内容");
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        // Update existing note
        await api.notes.update(editingNote.id, {
          content: newNoteContent.trim(),
          note_type: newNoteType,
          is_public: newNoteIsPublic,
          page_number: newNotePage ? parseInt(newNotePage) : null,
        });
        toast.success("笔记更新成功");
      } else {
        // Create new note - need to select a paper first
        toast.info("请先选择论文");
        return;
      }

      setDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("确定要删除这条笔记吗？")) {
      return;
    }

    setActionLoading(noteId);
    try {
      await api.notes.delete(noteId);
      toast.success("笔记已删除");
      fetchNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (note: Note) => {
    setActionLoading(note.id);
    try {
      await api.notes.update(note.id, {
        is_public: !note.is_public,
      });
      toast.success(note.is_public ? "已设为私有" : "已设为公开");
      fetchNotes();
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      toast.error("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and sort notes
  const filteredAndSorted = notes
    .filter((note) => {
      const matchesSearch =
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.paper.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        typeFilter === "all" || note.note_type === typeFilter;
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && note.is_public) ||
        (visibilityFilter === "private" && !note.is_public);
      return matchesSearch && matchesType && matchesVisibility;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created_at":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "updated_at":
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

  // Group by paper if enabled
  const groupedNotes: GroupedNotes = {};
  if (groupByPaper) {
    filteredAndSorted.forEach((note) => {
      if (!groupedNotes[note.paper_id]) {
        groupedNotes[note.paper_id] = {
          paper: note.paper,
          notes: [],
        };
      }
      groupedNotes[note.paper_id].notes.push(note);
    });
  }

  const getNoteTypeBadge = (type: Note["note_type"]) => {
    const typeConfig = noteTypes.find((t) => t.value === type);
    if (!typeConfig) return null;

    return (
      <Badge
        variant="outline"
        className={`${typeConfig.color} text-white border-0`}
      >
        {typeConfig.name}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          <div className="container mx-auto max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  我的笔记
                </h1>
                <p className="text-muted-foreground">
                  管理你的论文笔记和见解
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupByPaper(!groupByPaper)}
                >
                  {groupByPaper ? (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      按论文分组
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      列表视图
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <Card className="border-border/50 mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      总笔记数
                    </p>
                    <p className="text-2xl font-bold">{notes.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      公开笔记
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {notes.filter((n) => n.is_public).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      私有笔记
                    </p>
                    <p className="text-2xl font-bold text-gray-600">
                      {notes.filter((n) => !n.is_public).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      关联论文
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {new Set(notes.map((n) => n.paper_id)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索笔记内容或论文标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/30 border-border/50"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-border/50">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {noteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-border/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="可见性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="public">公开</SelectItem>
                  <SelectItem value="private">私有</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px] bg-secondary/30 border-border/50">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">最近更新</SelectItem>
                  <SelectItem value="created_at">创建时间</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes List */}
            {loading ? (
              <Card className="border-border/50">
                <CardContent className="py-12">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredAndSorted.length > 0 ? (
              <div className="space-y-6">
                {groupByPaper ? (
                  // Grouped by paper
                  Object.values(groupedNotes).map(({ paper, notes: paperNotes }, index) => (
                    <Card key={`grouped-paper-${paper.id}-${index}`} className="border-border/50">
                      <CardHeader
                        className="cursor-pointer hover:bg-secondary/30 transition-colors"
                        onClick={() => navigate(`/papers/${paper.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg line-clamp-1">
                            {paper.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {paperNotes.length} 条笔记
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {paper.authors}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {paperNotes.map((note, noteIndex) => (
                          <div
                            key={`note-${note.id}-${noteIndex}`}
                            className="border border-border/50 rounded-lg p-4 hover:border-border transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                {getNoteTypeBadge(note.note_type)}
                                {note.is_public && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    公开
                                  </Badge>
                                )}
                                {note.page_number && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    第 {note.page_number} 页
                                  </Badge>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditNote(note)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleVisibility(note)}
                                  >
                                    {note.is_public ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        设为私有
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        设为公开
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm whitespace-pre-wrap mb-3">
                              {note.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(note.updated_at)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => navigate(`/papers/${paper.id}`)}
                              >
                                查看论文
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Flat list
                  filteredAndSorted.map((note, index) => (
                    <Card
                      key={`flat-note-${note.id}-${index}`}
                      className="border-border/50 hover:shadow-md transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() =>
                              navigate(`/papers/${note.paper_id}`)
                            }
                          >
                            <h4 className="font-medium text-sm line-clamp-1 mb-1 hover:text-primary transition-colors">
                              {note.paper.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {note.paper.authors}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getNoteTypeBadge(note.note_type)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditNote(note)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleVisibility(note)}
                                >
                                  {note.is_public ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      设为私有
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      设为公开
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <p className="text-sm whitespace-pre-wrap mb-4">
                          {note.content}
                        </p>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {note.page_number && (
                              <span>第 {note.page_number} 页</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(note.updated_at)}
                            </span>
                            {note.is_public && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Eye className="h-3 w-3" />
                                公开
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/papers/${note.paper_id}`)}
                          >
                            查看论文
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              /* Empty State */
              <Card className="border-border/50">
                <CardContent className="py-16">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {searchQuery || typeFilter !== "all"
                        ? "没有找到匹配的笔记"
                        : "还没有笔记"}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || typeFilter !== "all"
                        ? "尝试调整搜索或筛选条件"
                        : "在阅读论文时添加你的第一篇笔记"}
                    </p>
                    {!searchQuery && typeFilter === "all" && (
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

      {/* Edit/Create Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNote ? "编辑笔记" : "新建笔记"}</DialogTitle>
            <DialogDescription>
              {editingNote
                ? "修改你的笔记内容"
                : "创建一篇新的论文笔记"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editingNote && (
              <div className="p-3 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  {editingNote.paper.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editingNote.paper.authors}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="content">笔记内容 *</Label>
              <Textarea
                id="content"
                placeholder="写下你的笔记、见解或问题..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={6}
                className="bg-secondary/30 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">类型</Label>
                <Select
                  value={newNoteType}
                  onValueChange={(v) =>
                    setNewNoteType(v as Note["note_type"])
                  }
                >
                  <SelectTrigger className="bg-secondary/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="page">页码 (可选)</Label>
                <Input
                  id="page"
                  type="number"
                  placeholder="页码"
                  value={newNotePage}
                  onChange={(e) => setNewNotePage(e.target.value)}
                  className="bg-secondary/30 border-border/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newNoteIsPublic}
                  onCheckedChange={setNewNoteIsPublic}
                />
                <Label htmlFor="public" className="cursor-pointer">
                  公开笔记 (其他人可见)
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSaveNote} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default MyNotes;
