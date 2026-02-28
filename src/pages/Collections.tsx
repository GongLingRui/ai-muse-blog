import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Edit,
  Trash2,
  Folder,
  Plus,
  Search,
  Grid3x3,
  Loader2,
  BookOpen,
  FileText,
  X,
  Check,
  MoreHorizontal,
  Star,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  papers_count: number;
  created_at: string;
}

interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string;
  summary: string;
  published_date: string;
  category: string;
}

const Collections = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create collection dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  const [creating, setCreating] = useState(false);

  // Edit collection
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // View collection
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);
  const [collectionPapers, setCollectionPapers] = useState<Paper[]>([]);

  // Add to collection dialog
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState("");

  const colorOptions = [
    { value: "#3b82f6", name: "蓝色", class: "bg-blue-500" },
    { value: "#8b5cf6", name: "紫色", class: "bg-purple-500" },
    { value: "#ec4899", name: "粉色", class: "bg-pink-500" },
    { value: "#f43f5e", name: "红色", class: "bg-rose-500" },
    { value: "#f97316", name: "橙色", class: "bg-orange-500" },
    { value: "#eab308", name: "黄色", class: "bg-yellow-500" },
    { value: "#22c55e", name: "绿色", class: "bg-green-500" },
    { value: "#14b8a6", name: "青色", class: "bg-teal-500" },
    { value: "#06b6d4", name: "天蓝", class: "bg-cyan-500" },
    { value: "#6366f1", name: "靛蓝", class: "bg-indigo-500" },
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await api.collections.list() as {
        success: boolean;
        data: Collection[];
      };

      if (response.success) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
      toast.error("加载收藏夹失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("请输入收藏夹名称");
      return;
    }

    setCreating(true);
    try {
      await api.collections.create({
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim(),
        color: newCollectionColor,
      });

      toast.success("收藏夹创建成功");
      setCreateDialogOpen(false);
      setNewCollectionName("");
      setNewCollectionDesc("");
      fetchCollections();
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection) return;

    try {
      await api.collections.update(editingCollection.id, {
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim(),
        color: newCollectionColor,
      });

      toast.success("收藏夹更新成功");
      setEditDialogOpen(false);
      setEditingCollection(null);
      fetchCollections();
    } catch (error) {
      console.error("Failed to update collection:", error);
      toast.error("更新失败");
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await api.collections.delete(collectionId);
      toast.success("收藏夹已删除");
      fetchCollections();
    } catch (error) {
      console.error("Failed to delete collection:", error);
      toast.error("删除失败");
    }
  };

  const handleViewCollection = async (collection: Collection) => {
    setLoading(true);
    try {
      const response = await api.collections.get(collection.id) as {
        success: boolean;
        data: {
          collection: Collection;
          papers: Paper[];
        };
      };

      if (response.success) {
        setViewingCollection(response.data.collection);
        setCollectionPapers(response.data.papers);
      }
    } catch (error) {
      console.error("Failed to fetch collection papers:", error);
      toast.error("加载论文失败");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollectionName(collection.name);
    setNewCollectionDesc(collection.description || "");
    setNewCollectionColor(collection.color || "#3b82f6");
    setEditDialogOpen(true);
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await api.collections.addPaper(collectionId, { paper_id: selectedPaperId });

      toast.success("论文已添加到收藏夹");
      setAddToCollectionOpen(false);

      // Refresh collections to update counts
      fetchCollections();

      // Refresh current view if viewing same collection
      if (viewingCollection && viewingCollection.id === collectionId) {
        handleViewCollection(viewingCollection);
      }
    } catch (error: any) {
      console.error("Failed to add paper to collection:", error);
      if (error.response?.data?.detail === "Paper already in collection") {
        toast.error("论文已在收藏夹中");
      } else {
        toast.error("添加失败");
      }
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    if (!viewingCollection) return;

    try {
      await api.collections.removePaper(viewingCollection.id, paperId);
      toast.success("论文已移出收藏夹");

      // Refresh
      handleViewCollection(viewingCollection);
      fetchCollections();
    } catch (error) {
      console.error("Failed to remove paper:", error);
      toast.error("移出失败");
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-20 pb-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  我的收藏夹
                </h1>
                <p className="text-muted-foreground">
                  整理和管理你的论文收藏
                </p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    新建收藏夹
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>创建收藏夹</DialogTitle>
                    <DialogDescription>
                      创建一个新的论文收藏夹来组织你的论文
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">名称 *</Label>
                      <Input
                        id="name"
                        placeholder="例如: 深度学习论文"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">描述</Label>
                      <Textarea
                        id="description"
                        placeholder="描述这个收藏夹的内容..."
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                    <div>
                      <Label>颜色</Label>
                      <div className="flex gap-2 mt-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setNewCollectionColor(color.value)}
                            className={`
                              w-8 h-8 rounded-full transition-all
                              ${newCollectionColor === color.value ? 'ring-2 ring-offset-2 ring-foreground' : ''}
                              ${color.class}
                            `}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={creating}
                    >
                      取消
                    </Button>
                    <Button onClick={handleCreateCollection} disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          创建中...
                        </>
                      ) : (
                        "创建"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            {collections.length > 0 && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索收藏夹..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50"
                  />
                </div>
              </div>
            )}

            {/* Collections Grid */}
            {loading ? (
              <Card className="border-border/50">
                <CardContent className="py-12">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCollections.map((collection, index) => (
                  <Card
                    key={`collection-${collection.id}-${index}`}
                    className="border-border/50 shadow-card hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleViewCollection(collection)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: collection.color }}
                        >
                          <Folder className="h-6 w-6" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(collection); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`确定要删除收藏夹"${collection.name}"吗？`)) {
                                  handleDeleteCollection(collection.id);
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg mt-2">{collection.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {collection.papers_count} 篇论文
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(collection.created_at).toLocaleDateString()}
                        </Badge>
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
                    <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      还没有收藏夹
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      创建你的第一个收藏夹来组织论文
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      创建收藏夹
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Collection Detail Modal */}
      <Dialog open={!!viewingCollection} onOpenChange={(open) => !open && setViewingCollection(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-card border-border">
          {viewingCollection && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: viewingCollection.color }}
                  >
                    <Folder className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle>{viewingCollection.name}</DialogTitle>
                    <DialogDescription>
                      {viewingCollection.description || "无描述"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Papers in collection */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    收藏的论文 ({collectionPapers.length})
                  </h3>

                  {collectionPapers.length > 0 ? (
                    <div className="space-y-3">
                      {collectionPapers.map((paper, index) => (
                        <Card key={`collection-paper-${paper.id}-${index}`} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1 mb-1">
                                  {paper.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                  {paper.authors}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {paper.category}
                                  </Badge>
                                  <span>
                                    {new Date(paper.published_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/papers/${paper.id}`)}
                                >
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePaper(paper.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>收藏夹中没有论文</p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    openEditDialog(viewingCollection);
                    setViewingCollection(null);
                  }}
                >
                  编辑收藏夹
                </Button>
                <Button onClick={() => setViewingCollection(null)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>编辑收藏夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">名称 *</Label>
              <Input
                id="edit-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="bg-secondary/30 border-border/50"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                className="bg-secondary/30 border-border/50"
              />
            </div>
            <div>
              <Label>颜色</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCollectionColor(color.value)}
                    className={`
                      w-8 h-8 rounded-full transition-all
                      ${newCollectionColor === color.value ? 'ring-2 ring-offset-2 ring-foreground' : ''}
                      ${color.class}
                    `}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCollection}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
};

export default Collections;
