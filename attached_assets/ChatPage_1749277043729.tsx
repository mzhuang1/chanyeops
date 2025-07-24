import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MessageHistory } from '../MessageHistory';
import { ChatInput } from '../ChatInput';
import { ApiService } from '../../services/ApiService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { toast } from "sonner@2.0.3";
import { ReportTemplate } from '../../services/TemplateService';
import { ReportGenerator } from '../ReportGenerator';
import { VisualizationDashboard } from '../VisualizationDashboard';
import { intelligentResponseService } from '../../services/IntelligentResponseService';
import { Maximize2, Minimize2, FileText, MessageSquare, PanelLeft, PanelRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  pending?: boolean;
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [visualMode, setVisualMode] = useState<'split' | 'chat' | 'visual'>('split');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('conversation');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [suggestionType, setSuggestionType] = useState('all');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 检查是否有从模板页面传来的模板
  useEffect(() => {
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate);
      
      // 如果指示应该开始报告，打开模板对话框
      if (location.state?.startReport) {
        setShowTemplateDialog(true);
      }
      
      // 清除location state防止刷新后再次触发
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 示例建议问题
  const suggestions = {
    all: [
      "分析长三角地区电子信息产业集群的创新能力",
      "评估珠三角地区先进制造业产业集群的国际竞争力",
      "比较京津冀和长三角地区汽车产业集群的发展潜力",
      "研究成都生物医药产业集群的产业链韧性",
      "分析西安航空航天产业集群的人才结构"
    ],
    analysis: [
      "分析长三角地区电子信息产业集群的创新能力",
      "评估武汉光电子产业集群的技术创新水平",
      "研究深圳人工智能产业集群的核心竞争力",
      "对比北京和上海金融科技产业集群的发展现状"
    ],
    prediction: [
      "预测未来5年成都生物医药产业集群的发展趋势",
      "评估大连装备制造业产业集群的未来增长潜力",
      "分析重庆汽车产业集群在新能源转型中的机遇与挑战",
      "预测西安半导体产业集群的市场前景"
    ],
    comparison: [
      "比较京津冀和长三角地区汽车产业集群的发展潜力",
      "对比珠三角和长江中游城市群电子信息产业集群的竞争力",
      "分析中国与德国工业4.0产业集群的差距",
      "比较国内外医疗器械产业集群的创新生态"
    ]
  };

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 初始化消息
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        content: '欢迎使用产业集群发展潜力评估系统。您可以询问关于产业集群分析、评估和预测的问题，也可以使用模板生成完整的评估报告。',
        timestamp: new Date()
      }
    ]);
  }, []);

  // 切换显示模式
  const toggleVisualMode = (mode: 'split' | 'chat' | 'visual') => {
    setVisualMode(mode);
  };

  // 发送消息 - 修正函数签名以匹配ChatInput组件的期望
  const handleSendMessage = async (inputValue: string, attachments?: File[]) => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // 添加待处理的助手消息
    const pendingAssistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      pending: true
    };

    setMessages(prev => [...prev, userMessage, pendingAssistantMessage]);
    setIsLoading(true);

    try {
      // 调用实际的API服务或模拟响应
      let response: string;
      
      try {
        // 尝试调用真实API
        response = await ApiService.sendChatMessage(inputValue, selectedModel);
      } catch (error) {
        console.warn('API调用失败，使用模拟响应:', error);
        
        // 如果API失败，使用智能模拟响应
        response = await new Promise<string>(resolve => {
          setTimeout(() => {
            // 使用智能响应服务生成更贴合问题的回答
            const intelligentResponse = intelligentResponseService.generateContextualResponse(inputValue);
            resolve(intelligentResponse);
          }, 2000);
        });
      }

      // 更新助手消息
      setMessages(prev => prev.map(msg => 
        msg.id === pendingAssistantMessage.id 
          ? { ...msg, content: response, pending: false } 
          : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('消息发送失败，请重试');
      
      // 移除待处理的助手消息
      setMessages(prev => prev.filter(msg => msg.id !== pendingAssistantMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // 使用建议问题
  const useSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // 处理主题切换
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 处理从模板生成报告
  const handleUseTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDialog(true);
  };

  // 导航到模板页面
  const navigateToTemplates = () => {
    navigate('/templates');
  };

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-medium">智能对话分析</h1>
          <p className="text-muted-foreground">通过AI对话进行产业集群分析和报告生成</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="mr-2 hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="dark-mode" className="text-sm">深色模式</Label>
              <Switch 
                id="dark-mode" 
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>
            
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (推荐)</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude-3">Claude 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex bg-muted rounded-md p-1">
            <Button
              variant={visualMode === 'split' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleVisualMode('split')}
              className="px-2"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={visualMode === 'chat' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleVisualMode('chat')}
              className="px-2"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant={visualMode === 'visual' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleVisualMode('visual')}
              className="px-2"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden rounded-lg border">
        {/* 侧边栏 */}
        {(visualMode === 'split' || visualMode === 'visual') && (
          <div className={`bg-muted/30 border-r ${visualMode === 'split' ? 'w-64' : 'flex-1'}`}>
            <Tabs defaultValue="template" className="h-full flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="template" className="flex-1">模板</TabsTrigger>
                  <TabsTrigger value="visualize" className="flex-1">可视化</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="template" className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <h3 className="font-medium">推荐模板</h3>
                  
                  <div className="grid gap-3">
                    {/* 模板卡片 */}
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleUseTemplate({
                      id: "template-001",
                      name: "产业集群综合评估报告",
                      description: "全面评估产业集群的发展现状、创新能力、人才结构、产业链完整性和未来发展潜力",
                      category: "综合评估",
                      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                      isOfficial: true,
                      createdAt: "2025-03-15T09:00:00Z",
                      usageCount: 382,
                      suitableScenarios: ["政府决策", "园区规划", "投资分析"],
                      estimatedPages: 35,
                      sections: []
                    })}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">产业集群综合评估报告</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              全面评估产业集群的发展现状和未来潜力
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-muted/50" onClick={() => handleUseTemplate({
                      id: "template-003",
                      name: "产业集群创新生态报告",
                      description: "专注于产业集群的创新网络、知识流动和创新主体互动分析",
                      category: "专项分析",
                      thumbnailUrl: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                      isOfficial: true,
                      createdAt: "2025-05-10T11:15:00Z",
                      usageCount: 98,
                      suitableScenarios: ["创新政策制定", "创新环境优化", "科技园区规划"],
                      estimatedPages: 25,
                      sections: []
                    })}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">产业集群创新生态报告</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              专注于产业集群的创新网络和知识流动分析
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Button variant="outline" className="w-full" onClick={navigateToTemplates}>
                      查看所有模板
                    </Button>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="font-medium mb-3">快速提示</h3>
                    <div className="space-y-2">
                      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                        <Button 
                          variant={suggestionType === 'all' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setSuggestionType('all')}
                        >
                          全部
                        </Button>
                        <Button 
                          variant={suggestionType === 'analysis' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setSuggestionType('analysis')}
                        >
                          分析
                        </Button>
                        <Button 
                          variant={suggestionType === 'prediction' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setSuggestionType('prediction')}
                        >
                          预测
                        </Button>
                        <Button 
                          variant={suggestionType === 'comparison' ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setSuggestionType('comparison')}
                        >
                          对比
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {suggestions[suggestionType as keyof typeof suggestions].map((suggestion, index) => (
                          <div 
                            key={index}
                            className="p-3 text-sm border rounded-md cursor-pointer hover:bg-muted/50"
                            onClick={() => useSuggestion(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="visualize" className="flex-1 p-4 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">数据可视化</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/', { state: { tab: 'visualization' } })}
                    >
                      查看完整面板
                    </Button>
                  </div>
                  
                  {/* 快速可视化示例 */}
                  <div className="grid gap-4">
                    {/* 简化的热力图 */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium mb-3">竞争力评估</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: "技术创新", value: 92 },
                            { name: "人才集聚", value: 87 },
                            { name: "资本支持", value: 84 },
                            { name: "政策环境", value: 89 }
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="aspect-square flex flex-col items-center justify-center p-2 rounded-md text-xs"
                              style={{ 
                                backgroundColor: `rgba(30, 136, 229, ${0.1 + (item.value / 100) * 0.9})`,
                                color: item.value > 60 ? 'white' : 'black'
                              }}
                            >
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm font-bold">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* 发展趋势简图 */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium mb-3">发展趋势</h4>
                        <div className="h-16 flex items-end justify-between gap-1">
                          {[65, 58, 72, 78, 84, 89].map((value, index) => (
                            <div
                              key={index}
                              className="bg-primary/80 rounded-sm flex-1"
                              style={{ height: `${(value / 100) * 100}%` }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>2019</span>
                          <span>2024</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* 快速统计 */}
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-medium mb-3">关键指标</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">综合评分</span>
                            <span className="text-sm font-medium">89</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">创新指数</span>
                            <span className="text-sm font-medium">92</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">发展潜力</span>
                            <span className="text-sm font-medium">85</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* 聊天内容 */}
        {(visualMode === 'split' || visualMode === 'chat') && (
          <div className={`flex flex-col ${visualMode === 'split' ? 'flex-1' : 'flex-1'}`}>
            <div className="flex-1 overflow-y-auto p-4">
              <MessageHistory messages={messages} />
              <div ref={messagesEndRef} />
            </div>
            
            <div className="border-t p-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
                placeholder="输入您的问题或分析需求..."
              />
              <div className="mt-2 text-xs text-center text-muted-foreground">
                提示: 您可以询问关于产业集群的分析、对比或预测问题
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 模板生成对话框 */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>基于模板生成报告</DialogTitle>
            <DialogDescription>
              配置报告参数并生成完整的产业集群评估报告
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <ReportGenerator 
              template={selectedTemplate}
              onBack={() => setShowTemplateDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};