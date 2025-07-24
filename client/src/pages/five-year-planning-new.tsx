import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Users, 
  Building, 
  Target, 
  FileText, 
  Database, 
  BarChart3, 
  Search,
  Settings,
  ChevronRight,
  Loader2
} from "lucide-react";

function FiveYearPlanningPage() {
  const { language } = useLanguage();
  const [activeModule, setActiveModule] = useState("industrial");
  const [analysisQuery, setAnalysisQuery] = useState("根据模板002分析本地文件001，总结市经济社会发展情况，结合网络搜索相关政策及新闻，给出下一步发展建议");
  const [analysisResult, setAnalysisResult] = useState("");
  const { toast } = useToast();

  // Fetch templates for context
  const { data: templates } = useQuery({
    queryKey: ['/api/planning/templates'],
    queryFn: async () => {
      const response = await fetch('/api/planning/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Fetch uploaded files for reference
  const { data: uploads } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: async () => {
      const response = await fetch('/api/uploads', {
        headers: {
          'x-demo-user-id': 'guest_demo'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch uploads');
      return response.json();
    }
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (queryData: { query: string; templateId?: number; referenceFiles?: number[] }) => {
      const response = await fetch('/api/planning/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': 'guest_demo'
        },
        body: JSON.stringify(queryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.content);
      toast({
        title: "分析完成",
        description: "五年规划分析已成功生成"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "分析失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStartAnalysis = () => {
    if (!analysisQuery.trim()) {
      toast({
        title: "请输入问题",
        description: "请先输入您的分析问题",
        variant: "destructive"
      });
      return;
    }

    // Use first available template and recent uploads as context
    const templateId = templates?.[0]?.id;
    const referenceFiles = uploads?.slice(0, 3).map((upload: any) => upload.id) || [];

    analysisMutation.mutate({
      query: analysisQuery,
      templateId,
      referenceFiles
    });
  };

  // 顶部标签模块
  const topModules = [
    {
      id: "industrial",
      title: "规划思路",
      color: "bg-blue-500 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-500"
    },
    {
      id: "social", 
      title: "规划纲要",
      color: "bg-yellow-400 dark:bg-yellow-500 text-black border-yellow-500 dark:border-yellow-400"
    },
    {
      id: "urban",
      title: "中期评估", 
      color: "bg-yellow-400 dark:bg-yellow-500 text-black border-yellow-500 dark:border-yellow-400"
    },
    {
      id: "positioning",
      title: "规划总结",
      color: "bg-yellow-400 dark:bg-yellow-500 text-black border-yellow-500 dark:border-yellow-400"
    },
    {
      id: "toolbox",
      title: "工具箱",
      color: "bg-yellow-400 dark:bg-yellow-500 text-black border-yellow-500 dark:border-yellow-400"
    }
  ];

  // 左侧业务模块
  const leftModules = [
    {
      id: "five-year",
      title: "五年规划",
      active: true
    },
    {
      id: "assessment",
      title: "产业测评",
      active: false
    },
    {
      id: "research", 
      title: "产业研究",
      active: false
    },
    {
      id: "cluster",
      title: "集群打造",
      active: false
    },
    {
      id: "training",
      title: "产业培训", 
      active: false
    },
    {
      id: "industry-mgmt",
      title: "产业托管",
      active: false
    },
    {
      id: "park-mgmt",
      title: "园区托管",
      active: false
    }
  ];

  // 分析步骤
  const analysisSteps = [
    "资料处理与发展评估",
    "总体定位与模型构建",
    "文本撰写",
    "成绩与问题总结",
    "指导思想与发展目标",
    "经济发展",
    "社会发展"
  ];

  const sampleInstructions = [
    "根据模版002分析本地文件001",
    "根据文件008、009，总结***市经济社会发展情况",
    "对上述分析，结合模版004结构优化",
    "结合以上分析结论，在网络上搜索相关政策及新闻",
    "结合上一步分析内容，给出下一步发展建议"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Sidebar - Business Modules */}
        <div className="w-full lg:w-48 bg-white dark:bg-gray-800 border-b lg:border-r lg:border-b-0 border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                主营业务
              </span>
            </div>
          </div>
          
          <div className="flex-1 p-2 lg:p-4">
            {/* Mobile: Horizontal scrollable layout */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide touch-scroll">
              {leftModules.map((module) => (
                <Button
                  key={module.id}
                  variant={module.active ? "default" : "outline"}
                  className={`whitespace-nowrap text-xs ${
                    module.active 
                      ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-500' 
                      : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600'
                  }`}
                  size="sm"
                >
                  {module.title}
                </Button>
              ))}
            </div>
            
            {/* Desktop: Vertical layout */}
            <div className="hidden lg:block space-y-2">
              {leftModules.map((module) => (
                <Button
                  key={module.id}
                  variant={module.active ? "default" : "outline"}
                  className={`w-full justify-start text-sm ${
                    module.active 
                      ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-500' 
                      : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600'
                  }`}
                  size="sm"
                >
                  {module.title}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 lg:p-4">
            <div className="flex gap-1 lg:gap-2 overflow-x-auto scrollbar-hide touch-scroll">
              {topModules.map((module) => (
                <Button
                  key={module.id}
                  variant="outline"
                  className={`px-3 lg:px-6 py-2 text-xs lg:text-sm font-medium border whitespace-nowrap ${module.color}`}
                  onClick={() => setActiveModule(module.id)}
                >
                  {module.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Main Work Area */}
            <div className="flex-1 p-3 lg:p-6">
              <div className="mb-6">
                {/* Analysis Steps */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4 mb-4">
                    {analysisSteps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                          {step}
                        </div>
                        {index < analysisSteps.length - 1 && (
                          <ChevronRight className="h-4 w-4 text-blue-400 mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm inline-block">
                    </div>
                  </div>
                </div>
                {/* Input Area */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-2 border-dashed border-blue-300 dark:border-blue-700">
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4">
                        输入你的问题...
                      </h3>
                      
                      <div className="mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          <strong>指令选择：</strong>
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                          {sampleInstructions.join('；')}
                        </p>
                      </div>

                      <Textarea
                        placeholder="输入你的问题..."
                        value={analysisQuery}
                        onChange={(e) => setAnalysisQuery(e.target.value)}
                        className="min-h-[100px] bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600"
                      />
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        为了让智能体更懂你，请对您满意的回答点赞
                      </p>
                      <Button 
                        className="px-8 bg-blue-500 hover:bg-blue-600 text-white" 
                        onClick={handleStartAnalysis}
                        disabled={analysisMutation.isPending}
                      >
                        {analysisMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        {analysisMutation.isPending ? "分析中..." : "开始分析"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Sidebar - Tools */}
            <div className="w-full lg:w-80 bg-white dark:bg-gray-800 border-t lg:border-l lg:border-t-0 border-gray-200 dark:border-gray-700 p-3 lg:p-4">
              <div className="space-y-6">
                {/* Local Resource Database */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      本地资料库
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        资料库内容
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Template Library */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      模板库
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-yellow-50 dark:bg-yellow-900/20 rounded border-2 border-dashed border-yellow-300 dark:border-yellow-600 flex items-center justify-center">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        模板库内容
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      分析结果/记录
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult ? (
                      <div className="max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 p-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {analysisResult.split('\n').map((line, index) => (
                            <p key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : analysisMutation.isPending ? (
                      <div className="h-32 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            正在分析中...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          点击"开始分析"查看结果
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Page Instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  页面说明：
                </h4>
                <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <p>1. 业务流程决定页面逻辑，本页面是五年规划中第一个业务模块产业经济页面</p>
                  <p>2. 蓝色内容为产业经济业务流程</p>
                  <p>3. 本地资料库和模板库指令选择和分析记录页面内容与产业经济业务板块对应</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FiveYearPlanningPage;