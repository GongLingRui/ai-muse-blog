import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  FileText,
  Edit3,
  Plus,
  Save,
  X,
  BookOpen,
  Lightbulb,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";

// 论文类型
interface Paper {
  id: string;
  title: string;
  description: string;
  authors: string;
  year: number;
  venue: string;
  paper_url?: string;
  code_url?: string;
  tags: string[];
  collection_order: number;
}

// 合集类型
interface Collection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
  papers: Paper[];
  display_order: number;
}

// 统计数据类型
interface ClassicPapersStats {
  total_collections: number;
  total_papers: number;
  total_tags: number;
  tags: string[];
}

// 标签颜色映射
const getTagColor = (tag: string): string => {
  const colorMap: Record<string, string> = {
    "大模型": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "Transformer": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    "架构": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    "预训练": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
    "BERT": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "GPT": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    "Few-shot": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
    "RLHF": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    "Instruction": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    "开源": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    "LLaMA": "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
    "图像生成": "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
    "扩散模型": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    "DDPM": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    "AIGC": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800",
    "Stable Diffusion": "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
    "多模态": "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
    "对比学习": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    "CLIP": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "DALL-E": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    "视觉": "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
    "推理": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    "Prompting": "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800",
    "CoT": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    "Agent": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
    "ReAct": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    "ToT": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
    "强化学习": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    "反思": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    "自主系统": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    "AutoGPT": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    "模型量化": "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
    "推理优化": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "INT8": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
    "GPTQ": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
    "模型压缩": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    "微调": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    "LoRA": "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800",
    "QLoRA": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    "MoE": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800",
    "稀疏模型": "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
    "视觉语言": "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
    "少样本": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    "BLIP": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
    "分割": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
    "SAM": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    "最佳论文": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    "自回归": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    "世界模型": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    "Sora": "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    "长上下文": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    "效率": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  };

  return colorMap[tag] || "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
};

// 论文项组件
const PaperItem = ({
  paper,
  index,
  isEditing,
}: {
  paper: Paper;
  index: number;
  isEditing: boolean;
}) => {
  return (
    <div
      className={cn(
        "group flex gap-4 p-4 rounded-lg border transition-all",
        isEditing
          ? "border-dashed border-primary/50 bg-primary/5"
          : "border-border bg-card hover:bg-secondary/30"
      )}
    >
      {/* 序号 */}
      <div className="flex items-start gap-2 pt-1">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          {index + 1}
        </span>
      </div>

      {/* 论文信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">
              {paper.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {paper.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{paper.authors}</span>
              <span>•</span>
              <span>{paper.year}</span>
              <span>•</span>
              <span className="font-medium">{paper.venue}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {paper.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn("text-xs", getTagColor(tag))}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 shrink-0">
            {paper.paper_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={() => window.open(paper.paper_url, "_blank")}
              >
                <FileText className="h-4 w-4 mr-1" />
                Paper
              </Button>
            )}
            {paper.code_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(paper.code_url, "_blank")}
              >
                <Github className="h-4 w-4 mr-1" />
                Code
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 合集组件
const CollectionCard = ({
  collection,
  isEditing,
}: {
  collection: Collection;
  isEditing: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border shadow-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {collection.icon && <span className="text-2xl">{collection.icon}</span>}
                  <CardTitle className="text-xl">{collection.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {collection.papers.length} 篇论文
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {collection.description}
                </p>
              </div>
              <div className="p-2">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="space-y-3">
              {collection.papers
                .sort((a, b) => a.collection_order - b.collection_order)
                .map((paper, index) => (
                  <PaperItem
                    key={paper.id}
                    paper={paper}
                    index={index}
                    isEditing={isEditing}
                  />
                ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const ClassicPapers = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<ClassicPapersStats | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取经典论文合集
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [collectionsResponse, statsResponse] = await Promise.all([
          api.classicPapers.getCollections(),
          api.classicPapers.getStats(),
        ]);

        if (collectionsResponse.success) {
          setCollections(collectionsResponse.data);
        }
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error("Failed to fetch classic papers:", error);
        toast.error("加载经典论文失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  经典论文合集
                </h1>
                <p className="text-muted-foreground">
                  精选 AI 领域必读论文，按主题分类整理，助你系统性学习
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {collections.length > 0 ? (
                collections
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      isEditing={isEditing}
                    />
                  ))
              ) : (
                <Card className="border-border shadow-card">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        暂无论文合集
                      </h2>
                      <p className="text-muted-foreground">
                        经典论文正在整理中，敬请期待
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 shrink-0 space-y-6">
              {/* Usage Guide */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    如何使用
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    本页面收录了 AI 领域的经典论文，按照学习路径进行组织。
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>点击合集卡片展开论文列表</li>
                    <li>按顺序阅读可获得最佳学习效果</li>
                    <li>点击 Paper 查看原文，Code 查看代码</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Reading Tips */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    阅读建议
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    建议按照合集内的顺序阅读，每个合集都是一个完整的学习路径。
                  </p>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-amber-700 dark:text-amber-400">
                      <strong>推荐顺序：</strong>先读大模型基础，再根据兴趣选择其他方向。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              {stats && (
                <Card className="border-border shadow-card bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {stats.total_collections}
                        </p>
                        <p className="text-xs text-muted-foreground">论文合集</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {stats.total_papers}
                        </p>
                        <p className="text-xs text-muted-foreground">收录论文</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-center text-sm text-muted-foreground">
                        覆盖 {stats.total_tags} 个标签
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </main>

      {/* Add Collection Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>创建新合集</DialogTitle>
            <DialogDescription>
              创建一个新的论文合集，用于组织相关主题的论文
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">合集名称</label>
              <Input placeholder="例如：强化学习经典论文" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">合集简介</label>
              <Textarea
                placeholder="描述这个合集的学习目标和内容范围..."
                className="bg-secondary/30 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button
              className="gradient-primary text-white"
              onClick={() => {
                toast.info("此功能需要管理员权限");
                setAddDialogOpen(false);
              }}
            >
              创建合集
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 AI Learning Hub. Powered by AI Muse Blog
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClassicPapers;
