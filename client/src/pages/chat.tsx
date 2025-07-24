import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageCircle,
  Send,
  Plus,
  Trash2,
  Edit3,
  MoreVertical,
  User,
  Bot,
  Sparkles,
  ChevronDown,
  Paperclip,
  Mic,
  StopCircle,
  BookOpen,
  Database,
  FileText,
  Link,
  HelpCircle,
  Brain
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Conversation, Message } from "@shared/schema";
import ChartComponents from "@/components/chart-components";
import FileUpload from "@/components/file-upload";
import { TypewriterText } from "@/components/TypewriterText";
import { QAnythingChat } from "@/components/QAnythingChat";
import ChatSessionItem from "@/components/ChatSessionItem";
import faqData from "@/data/faq.json";

export default function Chat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarCollapsed(true);
      }
    };
    
    // Check on mount
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showQAnything, setShowQAnything] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentName, setSelectedDocumentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversationId = id ? parseInt(id) : null;

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"]
  }) as { data: Conversation[], isLoading: boolean };

  // Fetch current conversation
  const { data: currentConversation } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
    refetchInterval: 1000, // Auto-refresh every 1 second to get new messages
    refetchOnWindowFocus: true,
    refetchOnMount: true
  }) as { data: Message[], isLoading: boolean, refetch: () => void };

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; language: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
    onSuccess: (conversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/chat/${conversation.id}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('auth.loginExpired'),
          description: t('auth.relogin'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: language === 'zh' ? "创建失败" : "Creation Failed",
        description: language === 'zh' ? "无法创建新对话" : "Unable to create new conversation",
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { 
        content, 
        language 
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Message sent successfully:", data);
      setNewMessage("");
      setIsTyping(false);
      
      // Immediate refresh to show user message
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      refetchMessages();
      
      // Enhanced polling for AI responses with multiple refresh intervals
      const pollIntervals = [500, 1000, 2000, 3000, 5000, 8000, 12000, 18000];
      
      pollIntervals.forEach((delay) => {
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
        }, delay);
      });
      
      // Continuous polling for first 30 seconds to catch any delayed responses
      let pollCount = 0;
      const continuousPolling = setInterval(() => {
        pollCount++;
        queryClient.refetchQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
        
        if (pollCount >= 15) { // Poll for 30 seconds (15 * 2s)
          clearInterval(continuousPolling);
        }
      }, 2000);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "登录已过期",
          description: "正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "发送失败",
        description: "消息发送失败，请重试",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // Send QAnything message
  const sendQAnythingMessageMutation = useMutation({
    mutationFn: async (data: { message: string; fileId: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/qanything`, data);
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      setIsTyping(false);
      
      // Immediate refresh for QAnything responses
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      queryClient.refetchQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      
      // Enhanced polling for QAnything AI responses
      const pollIntervals = [500, 1000, 2000, 3000, 5000, 8000];
      
      pollIntervals.forEach((delay) => {
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
        }, delay);
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "登录已过期",
          description: "正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "文档问答失败",
        description: "文档问答失败，已切换回普通聊天",
        variant: "destructive",
      });
      // Clear document selection and fallback to normal chat
      setSelectedDocumentId(null);
      setSelectedDocumentName(null);
      sendMessageMutation.mutate(newMessage.trim());
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/conversations/${id}`);
      return response.json();
    },
    onSuccess: (data, deletedId) => {
      console.log("Conversation deleted successfully:", deletedId);
      // Force immediate refresh of conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.refetchQueries({ queryKey: ["/api/conversations"] });
      
      // If current conversation was deleted, redirect to chat home
      if (conversationId && deletedId.toString() === conversationId.toString()) {
        setLocation("/chat");
      }
      
      toast({
        title: "已删除",
        description: "对话已成功删除",
      });
    },
    onError: (error: Error) => {
      console.error("Delete conversation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "登录已过期",
          description: "正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "删除失败",
        description: error.message || "无法删除对话",
        variant: "destructive",
      });
    },
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("DELETE", `/api/conversations/${conversationId}/messages/${messageId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      toast({
        title: "已删除",
        description: "消息已成功删除",
      });
    },
    onError: (error: Error) => {
      console.error("Delete message error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "登录已过期",
          description: "正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "删除失败",
        description: error.message || "无法删除消息",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      // Set demo user header for authentication
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      } else {
        headers['x-demo-user-id'] = 'guest_demo';
      }
      
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: headers,
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (upload) => {
      toast({
        title: "文件上传成功",
        description: `${upload.originalName} 已上传并开始处理`,
      });
      // Add file reference to message
      const fileRef = `[文件: ${upload.originalName}]`;
      setNewMessage(newMessage + fileRef);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "登录已过期",
          description: "正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "上传失败",
        description: "文件上传失败，请重试",
        variant: "destructive",
      });
    },
  });

  const handleCreateConversation = () => {
    const title = newMessage.trim() || "新对话";
    console.log("Creating conversation with title:", title);
    createConversationMutation.mutate({
      title: title.substring(0, 50),
      language: language
    });
  };

  const handleSendMessage = () => {
    console.log("Send button clicked", { newMessage, conversationId, selectedDocumentId });
    
    if (!newMessage.trim()) {
      console.log("Empty message, returning");
      return;
    }
    
    if (!conversationId) {
      console.log("No conversation ID, creating new conversation");
      handleCreateConversation();
      return;
    }

    console.log("Sending message...");
    setIsTyping(true);
    
    // If QAnything document is selected, use document chat
    if (selectedDocumentId) {
      console.log("Using QAnything document chat");
      sendQAnythingMessageMutation.mutate({
        message: newMessage.trim(),
        fileId: selectedDocumentId
      });
    } else {
      console.log("Using normal chat");
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  // QAnything document chat handler
  const handleChatWithDocument = (fileId: string, fileName: string) => {
    setSelectedDocumentId(fileId);
    setSelectedDocumentName(fileName);
    setShowQAnything(false);
    toast({
      title: "文档已选择",
      description: `现在与"${fileName}"进行问答`,
    });
  };

  const handleClearDocumentSelection = () => {
    setSelectedDocumentId(null);
    setSelectedDocumentName(null);
    toast({
      title: "已切换回普通聊天",
      description: "不再使用文档问答模式",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteConversation = (id: number) => {
    console.log("Deleting conversation:", id);
    if (window.confirm("确定要删除这个对话吗？")) {
      deleteConversationMutation.mutate(id);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    if (window.confirm("确定要删除这条消息吗？")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Knowledge base options
  const knowledgeBaseItems = [
    { id: 1, title: "产业集群发展报告", type: "报告", description: "2023年全国产业集群发展现状分析" },
    { id: 2, title: "政策解读文档", type: "政策", description: "最新产业支持政策汇编" },
    { id: 3, title: "案例研究库", type: "案例", description: "成功产业集群案例分析" },
    { id: 4, title: "数据统计资料", type: "数据", description: "各地区产业数据统计" },
    { id: 5, title: "专家观点集", type: "观点", description: "行业专家深度观点汇总" }
  ];

  const handleFAQClick = (question: string) => {
    setNewMessage(question);
    if (!conversationId) {
      handleCreateConversation();
      return;
    }
    setIsTyping(true);
    sendMessageMutation.mutate(question);
  };

  const handleKnowledgeBaseSelect = (item: typeof knowledgeBaseItems[0]) => {
    const linkText = `[链接知识库: ${item.title}]`;
    setNewMessage(newMessage + linkText);
    setShowKnowledgeBase(false);
    toast({
      title: "已链接知识库",
      description: `已链接「${item.title}」到当前对话`
    });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    // Reset input value to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Mobile overlay when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarCollapsed ? 'w-0 lg:w-16' : 'w-80 lg:w-64'
      } ${
        sidebarCollapsed ? 'hidden lg:flex' : 'fixed lg:relative'
      } bg-gray-900 text-white flex flex-col transition-all duration-300 z-50 h-full top-0 left-0`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <Button
            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
            onClick={handleCreateConversation}
            disabled={createConversationMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            新建对话
          </Button>
        </div>
        
        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversationsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-800 rounded animate-pulse"></div>
              ))
            ) : conversations.length === 0 ? (
              !sidebarCollapsed && (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无对话</p>
                </div>
              )
            ) : (
              conversations.map((conversation: Conversation) => (
                <ChatSessionItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversationId === conversation.id}
                  isCollapsed={sidebarCollapsed}
                  onSelect={(id) => setLocation(`/chat/${id}`)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Toggle Sidebar */}
        <div className="p-2 border-t border-gray-700">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">对话历史</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                onClick={() => setSidebarCollapsed(true)}
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-400 hover:text-white p-2"
              onClick={() => setSidebarCollapsed(false)}
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="text-gray-600 dark:text-gray-300 p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <h1 className="text-base font-semibold text-gray-800 dark:text-white truncate">智能对话助手</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
        {conversationId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
                  {messagesLoading ? (
                    <div className="space-y-8">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                        智能分析助手
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-8">
                        我是您的AI智能分析助手，可以帮您分析产业数据、生成规划报告
                      </p>
                      
                      {/* FAQ Section */}
                      <div className="max-w-4xl mx-auto mb-8">
                        <div className="flex items-center justify-center mb-6">
                          <HelpCircle className="w-5 h-5 text-blue-500 mr-2" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">常见问题</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {faqData.zh.map((faq) => (
                            <Button
                              key={faq.id}
                              variant="outline"
                              className="h-auto p-4 text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                              onClick={() => handleFAQClick(faq.question)}
                            >
                              <div className="w-full">
                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                  {faq.question}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {faq.category === 'planning' && '规划'}
                                  {faq.category === 'evaluation' && '评估'}
                                  {faq.category === 'analysis' && '分析'}
                                  {faq.category === 'strategy' && '策略'}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-4 group relative ${
                            message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === "user" 
                              ? "bg-blue-600" 
                              : "bg-gradient-to-r from-purple-500 to-pink-500"
                          }`}>
                            {message.role === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={`${
                              message.role === "user" ? "text-right" : "text-left"
                            }`}>
                              <div className="prose prose-gray dark:prose-invert max-w-none">
                                {message.role === "assistant" ? (
                                  <TypewriterText 
                                    text={message.content}
                                    speed={30}
                                    className="whitespace-pre-wrap"
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                )}
                              </div>
                              
                              {/* Render charts if metadata exists */}
                              {message.metadata && message.role === "assistant" && message.metadata as any && (
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <ChartComponents data={message.metadata as any} />
                                </div>
                              )}
                              
                              <div className={`flex items-center justify-between mt-2 ${
                                message.role === "user" ? "flex-row-reverse" : ""
                              }`}>
                                <div className="text-xs text-gray-500">
                                  {formatTime(message.createdAt ? (typeof message.createdAt === 'string' ? message.createdAt : message.createdAt.toISOString()) : new Date().toISOString())}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-auto"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  title="删除消息"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Input Area - Single Instance Only */}
            <div id="chat-input-area-main" className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0 z-10">
              <div className="max-w-3xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
                {/* Document Q&A Mode Indicator */}
                {selectedDocumentId && (
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800 dark:text-blue-200">
                          文档问答模式: <span className="font-medium">{selectedDocumentName}</span>
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleClearDocumentSelection}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        退出
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Main Input Container - Single Instance */}
                <div className="relative flex items-end border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  {/* Left side buttons */}
                  <div className="flex items-center space-x-1 pl-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto text-gray-400 hover:text-gray-600"
                      onClick={handleFileUpload}
                      disabled={uploadFileMutation.isPending}
                      title="上传文件"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 h-auto ${selectedDocumentId ? 'text-blue-600 bg-blue-50' : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'}`}
                      onClick={() => setShowQAnything(!showQAnything)}
                      title="文档问答"
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                      title="知识库"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Text input area */}
                  <Textarea
                    ref={textareaRef}
                    placeholder={selectedDocumentId ? "向文档提问..." : "输入您的问题..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 resize-none border-0 bg-transparent py-3 px-3 min-h-[52px] max-h-32 text-base focus:ring-0 focus:outline-none"
                    rows={1}
                    disabled={sendMessageMutation.isPending || sendQAnythingMessageMutation.isPending}
                  />
                  
                  {/* Right side send button */}
                  <div className="flex items-center space-x-1 pr-2">
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending || sendQAnythingMessageMutation.isPending}
                      className={`p-2 h-auto ${
                        newMessage.trim() && !sendMessageMutation.isPending && !sendQAnythingMessageMutation.isPending
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                      title={selectedDocumentId ? "向文档提问" : "发送消息"}
                    >
                      {(sendMessageMutation.isPending || sendQAnythingMessageMutation.isPending) ? (
                        <StopCircle className="w-4 h-4" />
                      ) : selectedDocumentId ? (
                        <Brain className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.txt,.png,.jpg,.jpeg,.gif,.ppt,.pptx"
                />
                
                {/* Dropdown Content - Positioned outside input */}
                {showQAnything && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">文档问答</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowQAnything(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </Button>
                    </div>
                    <QAnythingChat onChatWithDocument={handleChatWithDocument} />
                  </div>
                )}
                
                {showKnowledgeBase && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white shadow-lg max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">知识库</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowKnowledgeBase(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {knowledgeBaseItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer rounded border"
                          onClick={() => handleKnowledgeBaseSelect(item)}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{item.type}</span>
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 text-center mt-2">
                  AI可能会出错，请核实重要信息
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                智能产业评估与规划系统
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                选择一个对话开始，或创建新的对话来进行智能分析和规划
              </p>
              <FileUpload 
                onFileUploaded={(upload) => {
                  toast({
                    title: "文件上传成功",
                    description: `${upload.originalName} 已开始处理分析`
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}