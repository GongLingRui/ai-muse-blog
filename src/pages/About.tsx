import { Mail, MessageCircle, Smartphone, User, Github, BookOpen, Code } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <User className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              宫凡
            </h1>
            <p className="text-muted-foreground text-lg">
              AI 研究者 / 工程师 / 技术博主
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* 个人简介 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  关于我
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  欢迎来到 AI Learning Hub！我是宫凡，一名专注于人工智能领域的研究者和工程师。
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  本站致力于分享 AI / 大模型 / AIGC 等领域的技术文章与学习资源，希望能帮助更多人深入理解和应用人工智能技术。
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary">大模型</Badge>
                  <Badge variant="secondary">AI 工程</Badge>
                  <Badge variant="secondary">AIGC</Badge>
                  <Badge variant="secondary">深度学习</Badge>
                  <Badge variant="secondary">Agent</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 联系方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">微信号</p>
                    <p className="font-medium text-foreground">18954196143</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">支付宝账号</p>
                    <p className="font-medium text-foreground">18954196143</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 技术栈 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  技术方向
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">大语言模型（LLM）研究与应用</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">AI Agent 架构设计</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">AIGC 图像/视频生成</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">模型推理优化与部署</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">AI 工程化最佳实践</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              如有合作或交流需求，欢迎通过微信联系我
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
