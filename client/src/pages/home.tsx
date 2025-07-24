import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
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
import { TypewriterText } from "@/components/TypewriterText";
import faqData from "@/data/faq.json";

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
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
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
      // Ensure demo user exists
      let demoUser = localStorage.getItem('demo_user');
      if (!demoUser) {
        const newDemoUser = { id: 'guest_demo', name: 'Demo User' };
        localStorage.setItem('demo_user', JSON.stringify(newDemoUser));
        demoUser = JSON.stringify(newDemoUser);
      }

      const headers: any = { 
        'Content-Type': 'application/json',
        'x-demo-user-id': JSON.parse(demoUser).id
      };
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: language === 'zh' ? '新对话' : 'New Conversation',
          language: language
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const newConversation = await response.json();
        console.log('Created new conversation:', newConversation);
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: language === 'zh' 
            ? '您好！我是智能评估与规划系统的AI助手。我可以帮您分析各地区的产业集群发展状况、评估投资潜力、预测发展趋势、制定五年规划等。请告诉我您想了解什么？'
            : 'Hello! I am the AI assistant for the intelligent assessment and planning system. I can help you analyze regional industrial cluster development, assess investment potential, predict development trends, create five-year plans, and more. What would you like to explore?',
          timestamp: new Date()
        }]);
        
        toast({
          title: t('success.created'),
          description: language === 'zh' ? "已创建新对话" : "New conversation created"
        });
      } else {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: t('common.error'),
        description: language === 'zh' ? "创建对话失败，已切换到本地模式" : "Failed to create conversation, switched to local mode",
        variant: "destructive"
      });
      
      // Fallback to local conversation
      const localConversation = {
        id: Date.now(),
        title: language === 'zh' ? '新对话 (本地)' : 'New Conversation (Local)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setConversations(prev => [localConversation, ...prev]);
      setCurrentConversationId(localConversation.id);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: language === 'zh' 
          ? '您好！我是智能评估与规划系统的AI助手。我可以帮您分析各地区的产业集群发展状况、评估投资潜力、预测发展趋势、制定五年规划等。请告诉我您想了解什么？'
          : 'Hello! I am the AI assistant for the intelligent assessment and planning system. I can help you analyze regional industrial cluster development, assess investment potential, predict development trends, create five-year plans, and more. What would you like to explore?',
        timestamp: new Date()
      }]);
    }
  };

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const attachment: Attachment = {
        id: data.id,
        name: data.filename,
        type: data.mimeType,
        size: data.size,
        url: data.url
      };
      setAttachments(prev => [...prev, attachment]);
      setIsUploading(false);
      toast({
        title: t('fileUpload.success'),
        description: language === 'zh' ? `${data.filename} 已成功上传` : `${data.filename} uploaded successfully`,
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: t('fileUpload.failed'),
        description: language === 'zh' ? "文件上传失败，请重试" : "File upload failed, please try again",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; attachments?: Attachment[]; useSearch?: boolean }) => {
      const headers: any = { 
        'Content-Type': 'application/json'
      };
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          message: data.content, 
          conversationId: currentConversationId,
          language: 'zh',
          attachments: data.attachments,
          enableWebSearch: data.useSearch
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
        title: language === 'zh' ? "发送失败" : "Send Failed",
        description: language === 'zh' ? "请稍后重试或检查网络连接" : "Please try again or check your network connection",
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
        title: language === 'zh' ? "文件过大" : "File Too Large",
        description: t('fileUpload.maxSize'),
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

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    sendMessageMutation.mutate({
      content: newMessage,
      attachments: attachments.length > 0 ? attachments : undefined,
      useSearch: useWebSearch
    });

    setNewMessage("");
    setAttachments([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const faqQuestions = faqData[language];

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation History Sidebar */}
      <div className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 ${
        showConversations ? 'w-80' : 'w-0 overflow-hidden'
      }`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('chat.conversationHistory')}</h2>
            <button
              onClick={createNewConversation}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('chat.newConversation')}
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
                {new Date(conversation.updatedAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('chat.noConversations')}</p>
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
                title={t('chat.conversationHistory')}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{language === 'zh' ? '智能评估与规划' : 'Intelligent Assessment & Planning'}</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{language === 'zh' ? 'AI模型：GPT-4' : 'AI Model: GPT-4'}</span>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('chat.hello')}</h2>
                  <p className="text-gray-600">{t('chat.welcomeSubtitle')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {faqQuestions.map((faq) => (
                    <Button
                      key={faq.id}
                      variant="outline"
                      className="p-4 h-auto text-left hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      onClick={() => setNewMessage(faq.question)}
                    >
                      <div className="text-sm text-gray-700">{faq.question}</div>
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
                            <TypewriterText text={message.content} speed={30} />
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
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-3xl">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
                        <Bot className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="inline-block p-4 rounded-2xl bg-gray-100">
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

            <div className="relative flex items-end border border-gray-300 rounded-xl bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              {/* Left side buttons */}
              <div className="flex items-center space-x-1 pl-3">
                {/* Upload button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isUploading ? (
                    <Upload className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>

                {/* Web Search toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  className={`p-2 ${useWebSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  disabled={isLoading}
                  title={useWebSearch ? 
                    (language === 'zh' ? "已启用网络搜索" : "Web search enabled") : 
                    (language === 'zh' ? "点击启用网络搜索" : "Click to enable web search")
                  }
                >
                  <Globe className="w-4 h-4" />
                </Button>
              </div>

              {/* Text input area */}
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('chat.placeholder')}
                className="flex-1 resize-none border-0 bg-transparent py-3 px-3 min-h-[50px] max-h-32 text-base focus:ring-0 focus:outline-none"
                disabled={isLoading}
              />

              {/* Right side send button */}
              <div className="flex items-center space-x-1 pr-3">
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!newMessage.trim() || isLoading}
                  className={`p-2 h-auto ${
                    newMessage.trim() && !isLoading
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
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
              支持上传文档、图片等文件进行分析
              {useWebSearch && (
                <span className="text-blue-600 font-medium"> • 已启用网络搜索</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}