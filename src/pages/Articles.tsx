import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import ArticleCard, { Article } from "@/components/ArticleCard";

// 预设标签
const PRESET_TAGS = [
  { name: "全部", count: 50 },
  { name: "大模型", count: 15 },
  { name: "AI", count: 20 },
  { name: "工程", count: 12 },
  { name: "攻击", count: 5 },
  { name: "Agent", count: 8 },
  { name: "AIGC", count: 10 },
  { name: "图像生成", count: 7 },
  { name: "视频生成", count: 4 },
  { name: "推理", count: 9 },
  { name: "模型量化", count: 6 },
];

// 模拟所有文章数据
const allArticles: Article[] = [
  {
    id: "1",
    title: "深入理解 Transformer 架构：从 Attention 到 Multi-Head",
    excerpt: "本文将深入探讨 Transformer 的核心机制，包括自注意力机制的数学原理、多头注意力的设计思想...",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-15",
    tags: ["大模型", "AI", "工程"],
  },
  {
    id: "2",
    title: "大模型推理优化：量化技术全解析",
    excerpt: "模型量化是降低大模型推理成本的关键技术。本文将介绍 INT8、INT4 量化原理...",
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-12",
    tags: ["推理", "模型量化", "大模型"],
  },
  {
    id: "3",
    title: "构建企业级 AI Agent：架构设计与最佳实践",
    excerpt: "AI Agent 正在重塑软件开发范式。本文分享如何设计可扩展的 Agent 架构...",
    coverImage: "https://images.unsplash.com/photo-1676299081847-c3c9b9c6a7a4?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-10",
    tags: ["Agent", "AI", "工程"],
  },
  {
    id: "4",
    title: "AIGC 时代的图像生成技术发展历程",
    excerpt: "从 GAN 到 Diffusion Model，图像生成技术经历了多次革命性突破...",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-08",
    tags: ["AIGC", "图像生成", "AI"],
  },
  {
    id: "5",
    title: "LLM 安全攻防：提示注入与防护策略",
    excerpt: "大模型的安全问题日益突出。本文分析常见的攻击手法，包括提示注入、越狱攻击...",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-05",
    tags: ["攻击", "大模型", "AI"],
  },
  {
    id: "6",
    title: "视频生成模型 Sora 技术深度解读",
    excerpt: "Sora 的发布标志着视频生成进入新纪元。本文解析其技术架构...",
    coverImage: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-03",
    tags: ["视频生成", "AIGC", "AI"],
  },
  {
    id: "7",
    title: "模型微调实战：LoRA 与 QLoRA 对比分析",
    excerpt: "微调是让通用模型适应特定任务的关键。本文对比 LoRA、QLoRA 等参数高效微调方法...",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-01",
    tags: ["大模型", "工程", "AI"],
  },
  {
    id: "8",
    title: "AI 工程化：从研究到生产的完整链路",
    excerpt: "将 AI 模型部署到生产环境面临诸多挑战。本文分享模型服务化、监控运维的工程经验...",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2023-12-28",
    tags: ["工程", "AI", "大模型"],
  },
];

const Articles = () => {
  const [selectedTag, setSelectedTag] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 过滤文章
  const filteredArticles = allArticles.filter((article) => {
    const matchesTag = selectedTag === "全部" || article.tags.includes(selectedTag);
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 flex">
        {/* Sidebar - Tags */}
        <aside
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden",
            "hidden md:block"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              文章分类
            </h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1",
                    selectedTag === tag.name
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{tag.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      selectedTag === tag.name
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {tag.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Toggle Sidebar Button - Mobile */}
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-20 z-50 md:hidden bg-card border-border shadow-card"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", sidebarOpen && "rotate-180")} />
        </Button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-transform duration-300 z-40 w-64",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "md:hidden"
          )}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              文章分类
            </h2>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => {
                    setSelectedTag(tag.name);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1",
                    selectedTag === tag.name
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{tag.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      selectedTag === tag.name
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {tag.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)]",
            sidebarOpen ? "md:ml-64" : "md:ml-0"
          )}
        >
          <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {selectedTag === "全部" ? "全部文章" : selectedTag}
                </h1>
                <p className="text-sm text-muted-foreground">
                  共 {filteredArticles.length} 篇文章
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[280px] bg-secondary/50 border-border focus:border-primary/50"
                />
              </div>
            </div>

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl">📭</span>
                </div>
                <p className="text-xl font-medium text-foreground mb-2">暂无文章</p>
                <p className="text-muted-foreground">
                  该分类下暂无文章，请尝试其他分类
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Articles;
