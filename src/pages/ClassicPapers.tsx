import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  FileText,
  Edit3,
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  BookOpen,
  Lightbulb,
  User,
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

// 论文类型
interface Paper {
  id: string;
  title: string;
  description: string;
  authors: string;
  year: number;
  venue: string;
  paperUrl?: string;
  codeUrl?: string;
  tags: string[];
}

// 合集类型
interface Collection {
  id: string;
  title: string;
  description: string;
  papers: Paper[];
}

// 模拟数据
const mockCollections: Collection[] = [
  {
    id: "1",
    title: "大模型基础论文",
    description: "理解现代大语言模型的核心基础，从 Transformer 到 GPT 系列的演进路径。",
    papers: [
      {
        id: "p1",
        title: "Attention Is All You Need",
        description: "提出 Transformer 架构，奠定了现代 NLP 的基础，引入自注意力机制替代 RNN。",
        authors: "Vaswani et al.",
        year: 2017,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/1706.03762",
        codeUrl: "https://github.com/tensorflow/tensor2tensor",
        tags: ["大模型", "Transformer"],
      },
      {
        id: "p2",
        title: "BERT: Pre-training of Deep Bidirectional Transformers",
        description: "双向预训练模型，开启预训练-微调范式，在多个 NLP 任务上取得突破。",
        authors: "Devlin et al.",
        year: 2018,
        venue: "NAACL",
        paperUrl: "https://arxiv.org/abs/1810.04805",
        codeUrl: "https://github.com/google-research/bert",
        tags: ["大模型", "预训练"],
      },
      {
        id: "p3",
        title: "Language Models are Few-Shot Learners (GPT-3)",
        description: "175B 参数的大模型，展示了上下文学习能力，开启大模型时代。",
        authors: "Brown et al.",
        year: 2020,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2005.14165",
        tags: ["大模型", "GPT"],
      },
      {
        id: "p4",
        title: "Training language models to follow instructions (InstructGPT)",
        description: "通过 RLHF 使模型更好地遵循人类指令，是 ChatGPT 的技术基础。",
        authors: "Ouyang et al.",
        year: 2022,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2203.02155",
        tags: ["大模型", "RLHF"],
      },
    ],
  },
  {
    id: "2",
    title: "扩散模型与图像生成",
    description: "从 DDPM 到 Stable Diffusion，理解扩散模型的原理与图像生成的前沿技术。",
    papers: [
      {
        id: "p5",
        title: "Denoising Diffusion Probabilistic Models (DDPM)",
        description: "扩散模型的奠基性工作，提出去噪扩散概率模型的理论框架。",
        authors: "Ho et al.",
        year: 2020,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2006.11239",
        codeUrl: "https://github.com/hojonathanho/diffusion",
        tags: ["图像生成", "扩散模型"],
      },
      {
        id: "p6",
        title: "High-Resolution Image Synthesis with Latent Diffusion Models",
        description: "在潜在空间进行扩散，大幅降低计算成本，是 Stable Diffusion 的核心。",
        authors: "Rombach et al.",
        year: 2022,
        venue: "CVPR",
        paperUrl: "https://arxiv.org/abs/2112.10752",
        codeUrl: "https://github.com/CompVis/latent-diffusion",
        tags: ["图像生成", "扩散模型", "AIGC"],
      },
      {
        id: "p7",
        title: "CLIP: Learning Transferable Visual Models From Natural Language",
        description: "通过对比学习连接图像和文本，实现零样本图像分类。",
        authors: "Radford et al.",
        year: 2021,
        venue: "ICML",
        paperUrl: "https://arxiv.org/abs/2103.00020",
        codeUrl: "https://github.com/openai/CLIP",
        tags: ["多模态", "对比学习"],
      },
    ],
  },
  {
    id: "3",
    title: "Agent 与推理",
    description: "探索 LLM 的推理能力与自主决策机制，从 CoT 到 ReAct 的技术演进。",
    papers: [
      {
        id: "p8",
        title: "Chain-of-Thought Prompting Elicits Reasoning in LLMs",
        description: "思维链提示方法，显著提升大模型的复杂推理能力。",
        authors: "Wei et al.",
        year: 2022,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2201.11903",
        tags: ["推理", "Prompting"],
      },
      {
        id: "p9",
        title: "ReAct: Synergizing Reasoning and Acting in Language Models",
        description: "结合推理和行动，让模型能够与外部工具交互完成复杂任务。",
        authors: "Yao et al.",
        year: 2022,
        venue: "ICLR",
        paperUrl: "https://arxiv.org/abs/2210.03629",
        codeUrl: "https://github.com/ysymyth/ReAct",
        tags: ["Agent", "推理"],
      },
      {
        id: "p10",
        title: "Tree of Thoughts: Deliberate Problem Solving with LLMs",
        description: "思维树框架，允许模型探索多个推理路径并自我评估。",
        authors: "Yao et al.",
        year: 2023,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2305.10601",
        codeUrl: "https://github.com/princeton-nlp/tree-of-thought-llm",
        tags: ["推理", "Agent"],
      },
    ],
  },
  {
    id: "4",
    title: "模型压缩与量化",
    description: "让大模型更高效地部署和推理，包括量化、剪枝和知识蒸馏等技术。",
    papers: [
      {
        id: "p11",
        title: "LLM.int8(): 8-bit Matrix Multiplication for Transformers",
        description: "首次实现大模型的 8 位量化推理，几乎无精度损失。",
        authors: "Dettmers et al.",
        year: 2022,
        venue: "NeurIPS",
        paperUrl: "https://arxiv.org/abs/2208.07339",
        codeUrl: "https://github.com/TimDettmers/bitsandbytes",
        tags: ["模型量化", "推理"],
      },
      {
        id: "p12",
        title: "GPTQ: Accurate Post-Training Quantization for GPT",
        description: "高效的训练后量化方法，支持 3-4 位量化。",
        authors: "Frantar et al.",
        year: 2023,
        venue: "ICLR",
        paperUrl: "https://arxiv.org/abs/2210.17323",
        codeUrl: "https://github.com/IST-DASLab/gptq",
        tags: ["模型量化", "大模型"],
      },
      {
        id: "p13",
        title: "LoRA: Low-Rank Adaptation of Large Language Models",
        description: "低秩适应方法，大幅降低微调成本，保持模型性能。",
        authors: "Hu et al.",
        year: 2021,
        venue: "ICLR",
        paperUrl: "https://arxiv.org/abs/2106.09685",
        codeUrl: "https://github.com/microsoft/LoRA",
        tags: ["模型压缩", "微调"],
      },
    ],
  },
];

// 标签颜色
const tagColors: Record<string, string> = {
  "大模型": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "Transformer": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  "预训练": "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  "GPT": "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  "RLHF": "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  "图像生成": "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
  "扩散模型": "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  "AIGC": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800",
  "多模态": "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
  "对比学习": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  "推理": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  "Prompting": "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800",
  "Agent": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  "模型量化": "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
  "模型压缩": "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "微调": "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
};

// 论文项组件
const PaperItem = ({
  paper,
  index,
  isEditing,
  onEdit,
  onDelete,
}: {
  paper: Paper;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
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
      {/* 拖拽手柄 & 序号 */}
      <div className="flex items-start gap-2 pt-1">
        {isEditing && (
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab hover:text-foreground" />
        )}
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
                  className={cn(
                    "text-xs",
                    tagColors[tag] || "bg-secondary text-secondary-foreground"
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 shrink-0">
            {paper.paperUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={() => window.open(paper.paperUrl, "_blank")}
              >
                <FileText className="h-4 w-4 mr-1" />
                Paper
              </Button>
            )}
            {paper.codeUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(paper.codeUrl, "_blank")}
              >
                <Github className="h-4 w-4 mr-1" />
                Code
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={onEdit}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
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
                  <CardTitle className="text-xl">{collection.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {collection.papers.length} 篇论文
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {collection.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    编辑合集
                  </Button>
                )}
                <div className="p-2">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="space-y-3">
              {collection.papers.map((paper, index) => (
                <PaperItem
                  key={paper.id}
                  paper={paper}
                  index={index}
                  isEditing={isEditing}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
              {isEditing && (
                <Button
                  variant="outline"
                  className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加论文
                </Button>
              )}
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
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      取消
                    </Button>
                    <Button
                      className="gradient-primary text-white"
                      onClick={() => setIsEditing(false)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      保存更改
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    编辑模式
                  </Button>
                )}
              </div>
            </div>

            {/* Edit Mode Banner */}
            {isEditing && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-6">
                <div className="flex items-center gap-2 text-primary">
                  <Edit3 className="h-5 w-5" />
                  <span className="font-medium">编辑模式已开启</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  你可以添加、编辑、删除论文，或拖拽调整论文顺序
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {mockCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  isEditing={isEditing}
                />
              ))}

              {isEditing && (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed text-muted-foreground hover:text-primary hover:border-primary"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  创建新合集
                </Button>
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

              {/* Author Info */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    关于作者
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong className="text-foreground">宫凡</strong>
                  </p>
                  <p>
                    专注于 AI 工程与研究，致力于将前沿技术转化为可落地的工程实践。
                    本合集基于个人学习与研究经验整理。
                  </p>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="border-border shadow-card bg-primary/5">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {mockCollections.length}
                      </p>
                      <p className="text-xs text-muted-foreground">论文合集</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {mockCollections.reduce((acc, c) => acc + c.papers.length, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">收录论文</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              onClick={() => setAddDialogOpen(false)}
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
            © 2024 AI Learning Hub. Created by 宫凡
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClassicPapers;
