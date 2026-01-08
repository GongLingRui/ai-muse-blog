import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Image, Link2, Eye, Edit3, ChevronDown, Check, Upload } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateArticle, useTags, useCategories } from "@/hooks";
import { toast } from "sonner";

const WriteArticle = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const createArticleMutation = useCreateArticle();
  const { data: tagsData } = useTags({});
  const { data: categoriesData } = useCategories({});

  const tags = tagsData?.items || [];
  const categories = categoriesData?.items || [];

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string | undefined>("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isPreview, setIsPreview] = useState(false);

  // 图片插入对话框
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // 链接插入对话框
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Auto-generate excerpt from content
  useEffect(() => {
    if (content && !excerpt) {
      const plainText = content
        .replace(/^#+\s.*$/gm, "") // Remove headings
        .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
        .replace(/\[.*?\]\(.*?\)/g, "") // Remove links
        .replace(/`{1,3}.*?`{1,3}/g, "") // Remove inline code
        .replace(/\n/g, " ") // Replace newlines with spaces
        .trim();

      const generatedExcerpt = plainText.slice(0, 200) + (plainText.length > 200 ? "..." : "");
      setExcerpt(generatedExcerpt);
    }
  }, [content]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      const imageMarkdown = `![${imageAlt || "图片"}](${imageUrl})`;
      setContent((prev) => (prev || "") + "\n" + imageMarkdown + "\n");
      setImageUrl("");
      setImageAlt("");
      setImageDialogOpen(false);
      toast.success("图片已插入");
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`;
      setContent((prev) => (prev || "") + linkMarkdown);
      setLinkUrl("");
      setLinkText("");
      setLinkDialogOpen(false);
      toast.success("链接已插入");
    }
  };

  const handleSave = async (publish = true) => {
    if (!title.trim()) {
      toast.error("请输入文章标题");
      return;
    }
    if (!content?.trim()) {
      toast.error("请输入文章内容");
      return;
    }

    try {
      await createArticleMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        cover_image: coverImage.trim() || undefined,
        category_id: selectedCategoryId || undefined,
        tag_ids: selectedTagIds,
        published: publish,
      });

      if (publish) {
        toast.success("文章发布成功！");
      } else {
        toast.success("草稿保存成功！");
      }
      navigate("/");
    } catch (error) {
      console.error("Failed to save article:", error);
    }
  };

  const handleCancel = () => {
    if (title || content || excerpt) {
      if (confirm("确定要放弃当前编辑的内容吗？")) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  // 未登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-16 min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">请先登录</h2>
            <p className="text-muted-foreground">登录后即可开始创作文章</p>
            <Button
              onClick={() => navigate("/auth")}
              className="gradient-tech text-primary-foreground"
            >
              前往登录
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              写文章
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-border/50 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={createArticleMutation.isPending}
                className="gradient-primary text-primary-foreground shadow-card"
              >
                {createArticleMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    发布中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    发布文章
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Title Input */}
          <div className="mb-6">
            <Label htmlFor="title" className="text-foreground mb-2 block">
              文章标题
            </Label>
            <Input
              id="title"
              placeholder="输入一个吸引人的标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold bg-secondary/30 border-border/50 focus:border-primary/50 h-14"
            />
          </div>

          {/* Cover Image */}
          <div className="mb-6">
            <Label htmlFor="coverImage" className="text-foreground mb-2 block">
              封面图片（可选）
            </Label>
            <div className="flex gap-2">
              <Input
                id="coverImage"
                placeholder="输入图片 URL..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 bg-secondary/30 border-border/50 focus:border-primary/50"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCoverImage("")}
                disabled={!coverImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {coverImage && (
              <div className="mt-3 rounded-lg overflow-hidden border border-border/50">
                <img src={coverImage} alt="封面预览" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>

          {/* Category Selection */}
          {categories && categories.length > 0 && (
            <div className="mb-6">
              <Label htmlFor="category" className="text-foreground mb-2 block">
                文章分类（可选）
              </Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="bg-secondary/30 border-border/50">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Selection */}
          {tags && tags.length > 0 && (
            <div className="mb-6">
              <Label className="text-foreground mb-2 block">文章标签</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-secondary/30 border-border/50 hover:border-primary/50 h-auto min-h-[44px] py-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedTagIds.length === 0 ? (
                        <span className="text-muted-foreground">选择标签...</span>
                      ) : (
                        selectedTagIds.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="bg-primary/20 text-primary border-primary/30"
                            >
                              {tag.name}
                            </Badge>
                          ) : null;
                        })
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[300px] p-2 bg-card border-border/50" align="start">
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                          selectedTagIds.includes(tag.id)
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                        )}
                      >
                        <span>{tag.name}</span>
                        {selectedTagIds.includes(tag.id) && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Excerpt */}
          <div className="mb-6">
            <Label htmlFor="excerpt" className="text-foreground mb-2 block">
              文章摘要（自动生成，可编辑）
            </Label>
            <Textarea
              id="excerpt"
              placeholder="文章会自动生成摘要..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="bg-secondary/30 border-border/50 focus:border-primary/50 min-h-[80px]"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-2">
              {/* Insert Image Dialog */}
              <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    插入图片
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border/50">
                  <DialogHeader>
                    <DialogTitle>插入图片</DialogTitle>
                    <DialogDescription>
                      输入图片 URL 将其插入到文章中
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">图片 URL</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageAlt">图片描述（可选）</Label>
                      <Input
                        id="imageAlt"
                        placeholder="图片的简短描述"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setImageDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleInsertImage}
                      className="gradient-tech text-primary-foreground"
                    >
                      插入
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Insert Link Dialog */}
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    插入链接
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border/50">
                  <DialogHeader>
                    <DialogTitle>插入链接</DialogTitle>
                    <DialogDescription>
                      添加参考链接到文章中
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">链接 URL</Label>
                      <Input
                        id="linkUrl"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkText">显示文本（可选）</Label>
                      <Input
                        id="linkText"
                        placeholder="点击这里"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        className="bg-secondary/30 border-border/50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setLinkDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleInsertLink}
                      className="gradient-tech text-primary-foreground"
                    >
                      插入
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(false)}
                className={cn(
                  "px-3",
                  !isPreview
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(true)}
                className={cn(
                  "px-3",
                  isPreview
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Eye className="h-4 w-4 mr-2" />
                预览
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="rounded-lg border border-border/50 overflow-hidden" data-color-mode="dark">
            <MDEditor
              value={content}
              onChange={setContent}
              preview={isPreview ? "preview" : "edit"}
              height={500}
              visibleDragbar={false}
              hideToolbar
              className="!bg-card"
              style={{
                backgroundColor: "hsl(222 47% 14%)",
              }}
            />
          </div>

          {/* Tips */}
          <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
            <h4 className="text-sm font-medium text-foreground mb-2">
              ✨ Markdown 快捷提示
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <span>**粗体** → <strong>粗体</strong></span>
              <span>*斜体* → <em>斜体</em></span>
              <span>`代码` → <code className="bg-secondary px-1 rounded">代码</code></span>
              <span>[链接](url) → 超链接</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WriteArticle;
