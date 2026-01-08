import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Image, Link2, Eye, Edit3, ChevronDown, Check } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// 预设标签
const PRESET_TAGS = [
  "大模型",
  "AI",
  "工程",
  "攻击",
  "Agent",
  "AIGC",
  "图像生成",
  "视频生成",
  "推理",
  "模型量化",
];

const WriteArticle = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string | undefined>(`# 开始写作

在这里输入你的文章内容...

## Markdown 支持

- **粗体** 和 *斜体*
- \`代码\` 和代码块
- [链接](https://example.com)
- 图片插入

\`\`\`python
# 代码高亮示例
def hello():
    print("Hello, AI!")
\`\`\`
`);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // 图片插入对话框
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  // 链接插入对话框
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("请输入文章标题");
      return;
    }
    if (!content?.trim()) {
      toast.error("请输入文章内容");
      return;
    }
    if (selectedTags.length === 0) {
      toast.error("请至少选择一个标签");
      return;
    }

    setSaving(true);
    // TODO: 保存到数据库
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("文章保存成功！");
    setSaving(false);
    navigate("/");
  };

  const handleCancel = () => {
    if (title || (content && content !== `# 开始写作\n\n在这里输入你的文章内容...`)) {
      if (confirm("确定要放弃当前编辑的内容吗？")) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  // 未登录提示
  if (!isLoggedIn) {
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
                onClick={handleSave}
                disabled={saving}
                className="gradient-tech text-primary-foreground glow-primary"
              >
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    保存中...
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

          {/* Tags Selection */}
          <div className="mb-6">
            <Label className="text-foreground mb-2 block">文章标签</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-secondary/30 border-border/50 hover:border-primary/50 h-auto min-h-[44px] py-2"
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.length === 0 ? (
                      <span className="text-muted-foreground">选择标签...</span>
                    ) : (
                      selectedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-primary/20 text-primary border-primary/30"
                        >
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full min-w-[300px] p-2 bg-card border-border/50" align="start">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                        selectedTags.includes(tag)
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                      )}
                    >
                      <span>{tag}</span>
                      {selectedTags.includes(tag) && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
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
