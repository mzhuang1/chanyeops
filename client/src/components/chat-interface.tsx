import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageCircle,
  Send,
  Paperclip,
  Mic,
  Bot,
  User,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react";
import ChartComponents from "./chart-components";
import { Message } from "@shared/schema";

interface ChatInterfaceProps {
  conversationId?: number;
  messages?: Message[];
  isLoading?: boolean;
  onSendMessage?: (content: string) => void;
  className?: string;
}

export default function ChatInterface({
  conversationId,
  messages = [],
  isLoading = false,
  onSendMessage,
  className = ""
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample messages for demonstration
  const sampleMessages: Message[] = [
    {
      id: 1,
      conversationId: 1,
      role: "assistant",
      content: "您好！我是产业集群分析助手。您可以询问关于任何地区产业集群的发展潜力、创新能力、政策支持等问题。我将为您提供专业的数据分析和可视化结果。",
      metadata: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      conversationId: 1,
      role: "user",
      content: "请帮我评估长三角地区生物医药产业集群的发展潜力",
      metadata: null,
      createdAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: 3,
      conversationId: 1,
      role: "assistant",
      content: "基于最新数据分析，长三角生物医药产业集群具有以下特征：\n\n**优势分析：**\n该产业集群在创新能力和政策支持方面表现突出，拥有完善的产学研合作体系。\n\n**发展建议：**\n建议加强人才引进和国际合作，提升核心技术竞争力。\n\n**风险提示：**\n需关注市场竞争加剧和技术更新迭代的挑战。",
      metadata: {
        chartData: {
          radarData: [
            { subject: '创新能力', value: 85.3, fullMark: 100 },
            { subject: '人才集聚', value: 78.5, fullMark: 100 },
            { subject: '产业规模', value: 82.1, fullMark: 100 },
            { subject: '政策支持', value: 92.1, fullMark: 100 },
            { subject: '基础设施', value: 88.7, fullMark: 100 },
            { subject: '市场环境', value: 79.3, fullMark: 100 }
          ]
        },
        metrics: {
          totalScore: 85.3,
          innovationScore: 85.3,
          policyScore: 92.1
        }
      },
      createdAt: new Date(Date.now() - 60000).toISOString()
    }
  ];

  const displayMessages = messages.length > 0 ? messages : sampleMessages;

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (onSendMessage) {
      setIsTyping(true);
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "刚刚";
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return date.toLocaleDateString("zh-CN");
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRegenerate = () => {
    if (onSendMessage && displayMessages.length > 0) {
      const lastUserMessage = [...displayMessages].reverse().find(m => m.role === "user");
      if (lastUserMessage) {
        setIsTyping(true);
        onSendMessage(lastUserMessage.content);
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isTyping]);

  useEffect(() => {
    if (!isLoading) {
      setIsTyping(false);
    }
  }, [isLoading]);

  return (
    <Card className={`professional-card overflow-hidden h-[700px] flex flex-col ${className}`}>
      {/* Chat Header */}
      <CardHeader className="gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">AI 智能分析助手</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-secondary/20 text-white">GPT-4</Badge>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 chat-message ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary">
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                <div
                  className={`rounded-2xl p-4 max-w-3xl relative group ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  {/* Message Content */}
                  <div className={`prose prose-sm max-w-none ${
                    message.role === "user" ? "prose-invert" : ""
                  }`}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                            {children}
                          </td>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-4 mt-6 text-foreground">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold mb-3 mt-5 text-foreground border-b border-gray-200 pb-2">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold mb-2 mt-4 text-foreground">
                            {children}
                          </h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-6 mb-4 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-6 mb-4 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-foreground">
                            {children}
                          </li>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 leading-relaxed text-foreground">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-foreground">
                            {children}
                          </strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                            {children}
                          </blockquote>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Render charts if metadata exists */}
                  {message.metadata && (
                    <div className="mt-4">
                      <ChartComponents data={message.metadata} />
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.role === "assistant" && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        复制
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={handleRegenerate}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        重新生成
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className={`text-xs text-muted-foreground mt-1 ${
                  message.role === "user" ? "text-right mr-4" : "ml-4"
                }`}>
                  {formatTime(message.createdAt)}
                </div>
              </div>
              
              {message.role === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback>
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {(isTyping || isLoading) && (
            <div className="flex items-start space-x-3 chat-message">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary">
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input removed - using main chat input instead */}
    </Card>
  );
}
