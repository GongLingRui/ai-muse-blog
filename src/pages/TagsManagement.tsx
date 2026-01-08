import { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Tag,
  Save,
  X,
  Check,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

// 标签类型
interface TagItem {
  id: string;
  name: string;
  color: string;
  articleCount: number;
  createdAt: string;
}

// 预设颜色
const presetColors = [
  { name: "蓝色", value: "blue", class: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  { name: "青色", value: "cyan", class: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { name: "绿色", value: "green", class: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" },
  { name: "紫色", value: "purple", class: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" },
  { name: "粉色", value: "pink", class: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400" },
  { name: "橙色", value: "orange", class: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" },
  { name: "红色", value: "red", class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  { name: "黄色", value: "yellow", class: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { name: "靛蓝", value: "indigo", class: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { name: "青绿", value: "teal", class: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400" },
  { name: "琥珀", value: "amber", class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  { name: "翠绿", value: "emerald", class: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

// 获取颜色类
const getColorClass = (colorValue: string) => {
  return presetColors.find((c) => c.value === colorValue)?.class || presetColors[0].class;
};

// 模拟标签数据
const initialTags: TagItem[] = [
  { id: "1", name: "大模型", color: "blue", articleCount: 15, createdAt: "2024-01-01" },
  { id: "2", name: "AI", color: "cyan", articleCount: 20, createdAt: "2024-01-01" },
  { id: "3", name: "工程", color: "green", articleCount: 12, createdAt: "2024-01-02" },
  { id: "4", name: "攻击", color: "red", articleCount: 5, createdAt: "2024-01-03" },
  { id: "5", name: "Agent", color: "purple", articleCount: 8, createdAt: "2024-01-04" },
  { id: "6", name: "AIGC", color: "pink", articleCount: 10, createdAt: "2024-01-05" },
  { id: "7", name: "图像生成", color: "orange", articleCount: 7, createdAt: "2024-01-06" },
  { id: "8", name: "视频生成", color: "yellow", articleCount: 4, createdAt: "2024-01-07" },
  { id: "9", name: "推理", color: "indigo", articleCount: 9, createdAt: "2024-01-08" },
  { id: "10", name: "模型量化", color: "teal", articleCount: 6, createdAt: "2024-01-09" },
];

const TagsManagement = () => {
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagItem | null>(null);
  
  // 表单状态
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("blue");

  // 过滤标签
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 打开新增对话框
  const handleAdd = () => {
    setEditingTag(null);
    setFormName("");
    setFormColor("blue");
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setIsDialogOpen(true);
  };

  // 打开删除确认
  const handleDeleteClick = (tag: TagItem) => {
    setDeletingTag(tag);
    setIsDeleteDialogOpen(true);
  };

  // 保存标签
  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("请输入标签名称");
      return;
    }

    // 检查重名
    const isDuplicate = tags.some(
      (t) => t.name === formName.trim() && t.id !== editingTag?.id
    );
    if (isDuplicate) {
      toast.error("标签名称已存在");
      return;
    }

    if (editingTag) {
      // 编辑
      setTags((prev) =>
        prev.map((t) =>
          t.id === editingTag.id
            ? { ...t, name: formName.trim(), color: formColor }
            : t
        )
      );
      toast.success("标签已更新");
    } else {
      // 新增
      const newTag: TagItem = {
        id: Date.now().toString(),
        name: formName.trim(),
        color: formColor,
        articleCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setTags((prev) => [...prev, newTag]);
      toast.success("标签已创建");
    }

    setIsDialogOpen(false);
  };

  // 确认删除
  const handleDelete = () => {
    if (deletingTag) {
      setTags((prev) => prev.filter((t) => t.id !== deletingTag.id));
      toast.success("标签已删除");
    }
    setIsDeleteDialogOpen(false);
    setDeletingTag(null);
  };

  // 统计
  const totalArticles = tags.reduce((acc, t) => acc + t.articleCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                标签管理
              </h1>
              <p className="text-muted-foreground">
                管理文章标签，支持新增、编辑和删除
              </p>
            </div>
            <Button onClick={handleAdd} className="gradient-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              新增标签
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{tags.length}</p>
                    <p className="text-xs text-muted-foreground">总标签数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalArticles}</p>
                    <p className="text-xs text-muted-foreground">已标记文章</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Palette className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{presetColors.length}</p>
                    <p className="text-xs text-muted-foreground">可用颜色</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {tags.length > 0 ? Math.round(totalArticles / tags.length) : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">平均文章数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border focus:border-primary/50"
            />
          </div>

          {/* Tags Grid */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                所有标签 ({filteredTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTags.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn("text-sm font-medium", getColorClass(tag.color))}
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tag.articleCount} 篇文章
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(tag)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-foreground mb-1">
                    {searchQuery ? "未找到匹配的标签" : "暂无标签"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "请尝试其他搜索词" : "点击上方按钮创建第一个标签"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tag Preview Section */}
          <Card className="border-border shadow-card mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">标签预览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className={cn("text-sm cursor-pointer hover:scale-105 transition-transform", getColorClass(tag.color))}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "编辑标签" : "新增标签"}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? "修改标签信息" : "创建一个新的文章标签"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Tag Name */}
            <div className="space-y-2">
              <Label htmlFor="tagName">标签名称</Label>
              <Input
                id="tagName"
                placeholder="输入标签名称..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-secondary/30 border-border"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>标签颜色</Label>
              <div className="grid grid-cols-6 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormColor(color.value)}
                    className={cn(
                      "h-10 rounded-lg border-2 transition-all flex items-center justify-center",
                      color.class,
                      formColor === color.value
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary"
                        : "border-transparent hover:scale-105"
                    )}
                    title={color.name}
                  >
                    {formColor === color.value && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>预览效果</Label>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <Badge
                  variant="outline"
                  className={cn("text-sm", getColorClass(formColor))}
                >
                  {formName || "标签名称"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSave} className="gradient-primary text-white">
              <Save className="h-4 w-4 mr-2" />
              {editingTag ? "保存更改" : "创建标签"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除标签 <strong>"{deletingTag?.name}"</strong> 吗？
              {deletingTag && deletingTag.articleCount > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  注意：该标签已被 {deletingTag.articleCount} 篇文章使用，删除后相关文章的标签关联将被移除。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 AI Learning Hub. Created by 宫凡
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TagsManagement;
