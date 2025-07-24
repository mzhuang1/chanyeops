import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Database, 
  BarChart3, 
  Settings,
  Loader2,
  Building2,
  Users,
  Target,
  BookOpen,
  Briefcase,
  MapPin,
  PenTool,
  TrendingUp,
  Search,
  Plus,
  Factory,
  Layers,
  Award,
  Clock,
  GraduationCap,
  Calendar,
  Shield,
  DollarSign,
  AlertCircle,
  Building,
  Car,
  Wifi,
  Zap,
  Droplets,
  Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileExtractorWidget } from '@/components/FileExtractorWidget';
// Remove language context for now

function FiveYearPlanningRedesigned() {
  const [analysisQuery, setAnalysisQuery] = useState("根据模板002分析本地文件001，总结市经济社会发展情况，结合网络搜索相关政策及新闻，给出下一步发展建议");
  const [analysisResult, setAnalysisResult] = useState("");
  const [activeSubPage, setActiveSubPage] = useState("planning"); // planning, assessment, research, cluster, training, trusteeship, park
  const [location] = useLocation();
  const { toast } = useToast();

  // Handle URL parameters to set the correct sub-page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subPage = urlParams.get('subPage');
    if (subPage && ['assessment', 'research', 'cluster', 'training', 'trusteeship', 'park'].includes(subPage)) {
      setActiveSubPage(subPage);
    }
  }, [location]);

  // Fetch templates for context
  const templates = useQuery({
    queryKey: ['/api/planning/templates'],
  });

  // Fetch uploaded files for context
  const uploads = useQuery({
    queryKey: ['/api/uploads'],
  });

  // Analysis mutation using test chat API with OpenAI and Perplexity
  const analysisMutation = useMutation({
    mutationFn: async (data: { query: string; templateId?: number; referenceFiles?: number[] }) => {
      const response = await fetch('/api/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: data.query,
          enableWebSearch: true, // Enable Perplexity search by default
          templateId: data.templateId,
          referenceFiles: data.referenceFiles
        }),
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.aiResponse || data.content);
      toast({
        title: "分析完成",
        description: "AI智能分析结果已生成（集成OpenAI + Perplexity搜索）",
      });
    },
    onError: (error) => {
      toast({
        title: "分析失败",
        description: "请检查网络连接或稍后重试",
        variant: "destructive",
      });
    },
  });

  const handleStartAnalysis = () => {
    if (!analysisQuery.trim()) return;
    
    const templateId = templates.data && Array.isArray(templates.data) && templates.data.length > 0 ? templates.data[0]?.id : undefined;
    const referenceFiles = uploads.data && Array.isArray(uploads.data) ? uploads.data.slice(0, 3).map((upload: any) => upload.id) : [];

    analysisMutation.mutate({
      query: analysisQuery,
      templateId,
      referenceFiles
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-lg font-bold text-blue-900 dark:text-blue-100">产业集群智能体</h1>
      </div>
      
      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex space-x-1 p-2 min-w-max">
          {[
            { id: "planning", icon: FileText, label: "五年规划" },
            { id: "assessment", icon: Target, label: "产业测评" },
            { id: "research", icon: BarChart3, label: "产业研究" },
            { id: "cluster", icon: Building2, label: "集群打造" },
            { id: "training", icon: GraduationCap, label: "产业培训" },
            { id: "management", icon: Briefcase, label: "产业托管" },
            { id: "park", icon: MapPin, label: "园区托管" }
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeSubPage === item.id ? "default" : "outline"}
              size="sm"
              className={`min-w-max text-xs ${
                activeSubPage === item.id 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => setActiveSubPage(item.id)}
            >
              <item.icon className="w-3 h-3 mr-1" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* Left Sidebar - Hidden on mobile, drawer on tablet, fixed on desktop */}
        <div className="hidden lg:flex lg:w-48 bg-white dark:bg-gray-800 flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 flex-1">
          <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
            产业集群智能体
          </h2>
          <div className="space-y-2">
            {/* Sub-navigation buttons */}
            <Button
              variant={activeSubPage === "planning" ? "default" : "outline"}
              className={`w-full justify-start font-medium ${
                activeSubPage === "planning" 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
              onClick={() => setActiveSubPage("planning")}
            >
              <FileText className="h-4 w-4 mr-2" />
              五年规划
            </Button>
            <Button
              variant={activeSubPage === "assessment" ? "default" : "outline"}
              className={`w-full justify-start font-medium ${
                activeSubPage === "assessment" 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
              onClick={() => setActiveSubPage("assessment")}
            >
              <Target className="h-4 w-4 mr-2" />
              产业测评
            </Button>
            <Button
              variant={activeSubPage === "research" ? "default" : "outline"}
              className={`w-full justify-start font-medium ${
                activeSubPage === "research" 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
              onClick={() => setActiveSubPage("research")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              产业研究
            </Button>
            <Button
              variant={activeSubPage === "cluster" ? "default" : "outline"}
              className={`w-full justify-start font-medium ${
                activeSubPage === "cluster" 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-black" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
              onClick={() => setActiveSubPage("cluster")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              集群打造
            </Button>
            <Button
              onClick={() => setActiveSubPage("training")}
              variant={activeSubPage === "training" ? "default" : "outline"}
              className={`w-full justify-start ${
                activeSubPage === "training" 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              产业培训
            </Button>
            <Button
              onClick={() => setActiveSubPage("trusteeship")}
              variant={activeSubPage === "trusteeship" ? "default" : "outline"}
              className={`w-full justify-start ${
                activeSubPage === "trusteeship" 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              产业托管
            </Button>
            <Button
              onClick={() => setActiveSubPage("park")}
              variant={activeSubPage === "park" ? "default" : "outline"}
              className={`w-full justify-start ${
                activeSubPage === "park" 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-blue-50 dark:hover:bg-blue-900"
              }`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              园区托管
            </Button>
          </div>
        </div>
        
        {/* Bottom tools section */}
        <div className="p-4 space-y-2 border-t">
          <Button variant="outline" className="w-full justify-start bg-blue-100 dark:bg-blue-900 text-sm">
            <Database className="h-4 w-4 mr-2" />
            本地知识库
          </Button>
          <Button variant="outline" className="w-full justify-start bg-blue-100 dark:bg-blue-900 text-sm">
            <FileText className="h-4 w-4 mr-2" />
            模板库库
          </Button>
          <Button variant="outline" className="w-full justify-start bg-blue-100 dark:bg-blue-900 text-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            第三方数据
          </Button>
          <Button variant="outline" className="w-full justify-start bg-blue-100 dark:bg-blue-900 text-sm">
            <Settings className="h-4 w-4 mr-2" />
            系统管理
          </Button>
        </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation Bar - Only show for planning sub-page on desktop */}
          {activeSubPage === "planning" && (
            <div className="hidden lg:block bg-white dark:bg-gray-800 shadow-md border-b">
              <div className="flex h-16 justify-between">
              <div className="flex">
                <Button
                  variant="default"
                  className="h-full rounded-none bg-blue-600 hover:bg-blue-700 text-white border-r border-blue-500 px-6"
                >
                  规划思路
                </Button>
                <Button
                  variant="outline"
                  className="h-full rounded-none bg-yellow-400 hover:bg-yellow-500 text-black border-r px-6"
                >
                  规划纲要
                </Button>
                <Button
                  variant="outline"
                  className="h-full rounded-none hover:bg-blue-50 border-r px-6"
                >
                  中期评估
                </Button>
                <Button
                  variant="outline"
                  className="h-full rounded-none hover:bg-blue-50 border-r px-6"
                >
                  规划总结
                </Button>
                <Button
                  variant="outline"
                  className="h-full rounded-none bg-yellow-400 hover:bg-yellow-500 text-black px-6"
                >
                  工具箱
                </Button>
              </div>
              
              {/* 五年规划自动撰写 - Top Right Corner */}
              <div className="flex items-center pr-4">
                <Button
                  variant="outline"
                  className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 px-4 py-2 rounded-md shadow-md font-medium"
                  onClick={() => window.open('/cluster', '_blank')}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  五年规划自动撰写
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`flex-1 flex flex-col ${activeSubPage === "planning" ? "lg:flex-row" : ""}`}>
          {/* Center Content */}
          <div className={`${activeSubPage === "planning" ? "flex-1" : "w-full"} p-2 md:p-4 lg:p-6`}>
            {activeSubPage === "planning" && (
              <div className="space-y-4 md:space-y-6">
                {/* Workflow Section 1 */}
                <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-start space-y-2 md:space-y-0 md:space-x-4 mb-3 md:mb-4">
                    <div className="bg-orange-500 text-white px-3 md:px-4 py-2 rounded text-xs md:text-sm font-medium w-fit">
                      创建新项目
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:space-x-2">
                      <div className="bg-blue-600 text-white px-2 md:px-4 py-1 md:py-2 rounded text-xs md:text-sm">
                        资料处理与发展评估
                      </div>
                      <span className="text-gray-400 hidden md:inline">→</span>
                      <div className="bg-gray-500 text-white px-2 md:px-4 py-1 md:py-2 rounded text-xs md:text-sm">
                        总体定位与模型构建
                      </div>
                      <span className="text-gray-400 hidden md:inline">→</span>
                      <div className="bg-blue-600 text-white px-2 md:px-4 py-1 md:py-2 rounded text-xs md:text-sm">
                        思路文本
                      </div>
                    </div>
                  </div>
                  
                  {/* Workflow Section 2 */}
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
                      成果与问题总结
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
                      发展环境
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
                      总体思路
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="bg-gray-400 text-white px-4 py-2 rounded text-sm">
                      主要任务和重大举措
                    </div>
                  </div>
                </div>

                {/* Large Input Area */}
                <div className="bg-white rounded-lg border-2 border-gray-300 p-6 min-h-64">
                  <Textarea
                    value={analysisQuery}
                    onChange={(e) => setAnalysisQuery(e.target.value)}
                    placeholder="输入你的问题..."
                    className="w-full h-48 border-none resize-none text-lg p-0 focus:ring-0 focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (analysisQuery.trim()) {
                          try {
                            // Try FastAPI backend first
                            let response = await fetch('/api/fastapi/chat/generate-chart', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                data_description: analysisQuery,
                                session_id: 'planning-chart',
                                chart_type: 'auto'
                              })
                            });
                            
                            if (!response.ok) {
                              // Fallback to Node.js backend
                              response = await fetch('/api/agent/execute', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userInput: `生成关于以下内容的数据图表：${analysisQuery}`,
                                  sessionId: 'planning-chart'
                                })
                              });
                            }
                            
                            const data = await response.json();
                            if (data.success || data.chart_config) {
                              toast({
                                title: "图表生成完成",
                                description: "智能图表已为您生成",
                              });
                              const chartConfig = data.chart_config || data.result;
                              setAnalysisResult(`**图表配置已生成:**\n\`\`\`json\n${chartConfig}\n\`\`\``);
                            }
                          } catch (error) {
                            toast({
                              title: "图表生成失败",
                              description: "请稍后重试或启动FastAPI后端",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      className="text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      生成图表
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (analysisQuery.trim()) {
                          try {
                            // Try FastAPI backend first
                            let response = await fetch('/api/fastapi/agent/execute', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                user_input: `生成关于以下主题的专业报告：${analysisQuery}`,
                                session_id: 'planning-report'
                              })
                            });
                            
                            if (!response.ok) {
                              // Fallback to Node.js backend
                              response = await fetch('/api/agent/execute', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  userInput: `生成关于以下主题的专业报告：${analysisQuery}`,
                                  sessionId: 'planning-report'
                                })
                              });
                            }
                            
                            const data = await response.json();
                            if (data.success) {
                              toast({
                                title: "报告生成完成",
                                description: "专业分析报告已生成",
                              });
                              if (data.result && data.result.includes('/download/')) {
                                window.open(data.result, '_blank');
                              } else {
                                setAnalysisResult(data.result);
                              }
                            }
                          } catch (error) {
                            toast({
                              title: "报告生成失败",
                              description: "请稍后重试或启动FastAPI后端",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      生成报告
                    </Button>
                    <Button 
                      onClick={handleStartAnalysis}
                      disabled={analysisMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {analysisMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        "AI分析"
                      )}
                    </Button>
                  </div>
                </div>

                {/* AI Control Boxes - Three detailed instruction boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {/* Planning Management Control */}
                  <Card className="p-3 md:p-4 bg-white">
                    <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-xs md:text-sm">资料处理指令库</h3>
                    <Textarea
                      placeholder="1-根据以上景德镇市2020-2024年国民经济和社会发展统计公报，通过数据提取，分析比较景德镇“十四五”期间主要成绩与问题，文字+表格形式呈现，2-全面分析以上文件，立体分析景德镇科技创新发展水平，包括但不限于主要职能部门及单位在十四五期间工作的主要成绩、问题、工作的延续性，景德镇在十五五期间亟需者的科技成果及创新建议。通过结论+结构化表格形式呈现，3-根据以上景德镇市 2020‑2024 年国民经济和社会发展统计公报，通过数据提取，分析比较景德镇“十四五”期间主要成绩与问题，文字+表格形式呈现"
                      className="w-full h-16 md:h-20 text-xs resize-none border-gray-300"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" className="text-xs">查看详情</Button>
                    </div>
                  </Card>

                  {/* Strategic Analysis Control */}
                  <Card className="p-3 md:p-4 bg-white">
                    <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-xs md:text-sm">网络信息指令库</h3>
                    <Textarea
                      placeholder="针对当前实践中存在的问题，例如产品匮乏、市场策略不足等，提出相应的对策建议；此外，还需考虑人工干预、关键业务支持机制以及任务分工的实际操作方案，以推动地方实施的高效落地，围绕国家级平台数据，系统爬取 2020‑2024 年全国同类地级市的公共政策、招商引资与产业促进措施，并形成对比研究报告"
                      className="w-full h-16 md:h-20 text-xs resize-none border-gray-300"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" className="text-xs">查看详情</Button>
                    </div>
                  </Card>

                  {/* Content Processing Control */}
                  <Card className="p-3 md:p-4 bg-white">
                    <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-xs md:text-sm">文本处理智能体</h3>
                    <Textarea
                      placeholder="梳理2020‑2024 年的产业分工结构及产能需求情况，形成各阶段产业分工与经济社会发展的关联分析报告"
                      className="w-full h-16 md:h-20 text-xs resize-none border-gray-300"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" className="text-xs">查看详情</Button>
                    </div>
                  </Card>
                </div>

              </div>
            )}

            {activeSubPage === "assessment" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">产业测评</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">全面评估产业发展水平和竞争优势</p>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                    开始新评估
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">评估项目</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">24</p>
                      </div>
                      <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">已完成</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">18</p>
                      </div>
                      <Building2 className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">平均分数</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">82.5</p>
                      </div>
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 text-sm md:text-lg">★</span>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">本月新增</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">6</p>
                      </div>
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 text-sm md:text-lg font-bold">+</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Assessment Items */}
                <Card className="p-4 md:p-6 bg-white">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">最近评估项目</h2>
                  <div className="space-y-3 md:space-y-4">
                    {[
                      { title: '智能制造产业评估', status: '已完成', score: 85, date: '2025-01-15', type: '综合评估' },
                      { title: '新能源汽车产业链分析', status: '进行中', score: 72, date: '2025-01-10', type: '专项评估' },
                      { title: '生物医药产业竞争力评估', status: '待开始', score: 0, date: '2025-01-20', type: '竞争力分析' }
                    ].map((item, index) => (
                      <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-gray-50 rounded-lg space-y-2 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
                            <h3 className="font-medium text-gray-900 text-sm md:text-base">{item.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                              item.status === '已完成' ? 'bg-green-100 text-green-800' : 
                              item.status === '进行中' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 text-xs md:text-sm text-gray-600">
                            <span>{item.type}</span>
                            <span className="hidden md:inline">•</span>
                            <span>{item.date}</span>
                            {item.score > 0 && (
                              <>
                                <span className="hidden md:inline">•</span>
                                <span>评分: {item.score}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeSubPage === "research" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">产业研究</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">深度分析产业发展趋势和投资机会</p>
                  </div>
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                    <Button variant="outline" className="w-full md:w-auto">
                      <Search className="w-4 h-4 mr-2" />
                      搜索报告
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      新建研究
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">研究报告</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">156</p>
                      </div>
                      <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">本月阅读</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">8.5K</p>
                      </div>
                      <Users className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">覆盖产业</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">28</p>
                      </div>
                      <Building2 className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">增长率</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">+32%</p>
                      </div>
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                    </div>
                  </Card>
                </div>

                {/* Main Content with Tabs */}
                <Tabs defaultValue="reports" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="reports">研究报告</TabsTrigger>
                    <TabsTrigger value="trends">趋势分析</TabsTrigger>
                    <TabsTrigger value="insights">市场洞察</TabsTrigger>
                  </TabsList>

                  <TabsContent value="reports" className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2">
                        <Card className="p-6 bg-white">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">最新报告</h2>
                            <Button variant="ghost" size="sm">查看全部</Button>
                          </div>
                          <div className="space-y-4">
                            {[
                              {
                                title: '2024年新能源汽车产业发展报告',
                                category: '行业报告',
                                status: '已发布',
                                date: '2024-12-15',
                                views: 1250,
                                downloads: 89
                              },
                              {
                                title: '人工智能产业链深度分析',
                                category: '专题研究',
                                status: '审核中',
                                date: '2024-12-20',
                                views: 856,
                                downloads: 45
                              },
                              {
                                title: '生物医药产业投资趋势洞察',
                                category: '投资分析',
                                status: '撰写中',
                                date: '2025-01-05',
                                views: 0,
                                downloads: 0
                              }
                            ].map((report, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-medium text-gray-900">{report.title}</h3>
                                  <Badge variant={
                                    report.status === '已发布' ? 'default' : 
                                    report.status === '审核中' ? 'secondary' : 'outline'
                                  }>
                                    {report.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{report.category}</span>
                                  <span>•</span>
                                  <span>{report.date}</span>
                                  <span>•</span>
                                  <span>{report.views} 浏览</span>
                                  <span>•</span>
                                  <span>{report.downloads} 下载</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>

                      <Card className="p-6 bg-white">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">报告分类</h2>
                        <div className="space-y-3">
                          {[
                            { name: '行业报告', count: 45, color: 'bg-blue-100 text-blue-800' },
                            { name: '专题研究', count: 38, color: 'bg-green-100 text-green-800' },
                            { name: '投资分析', count: 28, color: 'bg-orange-100 text-orange-800' },
                            { name: '政策解读', count: 22, color: 'bg-purple-100 text-purple-800' },
                            { name: '竞争分析', count: 23, color: 'bg-red-100 text-red-800' },
                          ].map((category, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-gray-700">{category.name}</span>
                              <Badge className={category.color}>{category.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="trends" className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="p-6 bg-white">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">产业增长趋势</h2>
                        <div className="space-y-4">
                          {[
                            { industry: '人工智能', growth: '+45%', trend: '上升' },
                            { industry: '新能源', growth: '+38%', trend: '上升' },
                            { industry: '生物医药', growth: '+25%', trend: '稳定' },
                            { industry: '先进制造', growth: '+18%', trend: '稳定' },
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-gray-700">{item.industry}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600 font-medium">{item.growth}</span>
                                <Badge variant="outline">{item.trend}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-6 bg-white">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">热门关键词</h2>
                        <div className="flex flex-wrap gap-2">
                          {[
                            '人工智能', '新能源汽车', '碳中和', '数字化转型', 
                            '生物医药', '先进制造', '绿色发展', '产业链'
                          ].map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-blue-100">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-6">
                    <Card className="p-6 bg-white">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">市场洞察</h2>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-800">投资热点</h3>
                          <div className="space-y-2">
                            {[
                              '新能源产业链完善度提升',
                              '人工智能应用场景拓展',
                              '生物医药创新药研发',
                              '智能制造数字化升级'
                            ].map((insight, index) => (
                              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-700">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-800">风险预警</h3>
                          <div className="space-y-2">
                            {[
                              '传统制造业转型压力',
                              '技术人才短缺问题',
                              '供应链稳定性挑战',
                              '政策变化不确定性'
                            ].map((risk, index) => (
                              <div key={index} className="p-3 bg-orange-50 rounded-lg">
                                <p className="text-sm text-gray-700">{risk}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeSubPage === "cluster" && (
              <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
                {/* Main Content */}
                <div className="flex-1 space-y-4 md:space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900">集群打造</h1>
                      <p className="text-gray-600 mt-1 text-sm md:text-base">构建高效产业集群，促进协同发展</p>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                      创建集群
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    <Card className="p-4 md:p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-gray-600">在建集群</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">12</p>
                        </div>
                        <Factory className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                      </div>
                    </Card>
                    <Card className="p-4 md:p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-gray-600">入驻企业</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">318</p>
                        </div>
                        <Building2 className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                      </div>
                    </Card>
                    <Card className="p-4 md:p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-gray-600">总投资额</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">36.4亿</p>
                        </div>
                        <Target className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                      </div>
                    </Card>
                    <Card className="p-4 md:p-6 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm text-gray-600">就业岗位</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">2.8万</p>
                        </div>
                        <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                      </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Card className="p-4 md:p-6 bg-white">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">产业集群概览</h2>
                      <div className="space-y-4">
                        {[
                          {
                            name: '智能制造产业集群',
                            location: '东工业园区',
                            companies: 156,
                            investment: '重点项目',
                            progress: 85,
                            status: '运营中'
                          },
                          {
                            name: '生物医药产业集群',
                            location: '高新区',
                            companies: 89,
                            investment: '新兴产业',
                            progress: 65,
                            status: '建设中'
                          },
                          {
                            name: '新能源汽车产业集群',
                            location: '南部新区',
                            companies: 73,
                            investment: '战略新兴',
                            progress: 35,
                            status: '规划中'
                          }
                        ].map((cluster, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-gray-900">{cluster.name}</h3>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                  <span>{cluster.location}</span>
                                  <span>•</span>
                                  <span>{cluster.companies} 家企业</span>
                                  <span>•</span>
                                  <span>{cluster.investment}</span>
                                </div>
                              </div>
                              <Badge variant={
                                cluster.status === '运营中' ? 'default' : 
                                cluster.status === '建设中' ? 'secondary' : 'outline'
                              }>
                                {cluster.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">建设进度</span>
                                <span className="text-gray-900">{cluster.progress}%</span>
                              </div>
                              <Progress value={cluster.progress} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 md:p-6 bg-white">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">配套服务</h2>
                    <div className="space-y-3">
                      {[
                        { name: '政策法规', count: 45, color: 'bg-blue-100 text-blue-800' },
                        { name: '融资对接', count: 32, color: 'bg-green-100 text-green-800' },
                        { name: '人才引进', count: 28, color: 'bg-orange-100 text-orange-800' },
                        { name: '技术转移', count: 19, color: 'bg-purple-100 text-purple-800' },
                      ].map((service, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{service.name}</span>
                          <Badge className={service.color}>{service.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Development Stages */}
                <Card className="p-4 md:p-6 bg-white">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">集群建设阶段</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                      {
                        stage: '规划设计',
                        description: '产业规划、空间布局、基础设施',
                        status: 'completed',
                        step: 1
                      },
                      {
                        stage: '基础建设',
                        description: '基础设施、公共配套、服务平台',
                        status: 'active',
                        step: 2
                      },
                      {
                        stage: '招商引资',
                        description: '企业引进、项目落地、产业聚集',
                        status: 'pending',
                        step: 3
                      },
                      {
                        stage: '运营管理',
                        description: '协同创新、品牌建设、可持续发展',
                        status: 'pending',
                        step: 4
                      }
                    ].map((stage, index) => (
                      <div key={index} className="relative">
                        <div className={`p-4 rounded-lg border-2 ${
                          stage.status === 'completed' ? 'border-green-200 bg-green-50' :
                          stage.status === 'active' ? 'border-blue-200 bg-blue-50' :
                          'border-gray-200 bg-gray-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mb-3 ${
                            stage.status === 'completed' ? 'bg-green-500' :
                            stage.status === 'active' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}>
                            {stage.step}
                          </div>
                          <h3 className={`font-medium mb-2 ${
                            stage.status === 'completed' ? 'text-green-800' :
                            stage.status === 'active' ? 'text-blue-800' :
                            'text-gray-800'
                          }`}>
                            {stage.stage}
                          </h3>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Service Categories */}
                <Card className="p-4 md:p-6 bg-white">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">技术服务</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                    {[
                      { name: '产业规划', desc: '综合规划支撑', color: 'bg-blue-500', icon: '📋' },
                      { name: '招商服务', desc: '政策对接服务', color: 'bg-green-500', icon: '🤝' },
                      { name: '运营支撑', desc: '运营管理支撑', color: 'bg-orange-500', icon: '⚙️' },
                      { name: '数字服务', desc: '数字转型服务', color: 'bg-purple-500', icon: '💻' },
                      { name: '协同创新', desc: '创新资源整合', color: 'bg-red-500', icon: '🔬' },
                      { name: '绿色发展', desc: '绿色低碳发展', color: 'bg-teal-500', icon: '🌱' }
                    ].map((service, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-center">
                        <div className="text-3xl mb-2">{service.icon}</div>
                        <h3 className="font-medium text-gray-900 mb-1">{service.name}</h3>
                        <p className="text-xs text-gray-600">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </div>

                {/* Right Sidebar - Same as Planning Page */}
                <div className="w-full lg:w-80 p-4 space-y-4 lg:border-l border-gray-200">
                  {/* Local Resource Library */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      本地资料库
                    </h3>
                    <div className="space-y-2 text-sm">
                      {uploads.data && Array.isArray(uploads.data) && uploads.data.length > 0 ? (
                        uploads.data.slice(0, 2).map((file: any, index: number) => (
                          <div key={file.id || index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-gray-700 text-xs">{index + 1}. {String(file.filename || 'Unknown File')}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              2025/7/7
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">暂无上传文件</p>
                          <p className="text-xs">请上传相关规划模板文件</p>
                        </div>
                      )}
                      
                      {/* Template Files */}
                      {templates.data && Array.isArray(templates.data) && templates.data.length > 0 && (
                        <>
                          <div className="border-t pt-2 mt-3">
                            <p className="text-xs text-gray-500 mb-2">规划模板</p>
                            {templates.data.map((template: any, index: number) => (
                              <div key={template.id || index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-green-500" />
                                  <span className="text-gray-700 text-xs">{String(template.name || 'Unknown Template')}</span>
                                </div>
                                <span className="text-xs text-gray-400">{String(template.type || 'Unknown')}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  <FileExtractorWidget 
                    onExtractionComplete={(result) => {
                      setAnalysisResult(prev => prev + '\n\n**MCP文件提取结果:**\n' + 
                        (typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)));
                      toast({
                        title: "文件提取完成",
                        description: "已将提取结果添加到分析区域",
                      });
                    }}
                    className="w-full"
                  />

                  {/* AI Results */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">智能体价段成果</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-blue-50 rounded flex items-start">
                        <span className="text-blue-600 mr-2">🔵</span>
                        <span className="text-gray-700">基地建教与对照建议（共40字符）发展规划概要建议</span>
                      </div>
                      <div className="p-2 bg-blue-50 rounded flex items-start">
                        <span className="text-blue-600 mr-2">🔵</span>
                        <span className="text-gray-700">基地建教与发展建议15分规顿</span>
                      </div>
                    </div>
                  </Card>

                  {/* Text Framework */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">文本框架（二级目录）</h3>
                    <div className="text-xs space-y-1">
                      <div>一、对发展基础、经验建议建设</div>
                      <div>⚪ 经验公文领导及建议</div>
                      <div>⚪ 发体公文实际发展相对建议</div>
                      <div>⚪ 既有分体经发建设实绩</div>
                      <div>⚪ 实际发展实体经验机实</div>
                      <div>⚪ 体建发对重其实际优结算</div>
                      <div>⚪ 发展发现经验实务及建设</div>
                      <div>⚪ 发展发现实体建议及建设关实</div>
                      <div>⚪ 采收建设建议</div>
                      <div>二、总体建议及发展关建设政策</div>
                      <div>⚪ 发展实体建设实</div>
                      <div>⚪ 采基政策</div>
                      <div>⚪ 既建设建议实体策</div>
                      <div>⚪ 实体实际建设建设建议实施实际实</div>
                      <div>⚪ 体政策实施发展发展相及市场实施政策实际实施实际</div>
                      <div>⚪ 政府政策分析、采及市场实施建议等实际对建设实务实体</div>
                      <div>⚪ 实施建议建设实、采收采实及策略及实施建设实实施建设等</div>
                      <div>⚪ 实体建议分析实务、采及实施及策略实务政策及实施实际建议</div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeSubPage === "training" && (
              <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">产业培训</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">提升产业人才技能，促进创新发展</p>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                    开设新课程
                  </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">培训课程</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">68</p>
                      </div>
                      <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">学员总数</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">4,230</p>
                      </div>
                      <Users className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">完成率</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">89%</p>
                      </div>
                      <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">满意度</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">4.8</p>
                      </div>
                      <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                    </div>
                  </Card>
                </div>

                {/* Course Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Card className="p-4 md:p-6 bg-white">
                      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">热门课程</h2>
                      <div className="space-y-4">
                        {[
                          {
                            title: '数字化转型实战训练营',
                            category: '数字化',
                            instructor: '张教授',
                            students: 156,
                            duration: '8周',
                            status: '进行中',
                            progress: 65
                          },
                          {
                            title: '产业链管理与优化',
                            category: '管理',
                            instructor: '李专家',
                            students: 89,
                            duration: '6周',
                            status: '即将开始',
                            progress: 0
                          },
                          {
                            title: '新能源技术前沿',
                            category: '技术',
                            instructor: '王博士',
                            students: 124,
                            duration: '10周',
                            status: '已完成',
                            progress: 100
                          }
                        ].map((course, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 md:p-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 space-y-2 md:space-y-0">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 text-sm md:text-base">{course.title}</h3>
                                <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-1 text-xs md:text-sm text-gray-600">
                                  <Badge variant="outline">{course.category}</Badge>
                                  <span>{course.instructor}</span>
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {course.students}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {course.duration}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={
                                course.status === '进行中' ? 'default' : 
                                course.status === '即将开始' ? 'secondary' : 'outline'
                              }>
                                {course.status}
                              </Badge>
                            </div>
                            {course.progress > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">课程进度</span>
                                  <span className="text-gray-900">{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} className="h-2" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 md:p-6 bg-white">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">培训效果</h2>
                    <div className="space-y-4">
                      {[
                        { name: '技能提升', value: 85, participants: 1250 },
                        { name: '管理能力', value: 78, participants: 890 },
                        { name: '创新思维', value: 92, participants: 1560 },
                        { name: '领导力', value: 73, participants: 760 }
                      ].map((stat, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-700">{stat.name}</span>
                            <div className="text-right">
                              <div className="text-sm text-gray-900">{stat.value}%</div>
                              <div className="text-xs text-gray-500">{stat.participants}人</div>
                            </div>
                          </div>
                          <Progress value={stat.value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Training Calendar */}
                <Card className="p-4 md:p-6 bg-white">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 md:mb-4 space-y-2 md:space-y-0">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">培训日程</h2>
                    <Button variant="outline" size="sm" className="w-full md:w-auto">
                      <Calendar className="w-4 h-4 mr-2" />
                      查看全部
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
                    {[
                      { date: '1月15日', event: '数字化转型讲座', type: '讲座' },
                      { date: '1月18日', event: '管理技能提升', type: '培训' },
                      { date: '1月22日', event: '创新思维工作坊', type: '工作坊' },
                      { date: '1月25日', event: '行业前沿研讨', type: '研讨会' },
                      { date: '1月28日', event: '技术实操训练', type: '实训' },
                      { date: '2月1日', event: '领导力发展', type: '培训' },
                      { date: '2月5日', event: '项目管理认证', type: '认证' },
                    ].map((item, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="text-sm text-gray-600 mb-1">{item.date}</div>
                        <div className="text-sm text-gray-900 mb-2">{item.event}</div>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Training Categories */}
                <Card className="p-6 bg-white">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">培训类别</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { category: '技术技能', courses: 28, icon: '🔧' },
                      { category: '管理能力', courses: 18, icon: '📊' },
                      { category: '创新思维', courses: 15, icon: '💡' },
                      { category: '领导力', courses: 7, icon: '👑' },
                    ].map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{item.icon}</span>
                          <Badge className="bg-gray-100 text-gray-800">{item.courses}</Badge>
                        </div>
                        <h3 className="font-medium text-gray-900">{item.category}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.courses} 门课程</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeSubPage === "management" && (
              <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">产业托管</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">专业的产业运营托管服务</p>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                    新增托管项目
                  </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">托管项目</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">18</p>
                      </div>
                      <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">合同金额</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">4.2亿</p>
                      </div>
                      <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">服务满意度</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">96%</p>
                      </div>
                      <Star className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">年化收益</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">15.8%</p>
                      </div>
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                    </div>
                  </Card>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Card className="p-4 md:p-6 bg-white">
                      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">托管项目列表</h2>
                      <div className="space-y-4">
                        {[
                          {
                            name: '智能制造产业园托管',
                            location: '经济开发区',
                            contract: '3年',
                            revenue: '1.8亿',
                            status: '运营中',
                            performance: 92
                          },
                          {
                            name: '新材料产业基地托管',
                            location: '高新技术区',
                            contract: '5年',
                            revenue: '1.2亿',
                            status: '运营中',
                            performance: 88
                          },
                          {
                            name: '生物医药园区托管',
                            location: '科技园区',
                            contract: '2年',
                            revenue: '0.9亿',
                            status: '筹备中',
                            performance: 0
                          }
                        ].map((project, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 space-y-2 md:space-y-0">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">{project.name}</h3>
                                <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-1 text-sm text-gray-600">
                                  <span>{project.location}</span>
                                  <span>•</span>
                                  <span>合同期: {project.contract}</span>
                                  <span>•</span>
                                  <span>年收益: {project.revenue}</span>
                                </div>
                              </div>
                              <Badge variant={
                                project.status === '运营中' ? 'default' : 
                                project.status === '筹备中' ? 'secondary' : 'outline'
                              }>
                                {project.status}
                              </Badge>
                            </div>
                            {project.performance > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">绩效指标</span>
                                  <span className="text-gray-900">{project.performance}%</span>
                                </div>
                                <Progress value={project.performance} className="h-2" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 md:p-6 bg-white">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">服务类别</h2>
                    <div className="space-y-3">
                      {[
                        { name: '运营管理', projects: 12, color: 'bg-blue-100 text-blue-800' },
                        { name: '招商引资', projects: 8, color: 'bg-green-100 text-green-800' },
                        { name: '政策申报', projects: 6, color: 'bg-orange-100 text-orange-800' },
                        { name: '品牌建设', projects: 4, color: 'bg-purple-100 text-purple-800' },
                        { name: '数字化转型', projects: 5, color: 'bg-red-100 text-red-800' },
                      ].map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{category.name}</span>
                          <Badge className={category.color}>{category.projects}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeSubPage === "trusteeship" && (
              <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">产业托管</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">专业的产业运营托管服务</p>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                    新增托管项目
                  </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">托管项目</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">18</p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">合同金额</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">4.2亿</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">管理面积</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">850万㎡</p>
                      </div>
                      <Building2 className="w-8 h-8 text-orange-500" />
                    </div>
                  </Card>
                  <Card className="p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">服务企业</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">1,240</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-500" />
                    </div>
                  </Card>
                </div>

                {/* Project Overview */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <Card className="p-6 bg-white">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">托管项目</h2>
                      <div className="space-y-4">
                        {[
                          {
                            name: '智能制造产业园运营托管',
                            client: '张江科技集团',
                            value: '2,500万/年',
                            duration: '3年',
                            status: '运营中',
                            performance: 92,
                            startDate: '2023-06-01'
                          },
                          {
                            name: '生物医药产业链管理',
                            client: '浦东投资公司',
                            value: '1,800万/年',
                            duration: '5年',
                            status: '筹备中',
                            performance: 0,
                            startDate: '2025-03-01'
                          },
                          {
                            name: '新能源汽车产业基地',
                            client: '临港集团',
                            value: '3,200万/年',
                            duration: '2年',
                            status: '协商中',
                            performance: 0,
                            startDate: '2025-07-01'
                          }
                        ].map((project, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-gray-900">{project.name}</h3>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                  <span>{project.client}</span>
                                  <span>合同额: {project.value}</span>
                                  <span>期限: {project.duration}</span>
                                  <span>开始: {project.startDate}</span>
                                </div>
                              </div>
                              <Badge variant={
                                project.status === '运营中' ? 'default' : 
                                project.status === '筹备中' ? 'secondary' : 'outline'
                              }>
                                {project.status}
                              </Badge>
                            </div>
                            {project.performance > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">绩效评分</span>
                                  <span className="text-gray-900">{project.performance}分</span>
                                </div>
                                <Progress value={project.performance} className="h-2" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">服务质量</h2>
                    <div className="space-y-4">
                      {[
                        { name: '战略规划', satisfaction: 95, projects: 12 },
                        { name: '运营管理', satisfaction: 88, projects: 18 },
                        { name: '招商引资', satisfaction: 92, projects: 15 },
                        { name: '政策申报', satisfaction: 85, projects: 22 },
                      ].map((service, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-700">{service.name}</span>
                            <div className="text-right">
                              <div className="text-sm text-gray-900">{service.satisfaction}%</div>
                              <div className="text-xs text-gray-500">{service.projects}个项目</div>
                            </div>
                          </div>
                          <Progress value={service.satisfaction} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* KPI Dashboard */}
                <Card className="p-6 bg-white">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">关键绩效指标</h2>
                  <div className="grid grid-cols-4 gap-6">
                    {[
                      { metric: '客户满意度', value: 91, target: 90, status: 'success' },
                      { metric: '项目按时交付率', value: 87, target: 85, status: 'success' },
                      { metric: '成本控制率', value: 94, target: 95, status: 'warning' },
                      { metric: '续约率', value: 89, target: 80, status: 'success' },
                    ].map((kpi, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                          kpi.status === 'success' ? 'bg-green-100' : 
                          kpi.status === 'warning' ? 'bg-orange-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-2xl font-bold ${
                            kpi.status === 'success' ? 'text-green-600' : 
                            kpi.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {kpi.value}%
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{kpi.metric}</h3>
                        <p className="text-sm text-gray-600">目标: {kpi.target}%</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Service Portfolio */}
                <Card className="p-6 bg-white">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">托管服务范围</h2>
                  <div className="grid grid-cols-6 gap-4">
                    {[
                      { title: '战略规划', desc: '产业发展战略制定', icon: '🎯' },
                      { title: '运营管理', desc: '日常运营管理服务', icon: '⚙️' },
                      { title: '招商引资', desc: '项目招商与投资', icon: '💼' },
                      { title: '政策申报', desc: '政策申请与申报', icon: '📋' },
                      { title: '绩效评估', desc: '运营绩效监控', icon: '📊' },
                      { title: '风险管控', desc: '风险识别与控制', icon: '🛡️' },
                    ].map((service, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="text-2xl mb-3">{service.icon}</div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{service.title}</h3>
                        <p className="text-xs text-gray-600">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Risk Alerts */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">风险预警</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-medium text-orange-800 mb-2">中风险项目</h3>
                      <p className="text-sm text-orange-700">智能制造园区Q4绩效指标略低于预期，需要重点关注运营效率提升</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">合同续约提醒</h3>
                      <p className="text-sm text-yellow-700">2个托管项目合同将在3个月内到期，建议提前启动续约谈判</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeSubPage === "park" && (
              <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">园区托管</h1>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">专业的园区运营管理服务</p>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
                    添加新园区
                  </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">托管园区</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">8</p>
                      </div>
                      <Building className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">总面积</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">286万㎡</p>
                      </div>
                      <MapPin className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">入驻企业</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">1,450</p>
                      </div>
                      <Users className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                    </div>
                  </Card>
                  <Card className="p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">平均入驻率</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">88%</p>
                      </div>
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                    </div>
                  </Card>
                </div>

                {/* Park Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Card className="p-4 md:p-6 bg-white">
                      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">园区概览</h2>
                      <div className="space-y-4">
                        {[
                          {
                            name: '张江人工智能产业园',
                            location: '浦东新区张江镇',
                            area: '28.5万㎡',
                            companies: 156,
                            occupancy: 92,
                            revenue: '2.8亿',
                            status: '运营中'
                          },
                          {
                            name: '临港新能源汽车园区',
                            location: '临港新片区',
                            area: '45.2万㎡',
                            companies: 89,
                            occupancy: 78,
                            revenue: '1.9亿',
                            status: '运营中'
                          },
                          {
                            name: '浦西生物医药科技园',
                            location: '闵行区',
                            area: '32.8万㎡',
                            companies: 124,
                            occupancy: 85,
                            revenue: '2.3亿',
                            status: '筹建中'
                          }
                        ].map((park, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-medium text-gray-900">{park.name}</h3>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {park.location}
                                  </div>
                                  <span>面积: {park.area}</span>
                                  <span>{park.companies} 家企业</span>
                                  <span>营收: {park.revenue}</span>
                                </div>
                              </div>
                              <Badge variant={park.status === '运营中' ? 'default' : 'secondary'}>
                                {park.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">入驻率</span>
                                <span className="text-gray-900">{park.occupancy}%</span>
                              </div>
                              <Progress value={park.occupancy} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">基础设施状态</h2>
                    <div className="space-y-4">
                      {[
                        { name: '电力供应', status: 98, unit: '%', icon: Zap, color: 'text-yellow-500' },
                        { name: '网络通信', status: 99, unit: '%', icon: Wifi, color: 'text-blue-500' },
                        { name: '给排水', status: 96, unit: '%', icon: Droplets, color: 'text-cyan-500' },
                        { name: '交通运输', status: 94, unit: '%', icon: Car, color: 'text-green-500' },
                      ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon className={`w-5 h-5 ${item.color}`} />
                              <span className="text-gray-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-900">{item.status}{item.unit}</div>
                              <div className="w-16">
                                <Progress value={item.status} className="h-1" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Monthly Performance */}
                <Card className="p-6 bg-white">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">月度运营数据</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-gray-600">月份</th>
                          <th className="text-left py-2 text-gray-600">营收 (万元)</th>
                          <th className="text-left py-2 text-gray-600">入驻率 (%)</th>
                          <th className="text-left py-2 text-gray-600">新增企业</th>
                          <th className="text-left py-2 text-gray-600">趋势</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { month: '1月', revenue: 2800, occupancy: 92, newCompanies: 8 },
                          { month: '2月', revenue: 2950, occupancy: 94, newCompanies: 12 },
                          { month: '3月', revenue: 3100, occupancy: 95, newCompanies: 15 },
                          { month: '4月', revenue: 3250, occupancy: 96, newCompanies: 10 },
                        ].map((data, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 text-gray-900">{data.month}</td>
                            <td className="py-3 text-gray-900">{data.revenue}</td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-900">{data.occupancy}</span>
                                <div className="w-20">
                                  <Progress value={data.occupancy} className="h-1" />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-gray-900">{data.newCompanies}</td>
                            <td className="py-3">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Services */}
                <Card className="p-4 md:p-6 bg-white">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">园区服务</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                    {[
                      { title: '物业管理', desc: '日常物业维护', icon: '🏢' },
                      { title: '安全保卫', desc: '24小时安保服务', icon: '🛡️' },
                      { title: '环境维护', desc: '绿化清洁服务', icon: '🌱' },
                      { title: '招商服务', desc: '企业入驻服务', icon: '🤝' },
                      { title: '政务服务', desc: '行政审批代办', icon: '📋' },
                      { title: '配套服务', desc: '餐饮住宿等', icon: '🍽️' },
                    ].map((service, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="text-2xl mb-3">{service.icon}</div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{service.title}</h3>
                        <p className="text-xs text-gray-600">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Enterprise Categories */}
                <Card className="p-4 md:p-6 bg-white">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">企业类型分布</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                    {[
                      { category: '科技创新', count: 456, percentage: 35, color: 'bg-blue-100 text-blue-800' },
                      { category: '先进制造', count: 325, percentage: 25, color: 'bg-green-100 text-green-800' },
                      { category: '现代服务', count: 298, percentage: 23, color: 'bg-orange-100 text-orange-800' },
                      { category: '其他行业', count: 221, percentage: 17, color: 'bg-purple-100 text-purple-800' },
                    ].map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="mb-2 md:mb-3">
                          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{item.count}</div>
                          <div className="text-xs md:text-sm text-gray-600">{item.category}</div>
                        </div>
                        <div className="space-y-2">
                          <Badge className={item.color}>{item.percentage}%</Badge>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar - Only show for planning page */}
          {activeSubPage === "planning" && (
            <div className="w-full lg:w-80 p-3 md:p-4 space-y-3 md:space-y-4 border-t lg:border-t-0 lg:border-l border-gray-200 mt-4 lg:mt-0">
              {/* Local Resource Library */}
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 flex items-center text-sm md:text-base">
                  <Database className="h-4 w-4 mr-2" />
                  本地资料库
                </h3>
                <div className="space-y-2 text-sm">
                  {uploads.data && Array.isArray(uploads.data) && uploads.data.length > 0 ? (
                    uploads.data.slice(0, 2).map((file: any, index: number) => (
                      <div key={file.id || index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-gray-700 text-xs">{index + 1}. {String(file.filename || 'Unknown File')}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          2025/7/7
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">暂无上传文件</p>
                      <p className="text-xs">请上传相关规划模板文件</p>
                    </div>
                  )}
                  
                  {/* Template Files */}
                  {templates.data && Array.isArray(templates.data) && templates.data.length > 0 && (
                    <>
                      <div className="border-t pt-2 mt-3">
                        <p className="text-xs text-gray-500 mb-2">规划模板</p>
                        {templates.data.map((template: any, index: number) => (
                          <div key={template.id || index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-green-500" />
                              <span className="text-gray-700 text-xs">{String(template.name || 'Unknown Template')}</span>
                            </div>
                            <span className="text-xs text-gray-400">{String(template.type || 'Unknown')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* AI Results */}
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">智能体价段成果</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-blue-50 rounded flex items-start">
                    <span className="text-blue-600 mr-2">🔵</span>
                    <span className="text-gray-700 text-xs md:text-sm">基地建教与对照建议（共40字符）发展规划概要建议</span>
                  </div>
                  <div className="p-2 bg-blue-50 rounded flex items-start">
                    <span className="text-blue-600 mr-2">🔵</span>
                    <span className="text-gray-700 text-xs md:text-sm">基地建教与发展建议15分规顿</span>
                  </div>
                </div>
              </Card>

              {/* Text Framework */}
              <Card className="p-3 md:p-4">
                <h3 className="font-semibold text-gray-900 mb-2 md:mb-3 text-sm md:text-base">文本框架（二级目录）</h3>
                <div className="text-xs space-y-1">
                  <div>一、对发展基础、经验建议建设</div>
                  <div>⚪ 经验公文领导及建议</div>
                  <div>⚪ 发体公文实际发展相对建议</div>
                  <div>⚪ 既有分体经发建设实绩</div>
                  <div>⚪ 实际发展实体经验机实</div>
                  <div>⚪ 体建发对重其实际优结算</div>
                  <div>⚪ 发展发现经验实务及建设</div>
                  <div>⚪ 发展发现实体建议及建设关实</div>
                  <div>⚪ 采收建设建议</div>
                  <div>二、总体建议及发展关建设政策</div>
                  <div>⚪ 发展实体建设实</div>
                  <div>⚪ 采基政策</div>
                  <div>⚪ 既建设建议实体策</div>
                  <div>⚪ 实体实际建设建设建议实施实际实</div>
                  <div>⚪ 体政策实施发展发展相及市场实施政策实际实施实际</div>
                  <div>⚪ 政府政策分析、采及市场实施建议等实际对建设实务实体</div>
                  <div>⚪ 实施建议建设实、采收采实及策略及实施建设实实施建设等</div>
                  <div>⚪ 实体建议分析实务、采及实施及策略实务政策及实施实际建议</div>
                </div>
              </Card>
            </div>
          )}

        </div>
        </div>
      </div>
    </div>
  );
}

export default FiveYearPlanningRedesigned;