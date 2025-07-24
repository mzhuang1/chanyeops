import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  User, 
  Bot, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Search,
  Globe,
  X,
  Upload,
  Menu,
  Plus,
  Clock,
  MessageSquare
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChartRenderer from "@/components/chart-renderer";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  tools?: ToolUsage[];
  metadata?: {
    chartData?: any;
  };
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface ToolUsage {
  name: string;
  input: string;
  output: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }
      
      const response = await fetch('/api/conversations', {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const conversationList = await response.json();
        setConversations(conversationList);
        
        // Load the most recent conversation if exists
        if (conversationList.length > 0 && !currentConversationId) {
          loadConversation(conversationList[0].id);
        } else if (conversationList.length === 0) {
          // Create a new conversation if none exist
          createNewConversation();
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load specific conversation messages
  const loadConversation = async (conversationId: number) => {
    try {
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const conversationMessages = await response.json();
        setMessages(conversationMessages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          metadata: msg.metadata
        })));
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Create new conversation
  const createNewConversation = async () => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: '新对话',
          language: 'zh'
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const newConversation = await response.json();
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: '您好！我是产业集群发展潜力评估系统的AI助手。我可以帮您分析各地区的产业集群发展状况、评估投资潜力、预测发展趋势等。请告诉我您想了解什么？',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to local conversation
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '您好！我是产业集群发展潜力评估系统的AI助手。我可以帮您分析各地区的产业集群发展状况、评估投资潜力、预测发展趋势等。请告诉我您想了解什么？',
        timestamp: new Date()
      }]);
    }
  };

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Set demo user header for authentication
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      } else {
        headers['x-demo-user-id'] = 'guest_demo';
      }
      
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const attachment: Attachment = {
        id: data.id,
        name: data.filename,
        type: data.mimeType,
        size: data.fileSize,
        url: data.filePath
      };
      setAttachments(prev => [...prev, attachment]);
      setIsUploading(false);
      toast({
        title: "文件上传成功",
        description: `${data.filename} 已成功上传`,
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "上传失败",
        description: "文件上传失败，请重试",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; attachments?: Attachment[]; useSearch?: boolean }) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('demo_user') && {
            'x-demo-user-id': JSON.parse(localStorage.getItem('demo_user') || '{}').id
          })
        },
        body: JSON.stringify({ 
          message: data.content, 
          language: 'zh',
          attachments: data.attachments,
          useSearch: data.useSearch
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.content || data.message || '抱歉，我暂时无法处理您的请求。',
        timestamp: new Date(),
        metadata: data.metadata
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "发送失败",
        description: "请稍后重试或检查网络连接",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "文件大小不能超过10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSendMessage = (useSearch = false) => {
    if (!newMessage.trim() || isLoading) return;
    
    // Add user message with attachments
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: newMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Send to API with attachments and search option
    sendMessageMutation.mutate({
      content: newMessage,
      attachments: attachments.length > 0 ? attachments : undefined,
      useSearch
    });
    
    setNewMessage("");
    setAttachments([]);
    setShowTools(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "已复制",
      description: "消息已复制到剪贴板"
    });
  };

  const promptExamples = [
    "请分析深圳人工智能产业集群的发展现状",
    "对比长三角与珠三角制造业集群的竞争优势",
    "评估成都生物医药产业集群的投资潜力",
    "预测西安半导体产业集群未来3年发展趋势"
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation History Sidebar */}
      <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
        showConversations ? 'w-80' : 'w-0 overflow-hidden'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">对话历史</h2>
            <button
              onClick={createNewConversation}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="新建对话"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => loadConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                currentConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="font-medium text-gray-900 truncate">{conversation.title}</div>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(conversation.updatedAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无对话历史</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="切换对话历史"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">产业集群发展潜力评估系统</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>AI模型：GPT-4</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 1 && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">您好，我是您的AI助手</h2>
                <p className="text-gray-600">专业的产业集群分析，为您的决策提供数据支撑</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {promptExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="p-4 h-auto text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    onClick={() => setNewMessage(example)}
                  >
                    <div className="text-sm text-gray-700">{example}</div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                          {/* Display charts */}
                          {message.metadata?.chartData && (
                            <div className="mt-4">
                              <ChartRenderer chartData={message.metadata.chartData} />
                            </div>
                          )}
                          
                          {/* Display tool usage */}
                          {message.tools && message.tools.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.tools.map((tool, index) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-center text-blue-700 text-sm font-medium mb-2">
                                    {tool.name === 'search' && <Search className="w-4 h-4 mr-2" />}
                                    {tool.name === 'file_analysis' && <FileText className="w-4 h-4 mr-2" />}
                                    {tool.name === 'search' && '网络搜索'}
                                    {tool.name === 'file_analysis' && '文件分析'}
                                  </div>
                                  <div className="text-xs text-blue-600 mb-1">查询: {tool.input}</div>
                                  <div className="text-xs text-gray-600">{tool.output.slice(0, 200)}...</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {/* Display attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                                  {attachment.type.startsWith('image/') ? (
                                    <ImageIcon className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-gray-500" />
                                  )}
                                  <span className="text-xs text-gray-600">{attachment.name}</span>
                                  <span className="text-xs text-gray-400">({(attachment.size / 1024).toFixed(1)} KB)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          复制
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex">
                  <div className="mr-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-2xl p-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Attachments display */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  {attachment.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-sm text-blue-800">{attachment.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Tools bar */}
          {showTools && (
            <div className="mb-3 flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={(e) => {
                  e.preventDefault();
                  handleSendMessage(true);
                }}
                disabled={!newMessage.trim() || isLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                使用网络搜索
              </Button>
            </div>
          )}

          <div className="flex space-x-3">
            <div className="flex items-end space-x-2">
              {/* File upload button */}
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 p-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
              >
                {isUploading ? (
                  <Upload className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>

              {/* Tools toggle */}
              <Button
                size="sm"
                variant="ghost"
                className={`p-2 ${showTools ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setShowTools(!showTools)}
                disabled={isLoading}
              >
                <Globe className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入您的问题..."
                className="min-h-[50px] max-h-32 resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-auto"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.gif"
          />

          <div className="text-xs text-gray-500 mt-2 text-center">
            支持上传文档、图片等文件进行分析 • 可使用网络搜索获取最新信息
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}