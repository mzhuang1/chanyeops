import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Database,
  Upload,
  FileText,
  Search,
  Settings,
  Trash2,
  Edit,
  Eye,
  Download,
  Plus,
  Filter,
  BarChart3,
  Calendar,
  Tag,
  BookOpen,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Knowledge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newKnowledgeItem, setNewKnowledgeItem] = useState({
    title: "",
    description: "",
    category: "",
    content: ""
  });

  // Initialize demo user if needed
  const initializeDemoUser = () => {
    let demoUser = localStorage.getItem('demo_user');
    if (!demoUser) {
      const newDemoUser = { id: 'guest_demo', name: 'Demo User' };
      localStorage.setItem('demo_user', JSON.stringify(newDemoUser));
      return newDemoUser.id;
    }
    return JSON.parse(demoUser).id;
  };

  // Fetch uploaded files/documents for knowledge base
  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: async () => {
      const userId = initializeDemoUser();
      const headers: any = { 'x-demo-user-id': userId };
      
      const response = await fetch('/api/uploads', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }
      
      return response.json();
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Set demo user header for authentication
      const userId = initializeDemoUser();
      const headers: any = { 'x-demo-user-id': userId };
      
      const response = await fetch('/api/upload', {
        method: 'POST',
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
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      toast({
        title: "文件上传成功",
        description: `${data.originalName} 已添加到知识库并开始处理`
      });
      setIsUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "未授权",
          description: "您已登出，正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "上传失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      const headers: any = {};
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        headers['x-demo-user-id'] = JSON.parse(demoUser).id;
      } else {
        headers['x-demo-user-id'] = 'guest_demo';
      }
      
      const response = await fetch(`/api/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      toast({
        title: "文件删除成功",
        description: "文件已从知识库中移除"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Image analysis mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async ({ uploadId }: { uploadId: number }) => {
      const response = await fetch(`/api/uploads/${uploadId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: "" }),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "图表分析完成",
        description: "AI分析结果已生成，点击查看详细内容"
      });
      // Could open a dialog or navigate to analysis results
      console.log("Analysis result:", data.analysis);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "未授权",
          description: "您已登出，正在重新登录...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "分析失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyzeImage = (upload: any) => {
    analyzeImageMutation.mutate({ uploadId: upload.id });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDeleteSelected = () => {
    toast({
      title: "删除操作",
      description: `已选择删除 ${selectedFiles.length} 个文件`,
    });
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return '等待中';
    }
  };

  const filteredUploads = (Array.isArray(uploads) ? uploads : []).filter((upload: any) => {
    const matchesSearch = upload.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         upload.extractedText?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || upload.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-primary">知识库管理</h1>
            <p className="heading-secondary">
              管理上传的文档，构建智能检索知识库，支持产业集群分析的数据基础
            </p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  添加文档
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>上传文档</DialogTitle>
                  <DialogDescription>
                    支持PDF、Word、Excel、PPT等多种格式文档
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Button
                      onClick={handleFileUpload}
                      disabled={uploadFileMutation.isPending}
                      className="w-full"
                    >
                      {uploadFileMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          选择文件上传
                        </>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.txt,.png,.jpg,.jpeg,.gif,.ppt,.pptx"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {selectedFiles.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                删除选中 ({selectedFiles.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="documents">文档管理</TabsTrigger>
          <TabsTrigger value="analytics">分析统计</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="professional-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">总文档数</p>
                    <p className="text-2xl font-bold">{uploads?.length || 0}</p>
                  </div>
                  <Database className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">已处理</p>
                    <p className="text-2xl font-bold text-green-600">
                      {uploads?.filter((u: any) => u.status === 'completed').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">处理中</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {uploads?.filter((u: any) => u.status === 'processing').length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">存储空间</p>
                    <p className="text-2xl font-bold">
                      {formatFileSize(uploads?.reduce((acc: number, u: any) => acc + (u.fileSize || 0), 0) || 0)}
                    </p>
                  </div>
                  <HardDrive className="w-8 h-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                最近活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploads?.slice(0, 5).map((upload: any) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{upload.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(upload.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload.status)}
                      <span className="text-sm">{getStatusText(upload.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          {/* Search and Filter */}
          <Card className="professional-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="搜索文档名称或内容..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="report">研究报告</SelectItem>
                    <SelectItem value="policy">政策文件</SelectItem>
                    <SelectItem value="data">数据资料</SelectItem>
                    <SelectItem value="news">新闻资讯</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card className="professional-card">
            <CardHeader>
              <CardTitle>文档列表</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(filteredUploads.map((u: any) => u.id));
                            } else {
                              setSelectedFiles([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>文档名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>上传时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUploads.map((upload: any) => (
                      <TableRow key={upload.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(upload.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles([...selectedFiles, upload.id]);
                              } else {
                                setSelectedFiles(selectedFiles.filter(id => id !== upload.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{upload.originalName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{upload.mimeType?.split('/')[1]?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(upload.fileSize || 0)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(upload.status)}
                            <span>{getStatusText(upload.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(upload.createdAt).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {upload.filename && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(upload.filename) && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleAnalyzeImage(upload)}
                                title="分析图表"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteFileMutation.mutate(upload.id)}
                              disabled={deleteFileMutation.isPending}
                              title="删除文件"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  文档类型分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'PDF文档', count: uploads?.filter((u: any) => u.mimeType?.includes('pdf')).length || 0, color: 'bg-blue-500' },
                    { type: 'Word文档', count: uploads?.filter((u: any) => u.mimeType?.includes('word')).length || 0, color: 'bg-green-500' },
                    { type: 'Excel表格', count: uploads?.filter((u: any) => u.mimeType?.includes('sheet')).length || 0, color: 'bg-yellow-500' },
                    { type: '图片文件', count: uploads?.filter((u: any) => u.mimeType?.includes('image')).length || 0, color: 'bg-purple-500' }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span>{item.type}</span>
                      </div>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-secondary" />
                  上传趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>上传趋势图表功能正在开发中</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary" />
                知识库设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>自动处理设置</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-extract" defaultChecked />
                      <Label htmlFor="auto-extract">自动提取文本内容</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-analyze" defaultChecked />
                      <Label htmlFor="auto-analyze">自动分析文档结构</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-tag" />
                      <Label htmlFor="auto-tag">自动生成标签</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>存储设置</Label>
                  <div className="space-y-3">
                    <div>
                      <Label>最大文件大小 (MB)</Label>
                      <Input type="number" defaultValue="50" className="mt-1" />
                    </div>
                    <div>
                      <Label>存储保留期 (天)</Label>
                      <Input type="number" defaultValue="365" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="btn-primary">
                  保存设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}