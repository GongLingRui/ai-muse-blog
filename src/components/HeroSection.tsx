import { Sparkles, BookOpen, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">探索 AI 前沿技术</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
          <span className="text-foreground">欢迎来到</span>
          <br />
          <span className="text-gradient">AI Learning Hub</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          深入探索人工智能的奥秘，从大模型到 AI Agent，从理论到实践，
          与你一起成长的 AI 学习平台。
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-foreground">50+</p>
              <p className="text-xs text-muted-foreground">精选文章</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-foreground">10+</p>
              <p className="text-xs text-muted-foreground">技术专题</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-foreground">1000+</p>
              <p className="text-xs text-muted-foreground">活跃读者</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
