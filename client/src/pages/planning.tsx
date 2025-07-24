import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Download, 
  Plus, 
  Settings, 
  Globe, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Search,
  Upload
} from "lucide-react";

interface PlanningTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  sections: PlanningSection[];
}

interface PlanningSection {
  title: string;
  subsections: string[];
  requirements: string;
  minWords: number;
}

interface PlanningProject {
  id: number;
  title: string;
  region: string;
  planType: string;
  templateId: number;
  status: string;
  enableWebSearch: boolean;
  referenceFiles: string[];
  localFilePath?: string;
  generatedContent?: string;
  sections?: any[];
  metadata?: any;
  progress: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    region: "",
    planType: "十四五",
    templateId: "",
    enableWebSearch: true,
    referenceFiles: [] as string[],
    localFilePath: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取规划模板 - 添加缓存配置
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/planning/templates"],
    queryFn: async () => {
      const response = await fetch("/api/planning/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    gcTime: 10 * 60 * 1000, // 缓存10分钟
  });

  // 获取规划项目 - 优化请求头处理
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ["/api/planning/projects"],
    queryFn: async () => {
      const headers: any = { 'x-demo-user-id': 'demo-user-123' };

      const response = await fetch("/api/planning/projects", {
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    staleTime: 30 * 1000, // 30秒内不重新请求
    gcTime: 2 * 60 * 1000, // 缓存2分钟
  });

  // 创建新项目
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const headers: any = { 'Content-Type': 'application/json' };
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }

      const response = await fetch("/api/planning/projects", {
        method: "POST",
        headers,
        body: JSON.stringify(projectData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "项目创建成功",
        description: "五年规划项目已创建，可以开始生成内容了"
      });
      setIsCreateDialogOpen(false);
      setNewProject({
        title: "",
        region: "",
        planType: "十四五",
        templateId: "",
        enableWebSearch: true,
        referenceFiles: [],
        localFilePath: ""
      });
      refetchProjects();
    },
    onError: (error) => {
      toast({
        title: "创建失败",
        description: "项目创建失败，请稍后重试",
        variant: "destructive"
      });
    }
  });

  // 开始生成规划
  const generatePlanningMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const headers: any = { 'Content-Type': 'application/json' };
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }

      const response = await fetch(`/api/planning/projects/${projectId}/generate`, {
        method: "POST",
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to start generation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "开始生成",
        description: "五年规划正在自动生成中，请稍候..."
      });
      // 定期刷新项目状态
      const interval = setInterval(() => {
        refetchProjects();
      }, 2000);
      
      // 10秒后停止轮询
      setTimeout(() => {
        clearInterval(interval);
      }, 10000);
    },
    onError: (error) => {
      toast({
        title: "生成失败",
        description: "无法开始生成规划，请稍后重试",
        variant: "destructive"
      });
    }
  });

  const handleCreateProject = () => {
    if (!newProject.title || !newProject.region || !newProject.templateId) {
      toast({
        title: "信息不完整",
        description: "请填写完整的项目信息",
        variant: "destructive"
      });
      return;
    }

    createProjectMutation.mutate({
      ...newProject,
      templateId: parseInt(newProject.templateId)
    });
  };

  const handleGeneratePlanning = (projectId: number) => {
    generatePlanningMutation.mutate(projectId);
  };

  const handleDownload = async (projectId: number, format: 'word' | 'pdf') => {
    try {
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      }

      const response = await fetch(`/api/planning/projects/${projectId}/download/${format}`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error("下载失败");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planning_${projectId}.${format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "下载失败",
        description: "文件下载失败，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      case 'generating':
        return <Badge variant="default">生成中</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">已完成</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">五年规划自动撰写</h1>
        <p className="text-gray-600">
          基于AI技术和网络搜索，自动生成专业的五年发展规划文档
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">我的项目</TabsTrigger>
          <TabsTrigger value="templates">规划模板</TabsTrigger>
          <TabsTrigger value="settings">功能设置</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">规划项目</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新建项目
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建五年规划项目</DialogTitle>
                  <DialogDescription>
                    填写项目基本信息，系统将自动生成规划内容
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">项目标题</Label>
                      <Input
                        id="title"
                        value={newProject.title}
                        onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="如：深圳市十四五发展规划"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">地区名称</Label>
                      <Input
                        id="region"
                        value={newProject.region}
                        onChange={(e) => setNewProject(prev => ({ ...prev, region: e.target.value }))}
                        placeholder="如：深圳市"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planType">规划类型</Label>
                      <Select 
                        value={newProject.planType} 
                        onValueChange={(value) => setNewProject(prev => ({ ...prev, planType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择规划类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="十四五">十四五规划</SelectItem>
                          <SelectItem value="十五五">十五五规划</SelectItem>
                          <SelectItem value="中长期">中长期规划</SelectItem>
                          <SelectItem value="专项">专项规划</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template">规划模板</Label>
                      <Select 
                        value={newProject.templateId} 
                        onValueChange={(value) => setNewProject(prev => ({ ...prev, templateId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择模板" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template: PlanningTemplate) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localPath">本地参考文件路径（可选）</Label>
                    <Input
                      id="localPath"
                      value={newProject.localFilePath}
                      onChange={(e) => setNewProject(prev => ({ ...prev, localFilePath: e.target.value }))}
                      placeholder="如：/path/to/reference/files/"
                    />
                    <p className="text-sm text-gray-500">
                      支持 Word、PDF、Excel、PNG 等格式文件
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="webSearch"
                      checked={newProject.enableWebSearch}
                      onChange={(e) => setNewProject(prev => ({ ...prev, enableWebSearch: e.target.checked }))}
                    />
                    <Label htmlFor="webSearch" className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      启用网络搜索（搜索最新政策和数据）
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                  >
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      "创建项目"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {projectsLoading ? (
              <div className="flex flex-col justify-center items-center h-32 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">正在加载项目数据...</p>
              </div>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无规划项目</h3>
                  <p className="text-gray-500 mb-4">创建第一个五年规划项目开始使用</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建项目
                  </Button>
                </CardContent>
              </Card>
            ) : (
              projects.map((project: PlanningProject) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(project.status)}
                        <div>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription>
                            {project.region} • {project.planType} • 
                            创建于 {new Date(project.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(project.status)}
                        {project.enableWebSearch && (
                          <Badge variant="outline">
                            <Globe className="w-3 h-3 mr-1" />
                            网络搜索
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {project.status === 'generating' && (
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>生成进度</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="w-full" />
                      </div>
                    </CardContent>
                  )}

                  {project.status === 'completed' && project.metadata && (
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">总字数</span>
                          <p className="font-medium">{project.metadata.totalWords || 0} 字</p>
                        </div>
                        <div>
                          <span className="text-gray-500">章节数</span>
                          <p className="font-medium">{project.sections?.length || 0} 章</p>
                        </div>
                        <div>
                          <span className="text-gray-500">完成时间</span>
                          <p className="font-medium">
                            {project.metadata.generatedAt ? 
                              new Date(project.metadata.generatedAt).toLocaleDateString() : 
                              '未知'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {project.status === 'failed' && project.errorMessage && (
                    <CardContent>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-red-800 text-sm">{project.errorMessage}</p>
                      </div>
                    </CardContent>
                  )}

                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      {project.status === 'draft' && (
                        <Button
                          onClick={() => handleGeneratePlanning(project.id)}
                          disabled={generatePlanningMutation.isPending}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          开始生成
                        </Button>
                      )}
                      
                      {project.status === 'completed' && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(project.id, 'word')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载Word
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(project.id, 'pdf')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载PDF
                          </Button>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">规划模板</h2>
          </div>

          <div className="grid gap-4">
            {templatesLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无可用模板</h3>
                  <p className="text-gray-500">系统正在加载默认模板...</p>
                </CardContent>
              </Card>
            ) : (
              templates.map((template: PlanningTemplate) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">包含章节：</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {template.sections?.map((section: PlanningSection, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{section.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>功能配置</CardTitle>
              <CardDescription>
                配置五年规划自动撰写的各项功能参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">文件处理</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>支持的文件格式</Label>
                    <div className="flex flex-wrap gap-2">
                      {['.docx', '.pdf', '.xlsx', '.png', '.jpg'].map(format => (
                        <Badge key={format} variant="outline">{format}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>最大文件大小</Label>
                    <p className="text-sm text-gray-600">10MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">网络搜索</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>搜索引擎</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Google</Badge>
                      <Badge variant="outline">Baidu</Badge>
                      <Badge variant="outline">Bing</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>搜索范围</Label>
                    <p className="text-sm text-gray-600">最新政策、数据统计、发展趋势</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">AI模型</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>使用模型</Label>
                    <p className="text-sm text-gray-600">GPT-4o</p>
                  </div>
                  <div className="space-y-2">
                    <Label>生成质量</Label>
                    <p className="text-sm text-gray-600">专业政府规划文档标准</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}