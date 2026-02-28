import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  Lightbulb,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SuggestedQuestion {
  question: string;
  category: string;
}

export default function AIQAAssistant() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { paperId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<SuggestedQuestion[]>([]);
  const [popularQuestions, setPopularQuestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadQuickQuestions();
    loadPopularQuestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadQuickQuestions = async () => {
    try {
      const response = await api.aiQa.getQuickQuestions("general") as {
        success: boolean;
        data: SuggestedQuestion[];
      };
      if (response.success) {
        setQuickQuestions(response.data);
      }
    } catch (error) {
      console.error("Failed to load quick questions:", error);
    }
  };

  const loadPopularQuestions = async () => {
    try {
      const response = await api.aiQa.getPopularQuestions(10) as {
        success: boolean;
        data: any[];
      };
      if (response.success) {
        setPopularQuestions(response.data);
      }
    } catch (error) {
      console.error("Failed to load popular questions:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check authentication for chat features
    if (!isAuthenticated) {
      toast.error("请先登录后再使用AI问答功能");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      let response;

      if (paperId) {
        // Ask about a specific paper
        response = await api.aiQa.askQuestion({
          paper_id: paperId,
          question: inputValue,
          conversation_history: messages.map((m) => ({
            question: m.role === "user" ? m.content : "",
            answer: m.role === "assistant" ? m.content : "",
          })),
        }) as any;
      } else {
        // General chat
        response = await api.aiQa.chat({
          message: inputValue,
          paper_id: paperId,
          conversation_id: conversationId || undefined,
        }) as any;
      }

      if (response.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.data.message || response.data.answer || "抱歉，我无法回答这个问题。",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (response.data.conversation_id) {
          setConversationId(response.data.conversation_id);
        }
      } else {
        toast.error("获取回答失败，请稍后重试");
      }
    } catch (error: any) {
      console.error("Error asking question:", error);
      // Silently ignore 401 errors
      if (!error?.message?.includes('401')) {
        toast.error(error.message || "获取回答失败");
      }

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，我暂时无法回答这个问题。请稍后重试或尝试其他问题。",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      const input = document.getElementById("question-input") as HTMLInputElement;
      input?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowSuggestions(true);
    toast.success("对话已清空");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                AI 研究助手
              </h1>
              <p className="text-muted-foreground">
                提问任何AI/ML相关问题，或探讨具体论文
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" onClick={handleClearChat}>
                <X className="h-4 w-4 mr-2" />
                清空对话
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 min-h-[500px] flex flex-col">
                <CardContent className="flex-1 p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 h-[500px] p-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          开始对话
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          提问AI/ML相关问题，或从右侧选择热门问题
                        </p>
                        {popularQuestions.length > 0 && (
                          <div className="w-full max-w-md">
                            <p className="text-sm font-medium mb-3">热门问题：</p>
                            <div className="grid grid-cols-1 gap-2">
                              {popularQuestions.slice(0, 3).map((pq, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  className="justify-start text-left h-auto py-3 px-4"
                                  onClick={() => handleQuickQuestion(pq.question)}
                                >
                                  <span className="text-sm">{pq.question}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${
                              msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary/50"
                              }`}
                            >
                              {msg.role === "assistant" && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                  <span className="text-xs font-medium">AI助手</span>
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-secondary/50 rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">
                                  正在思考...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t border-border/50 p-4">
                    <div className="flex gap-2">
                      <Input
                        id="question-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入你的问题... (按Enter发送)"
                        className="flex-1 bg-secondary/30 border-border/50"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="gradient-primary"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Questions */}
              {showSuggestions && messages.length === 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      常见问题
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quickQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                        onClick={() => handleQuickQuestion(q.question)}
                      >
                        {q.question}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Topics */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    按主题浏览
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => loadQuickQuestions()}
                  >
                    通用问题
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      api.aiQa.getQuickQuestions("techniques");
                      toast.info("已切换到技术问题");
                    }}
                  >
                    技术方法
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      api.aiQa.getQuickQuestions("applications");
                      toast.info("已切换到应用问题");
                    }}
                  >
                    实际应用
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      api.aiQa.getQuickQuestions("research");
                      toast.info("已切换到研究问题");
                    }}
                  >
                    研究方法
                  </Button>
                </CardContent>
              </Card>

              {/* Popular Questions */}
              {popularQuestions.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      热门问题
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {popularQuestions.slice(0, 5).map((pq, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => handleQuickQuestion(pq.question)}
                      >
                        <p className="text-xs font-medium mb-1">{pq.question}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pq.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {pq.ask_count} 次提问
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
