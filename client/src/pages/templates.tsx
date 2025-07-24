import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Globe,
  Building,
  Zap,
  Target
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportTemplate } from "@shared/schema";

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const categories = [
    { value: "all", label: "全部模板" },
    { value: "government", label: "政府决策" },
    { value: "park", label: "园区规划" },
    { value: "research", label: "学术研究" },
    { value: "investment", label: "投资分析" },
    { value: "comparison", label: "对比分析" },
  ];

  const templateIcons = {
    government: Building,
    park: Globe,
    research: BarChart3,
    investment: TrendingUp,
    comparison: Target,
    default: FileText
  };

  const templateColors = {
    government: "text-blue-600",
    park: "text-green-600",
    research: "text-purple-600",
    investment: "text-orange-600",
    comparison: "text-pink-600",
    default: "text-gray-600"
  };

  // Sample templates data (in a real app, this would come from the API)
  const sampleTemplates = [
    {
      id: 1,
      name: "产业集群发展潜力综合评估报告",
      category: "government",
      description: "全面评估产业集群的创新能力、政策支持、人才集聚等多维度指标，为政府决策提供科学依据",
      tags: ["综合评估", "政策制定", "发展规划"],
      usageCount: 1247,
      rating: 4.8,
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      name: "产业园区招商引资分析报告",
      category: "park",
      description: "分析园区产业定位、优势特色、招商策略，为园区管理者优化招商方案提供参考",
      tags: ["招商引资", "园区管理", "产业定位"],
      usageCount: 892,
      rating: 4.6,
      lastUpdated: "2024-01-10"
    },
    {
      id: 3,
      name: "区域产业集群竞争力对比研究",
      category: "research",
      description: "横向对比不同地区同类产业集群的发展水平、竞争优势和发展模式",
      tags: ["竞争力分析", "区域对比", "发展模式"],
      usageCount: 654,
      rating: 4.7,
      lastUpdated: "2024-01-08"
    },
    {
      id: 4,
      name: "产业集群投资价值评估报告",
      category: "investment",
      description: "从投资角度分析产业集群的市场前景、风险评估和投资机会",
      tags: ["投资价值", "风险评估", "市场前景"],
      usageCount: 423,
      rating: 4.5,
      lastUpdated: "2024-01-05"
    },
    {
      id: 5,
      name: "新兴产业集群发展趋势分析",
      category: "research",
      description: "分析人工智能、生物医药等新兴产业集群的发展趋势和增长潜力",
      tags: ["新兴产业", "发展趋势", "增长潜力"],
      usageCount: 738,
      rating: 4.9,
      lastUpdated: "2024-01-12"
    },
    {
      id: 6,
      name: "传统产业集群转型升级评估",
      category: "government",
      description: "评估传统产业集群的转型升级程度、数字化水平和可持续发展能力",
      tags: ["转型升级", "数字化", "可持续发展"],
      usageCount: 567,
      rating: 4.4,
      lastUpdated: "2024-01-03"
    }
  ];

  const filteredTemplates = sampleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: any) => {
    toast({
      title: "模板已选择",
      description: `正在使用模板"${template.name}"生成报告...`,
    });
  };

  const handlePreviewTemplate = (template: any) => {
    toast({
      title: "预览模板",
      description: `正在预览模板"${template.name}"...`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-primary">报告模板库</h1>
        <p className="heading-secondary">
          选择专业的评估模板，快速生成高质量的产业集群分析报告
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="professional-card mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模板名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="data-metric-card">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="data-metric-value">24</div>
            <div className="data-metric-label">可用模板</div>
          </CardContent>
        </Card>
        <Card className="data-metric-card">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
            <div className="data-metric-value">5,248</div>
            <div className="data-metric-label">总使用次数</div>
          </CardContent>
        </Card>
        <Card className="data-metric-card">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="data-metric-value">4.7</div>
            <div className="data-metric-label">平均评分</div>
          </CardContent>
        </Card>
        <Card className="data-metric-card">
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <div className="data-metric-value">新增</div>
            <div className="data-metric-label">本月更新</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid-responsive">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="professional-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="skeleton h-6 w-3/4"></div>
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                  <div className="flex space-x-2">
                    <div className="skeleton h-6 w-16"></div>
                    <div className="skeleton h-6 w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid-responsive">
          {filteredTemplates.map((template) => {
            const IconComponent = templateIcons[template.category] || templateIcons.default;
            const iconColor = templateColors[template.category] || templateColors.default;
            
            return (
              <Card key={template.id} className="professional-card group hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className={`w-6 h-6 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {template.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === template.category)?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{template.usageCount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{template.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{template.lastUpdated}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      className="flex-1 btn-primary"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      使用模板
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredTemplates.length === 0 && !isLoading && (
        <Card className="professional-card">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">未找到匹配的模板</h3>
            <p className="text-muted-foreground mb-6">
              请尝试调整搜索条件或选择不同的分类
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              重置筛选条件
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Template CTA */}
      <Card className="glass-card mt-12">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-4">需要定制模板？</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            我们可以根据您的特定需求创建专属的报告模板，覆盖特殊行业、特定地区或自定义评估维度
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-primary">
              申请定制模板
            </Button>
            <Button variant="outline">
              联系技术支持
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
