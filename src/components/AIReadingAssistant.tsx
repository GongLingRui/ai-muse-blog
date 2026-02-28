import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  BookOpen,
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Paper {
  id: string;
  title: string;
  arxiv_id: string;
  pdf_url: string;
}

interface AIReadingAssistantProps {
  paper: Paper;
  onTextSelected?: (text: string) => void;
  className?: string;
}

interface TextExplanation {
  original_text: string;
  explanation: string;
  key_terms: Array<{ term: string; meaning: string }>;
  suggested_reading: string;
}

interface SectionSummary {
  section_title: string;
  summary: string;
  key_contributions: string[];
  main_methods: string[];
  takeaway: string;
}

interface QAExchange {
  question: string;
  answer: string;
  sources: string[];
}

const AIReadingAssistant = ({ paper, onTextSelected, className }: AIReadingAssistantProps) => {
  const [selectedText, setSelectedText] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });

  // Text Explanation
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<TextExplanation | null>(null);

  // Section Summary
  const [summarizing, setSummarizing] = useState(false);
  const [sectionSummary, setSectionSummary] = useState<SectionSummary | null>(null);
  const [sectionInput, setSectionInput] = useState("");

  // Q&A
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QAExchange[]>([]);

  // Panel state
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"explain" | "summary" | "qa">("explain");

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Detect text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 2 && text.length < 500) {
        // Check if selection is within PDF container
        const range = selection.getRangeAt(0);
        const container = pdfContainerRef.current;

        if (container && container.contains(range.commonAncestorContainer)) {
          setSelectedText(text);
          setToolbarPosition({ x: window.event?.clientX || 0, y: window.event?.clientY || 0 });
          setShowToolbar(true);
          onTextSelected?.(text);
        }
      } else {
        setShowToolbar(false);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, [onTextSelected]);

  const handleExplainText = async () => {
    if (!selectedText) return;

    setExplaining(true);
    setActiveTab("explain");
    setPanelOpen(true);

    try {
      const response = await api.readingAssistant.explainText({
        paper_id: paper.id,
        text: selectedText,
      }) as { success: boolean; data: TextExplanation };

      if (response.success) {
        setExplanation(response.data);
      }
    } catch (error: any) {
      console.error("Explanation failed:", error);
      toast.error(error?.detail || "解释失败，请稍后重试");
    } finally {
      setExplaining(false);
      setShowToolbar(false);
    }
  };

  const handleSummarizeSection = async () => {
    if (!sectionInput.trim()) {
      toast.error("请输入章节内容");
      return;
    }

    setSummarizing(true);

    try {
      const response = await api.readingAssistant.summarizeSection({
        paper_id: paper.id,
        section_text: sectionInput,
        section_title: "选中的文本区域",
      }) as { success: boolean; data: SectionSummary };

      if (response.success) {
        setSectionSummary(response.data);
      }
    } catch (error: any) {
      console.error("Summary failed:", error);
      toast.error(error?.detail || "摘要生成失败，请稍后重试");
    } finally {
      setSummarizing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setAskingQuestion(true);

    try {
      const response = await api.readingAssistant.qaPaper({
        paper_id: paper.id,
        question,
        conversation_history: qaHistory.map(exchange => [
          { role: "user", content: exchange.question },
          { role: "assistant", content: exchange.answer },
        ]).flat(),
      }) as { success: boolean; data: QAExchange };

      if (response.success) {
        setQaHistory([...qaHistory, response.data]);
        setQuestion("");
      }
    } catch (error: any) {
      console.error("Q&A failed:", error);
      toast.error(error?.detail || "问答失败，请稍后重试");
    } finally {
      setAskingQuestion(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-border p-2 flex gap-2 animate-in fade-in slide-in-from-top-2"
          style={{
            left: `${Math.min(toolbarPosition.x, window.innerWidth - 300)}px`,
            top: `${toolbarPosition.y - 60}px`,
          }}
        >
          <Button
            size="sm"
            onClick={handleExplainText}
            disabled={explaining}
            className="gradient-primary text-white"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI解释
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSectionInput(selectedText);
              setActiveTab("summary");
              setPanelOpen(true);
              setShowToolbar(false);
            }}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            章节摘要
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveTab("qa");
              setPanelOpen(true);
              setShowToolbar(false);
            }}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            问答
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowToolbar(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Side Panel */}
      {panelOpen && (
        <div className="w-80 border-l border-border bg-card">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">AI阅读助手</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPanelOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 p-2 bg-muted/50">
              <TabsTrigger value="explain" className="text-xs">
                选文解释
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">
                章节摘要
              </TabsTrigger>
              <TabsTrigger value="qa" className="text-xs">
                智能问答
              </TabsTrigger>
            </TabsList>

            {/* Text Explanation Tab */}
            <TabsContent value="explain" className="p-3">
              <ScrollArea className="h-[500px]">
                {explaining ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI正在解释...</p>
                  </div>
                ) : explanation ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">选中的文本</h4>
                      <p className="text-sm bg-secondary/30 p-2 rounded italic">
                        "{explanation.original_text.substring(0, 100)}
                        {explanation.original_text.length > 100 ? "..." : ""}"
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">AI解释</h4>
                      <p className="text-sm leading-relaxed">{explanation.explanation}</p>
                    </div>

                    {explanation.key_terms && explanation.key_terms.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">关键术语</h4>
                          <div className="space-y-2">
                            {explanation.key_terms.map((term, idx) => (
                              <div key={idx} className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                  {term.term}
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  {term.meaning}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {explanation.suggested_reading && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">相关阅读</h4>
                          <p className="text-sm text-muted-foreground">{explanation.suggested_reading}</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-4">选中PDF中的文本，点击"AI解释"获取详细说明</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Section Summary Tab */}
            <TabsContent value="summary" className="p-3">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      粘贴或输入章节内容
                    </label>
                    <Textarea
                      placeholder="粘贴论文中的章节内容..."
                      value={sectionInput}
                      onChange={(e) => setSectionInput(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleSummarizeSection}
                      disabled={summarizing || !sectionInput.trim()}
                      className="w-full mt-2"
                      size="sm"
                    >
                      {summarizing ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-2" />
                          生成摘要
                        </>
                      )}
                    </Button>
                  </div>

                  {summarizing && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">AI正在生成摘要...</p>
                    </div>
                  )}

                  {sectionSummary && !summarizing && (
                    <div className="space-y-4">
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">
                          {sectionSummary.section_title}
                        </h4>
                        <p className="text-sm leading-relaxed">{sectionSummary.summary}</p>
                      </div>

                      {sectionSummary.takeaway && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">核心要点</h4>
                          <p className="text-sm bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                            {sectionSummary.takeaway}
                          </p>
                        </div>
                      )}

                      {sectionSummary.key_contributions && sectionSummary.key_contributions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">主要贡献</h4>
                          <div className="space-y-1">
                            {sectionSummary.key_contributions.map((contribution, idx) => (
                              <div key={idx} className="text-sm flex gap-2">
                                <span className="text-green-600 dark:text-green-400">•</span>
                                <span>{contribution}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionSummary.main_methods && sectionSummary.main_methods.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2">主要方法</h4>
                          <div className="space-y-1">
                            {sectionSummary.main_methods.map((method, idx) => (
                              <div key={idx} className="text-sm flex gap-2">
                                <span className="text-purple-600 dark:text-purple-400">•</span>
                                <span>{method}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Q&A Tab */}
            <TabsContent value="qa" className="p-3">
              <div className="h-[500px] flex flex-col">
                <ScrollArea className="flex-1 mb-3">
                  {qaHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mb-2">关于这篇论文有什么疑问？</p>
                      <p className="text-xs text-muted-foreground">AI助手会基于论文内容回答你的问题</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {qaHistory.map((exchange, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-end">
                            <div className="bg-primary/10 rounded-lg p-2 max-w-[85%]">
                              <p className="text-sm font-medium">{exchange.question}</p>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-secondary/30 rounded-lg p-2 max-w-[85%]">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{exchange.answer}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {askingQuestion && (
                        <div className="flex justify-start">
                          <div className="bg-secondary/30 rounded-lg p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="输入你的问题..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={2}
                    className="text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={askingQuestion || !question.trim()}
                    size="sm"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default AIReadingAssistant;
