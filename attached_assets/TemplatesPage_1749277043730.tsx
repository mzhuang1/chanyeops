import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateService, ReportTemplate } from '../../services/TemplateService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Search, Filter, Calendar, Tag, BookOpen, BarChart3, FileText, Clock, Eye, Play } from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { TemplatePreview } from '../TemplatePreview';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ReportTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('all');

  // 加载模板数据
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await TemplateService.getTemplates();
        setTemplates(data);
        setFilteredTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        toast.error("获取模板列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 筛选和排序模板
  useEffect(() => {
    let result = [...templates];
    
    // 应用搜索筛选
    if (searchQuery) {
      result = result.filter(
        template => 
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 应用分类筛选
    if (categoryFilter !== 'all') {
      result = result.filter(template => template.category === categoryFilter);
    }
    
    // 应用官方/自定义标签筛选
    if (activeTab === 'official') {
      result = result.filter(template => template.isOfficial);
    } else if (activeTab === 'custom') {
      result = result.filter(template => !template.isOfficial);
    } else if (activeTab === 'recent') {
      // 按照最近使用排序 - 使用usageCount作为代理
      result = result.sort((a, b) => b.usageCount - a.usageCount);
    }
    
    // 应用排序
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popularity':
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredTemplates(result);
  }, [templates, searchQuery, categoryFilter, sortOrder, activeTab]);

  // 处理模板预览
  const handlePreviewTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // 处理创建报告
  const handleCreateReport = (template: ReportTemplate) => {
    navigate('/chat', { state: { selectedTemplate: template, startReport: true } });
  };

  // 获取模板分类列表
  const getTemplateCategories = () => {
    const categories = new Set(templates.map(template => template.category));
    return Array.from(categories);
  };

  // 处理Tab切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'all') {
      setCategoryFilter('all');
    } else if (value === 'official' || value === 'custom') {
      // 不改变分类筛选
    } else if (value === 'recent') {
      setSortOrder('popularity');
    }
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: ReportTemplate) => (
    <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-3">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <Badge variant={template.isOfficial ? "default" : "outline"}>
            {template.isOfficial ? "官方模板" : "自定义"}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 mb-3">{template.description}</CardDescription>
        
        {/* 将按钮移到这里，放在描述下方 */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1" 
            onClick={() => handlePreviewTemplate(template)}
          >
            <Eye className="mr-1 h-3 w-3" />
            预览
          </Button>
          <Button 
            size="sm"
            className="flex-1" 
            onClick={() => handleCreateReport(template)}
          >
            <Play className="mr-1 h-3 w-3" />
            使用此模板
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-0">
        <div 
          className="h-40 mb-4 rounded-md bg-center bg-cover border"
          style={{ backgroundImage: `url(${template.thumbnailUrl})` }}
        />
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1 h-4 w-4" />
            <span>创建于 {new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Tag className="mr-1 h-4 w-4" />
            <span>分类：{template.category}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="mr-1 h-4 w-4" />
            <span>使用次数：{template.usageCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium">报告模板库</h1>
          <p className="text-muted-foreground">浏览、预览和选择报告模板</p>
        </div>
      </div>
      
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索模板..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="筛选分类" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分类</SelectItem>
            {getTemplateCategories().map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full md:w-[180px]">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="排序方式" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新创建</SelectItem>
            <SelectItem value="oldest">最早创建</SelectItem>
            <SelectItem value="popularity">使用频率</SelectItem>
            <SelectItem value="alphabetical">字母顺序</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">所有模板</TabsTrigger>
          <TabsTrigger value="official">官方模板</TabsTrigger>
          <TabsTrigger value="custom">自定义模板</TabsTrigger>
          <TabsTrigger value="recent">常用模板</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded animate-pulse w-full mb-1"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-2/3 mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-muted rounded animate-pulse flex-1"></div>
                  <div className="h-8 bg-muted rounded animate-pulse flex-1"></div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pb-0">
                <div className="h-40 mb-4 rounded-md bg-muted animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">未找到模板</h2>
          <p className="text-muted-foreground mb-6">
            没有符合当前搜索条件的模板
          </p>
          <Button onClick={() => {
            setSearchQuery('');
            setCategoryFilter('all');
            setSortOrder('newest');
            setActiveTab('all');
          }}>
            重置筛选条件
          </Button>
        </div>
      )}
      
      {/* 模板预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <TemplatePreview template={selectedTemplate} />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreview(false)}>关闭</Button>
                <Button onClick={() => {
                  setShowPreview(false);
                  handleCreateReport(selectedTemplate);
                }}>
                  使用此模板
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};