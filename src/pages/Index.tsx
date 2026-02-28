import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ArticleList from "@/components/ArticleList";
import PapersSection from "@/components/PapersSection";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="pt-16">
        <HeroSection />

        {/* Papers Section - Show latest arXiv papers */}
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                最新论文
              </h2>
              <p className="text-muted-foreground">
                来自 arXiv 的最新 AI 研究论文（共172篇）
              </p>
            </div>
          </div>

          <PapersSection searchQuery={searchQuery} />
        </section>

        {/* Articles Section - Show blog articles */}
        <section className="container mx-auto px-4 py-12 bg-secondary/10">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              最新文章
            </h2>
            <p className="text-muted-foreground">
              探索 AI 领域的最新技术与实践经验
            </p>
          </div>

          <ArticleList searchQuery={searchQuery} />
        </section>
      </main>

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

export default Index;
