import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import ArticleCard, { Article } from "@/components/ArticleCard";

// 标签颜色映射
const tagColors: Record<string, string> = {
  "大模型": "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
  "AI": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30",
  "工程": "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
  "攻击": "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  "Agent": "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
  "AIGC": "bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30",
  "图像生成": "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
  "视频生成": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  "推理": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30",
  "模型量化": "bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30",
};

// 模拟文章数据
const mockArticle = {
  id: "1",
  title: "深入理解 Transformer 架构：从 Attention 到 Multi-Head",
  author: "宫凡",
  authorAvatar: "",
  publishedAt: "2024-01-15",
  tags: ["大模型", "AI", "工程"],
  coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
  content: `
## 引言

Transformer 架构自 2017 年 "Attention is All You Need" 论文发表以来，已经成为现代深度学习的基石。本文将深入探讨其核心机制。

## 自注意力机制 (Self-Attention)

自注意力机制是 Transformer 的核心创新。它允许模型在处理序列时，同时关注所有位置的信息。

### 数学原理

注意力函数可以描述为将 Query 和一组 Key-Value 对映射到输出：

\`\`\`python
import torch
import torch.nn as nn
import math

class SelfAttention(nn.Module):
    def __init__(self, embed_size, heads):
        super(SelfAttention, self).__init__()
        self.embed_size = embed_size
        self.heads = heads
        self.head_dim = embed_size // heads
        
        self.queries = nn.Linear(self.head_dim, self.head_dim, bias=False)
        self.keys = nn.Linear(self.head_dim, self.head_dim, bias=False)
        self.values = nn.Linear(self.head_dim, self.head_dim, bias=False)
        
    def forward(self, values, keys, query, mask):
        N = query.shape[0]
        value_len, key_len, query_len = values.shape[1], keys.shape[1], query.shape[1]
        
        # Split embedding into self.heads pieces
        values = values.reshape(N, value_len, self.heads, self.head_dim)
        keys = keys.reshape(N, key_len, self.heads, self.head_dim)
        queries = query.reshape(N, query_len, self.heads, self.head_dim)
        
        energy = torch.einsum("nqhd,nkhd->nhqk", [queries, keys])
        
        if mask is not None:
            energy = energy.masked_fill(mask == 0, float("-1e20"))
        
        attention = torch.softmax(energy / (self.embed_size ** (1/2)), dim=3)
        
        out = torch.einsum("nhql,nlhd->nqhd", [attention, values])
        out = out.reshape(N, query_len, self.heads * self.head_dim)
        
        return out
\`\`\`

## 多头注意力 (Multi-Head Attention)

多头注意力允许模型同时关注来自不同表示子空间的信息：

- **并行处理**：多个注意力头可以并行计算
- **多样性**：不同的头可以学习不同类型的依赖关系
- **表达能力**：增强了模型捕捉复杂模式的能力

## 位置编码

由于 Transformer 不包含循环或卷积，需要注入位置信息：

\`\`\`python
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        self.register_buffer('pe', pe.unsqueeze(0))
    
    def forward(self, x):
        return x + self.pe[:, :x.size(1)]
\`\`\`

## 总结

Transformer 架构的成功在于：

1. **完全抛弃循环结构**，实现高度并行化
2. **自注意力机制**捕捉长距离依赖
3. **多头设计**增强表达能力
4. **位置编码**保留序列顺序信息

## 参考链接

- [Attention Is All You Need (原论文)](https://arxiv.org/abs/1706.03762)
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
- [PyTorch Transformer 文档](https://pytorch.org/docs/stable/generated/torch.nn.Transformer.html)
`,
};

// 模拟评论数据
const mockComments = [
  {
    id: "1",
    author: "张明",
    avatar: "",
    content: "非常详细的讲解！特别是代码示例部分，帮助我理解了多头注意力的实现细节。",
    publishedAt: "2024-01-16",
    likes: 12,
  },
  {
    id: "2",
    author: "李华",
    avatar: "",
    content: "请问位置编码为什么使用正弦和余弦函数？有什么特殊的数学意义吗？",
    publishedAt: "2024-01-16",
    likes: 5,
  },
  {
    id: "3",
    author: "王芳",
    avatar: "",
    content: "期待作者后续能写一篇关于 Vision Transformer 的文章！",
    publishedAt: "2024-01-17",
    likes: 8,
  },
];

// 模拟相关文章
const relatedArticles: Article[] = [
  {
    id: "2",
    title: "大模型推理优化：量化技术全解析",
    excerpt: "模型量化是降低大模型推理成本的关键技术。本文将介绍 INT8、INT4 量化原理...",
    coverImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-10",
    tags: ["推理", "模型量化", "大模型"],
  },
  {
    id: "3",
    title: "构建企业级 AI Agent：架构设计与最佳实践",
    excerpt: "AI Agent 正在重塑软件开发范式。本文分享如何设计可扩展的 Agent 架构...",
    coverImage: "https://images.unsplash.com/photo-1676299081847-c3c9b9c6a7a4?w=800&h=400&fit=crop",
    author: "宫凡",
    publishedAt: "2024-01-08",
    tags: ["Agent", "AI", "工程"],
  },
];

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const article = mockArticle; // 后续从数据库获取

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleTagClick = (tag: string) => {
    navigate(`/?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Hero Section with Cover Image */}
        {article.coverImage && (
          <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <div className={cn("py-6", !article.coverImage && "pt-24")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>

          {/* Article Header */}
          <header className={cn("mb-8", article.coverImage && "-mt-32 relative z-10")}>
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all",
                    tagColors[tag] || "bg-secondary/50 text-secondary-foreground"
                  )}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarImage src={article.authorAvatar} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {article.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground font-medium">{article.author}</p>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formatDate(article.publishedAt)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn(
                    "text-muted-foreground",
                    isLiked && "text-red-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
                  {isLiked ? 128 : 127}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={cn(
                    "text-muted-foreground",
                    isBookmarked && "text-primary"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <Separator className="mb-8 bg-border/50" />

          {/* Article Content */}
          <article className="prose prose-invert prose-lg max-w-none mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code
                        className="bg-secondary/50 px-1.5 py-0.5 rounded text-primary text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg border border-border/50 !bg-secondary/30 !my-6"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-foreground mt-10 mb-4 border-l-4 border-primary pl-4">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
                    {children}
                  </ol>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline underline-offset-4"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground bg-secondary/20 py-2 my-4 rounded-r">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          <Separator className="mb-8 bg-border/50" />

          {/* Comments Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              评论 ({mockComments.length})
            </h2>

            {/* Comment Input */}
            <Card className="mb-6 border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="写下你的评论..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 min-h-[100px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={!commentText.trim()}
                        className="gradient-tech text-primary-foreground"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        发表评论
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {mockComments.map((comment) => (
                <Card key={comment.id} className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback className="bg-secondary text-muted-foreground">
                          {comment.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {comment.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.publishedAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground mb-3">{comment.content}</p>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-red-400 h-8 px-2"
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {comment.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-8 px-2"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            回复
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="mb-8 bg-border/50" />

          {/* Related Articles */}
          <section className="pb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">相关推荐</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 AI Learning Hub. Created by 宫凡
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ArticleDetail;
