import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Search as SearchIcon,
  Filter,
  Download,
  Eye,
  Calendar,
  MapPin,
  Building2,
  FileText,
  TrendingUp,
  Users,
  Globe,
  Star
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Search() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("杭州生物医药产业集群");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    contentType: {
      all: true,
      reports: true,
      news: false,
      policies: false,
      companies: false
    },
    region: {
      yangtze: true,
      pearl: false,
      beijing: false
    },
    industry: {
      biotech: true,
      electronics: false,
      ai: false
    }
  });

  // Mock search results data
  const searchResults = [
    {
      id: 1,
      type: "研究报告",
      title: "杭州生物医药产业集群发展现状与前景分析报告",
      description: "本报告深入分析了杭州市生物医药产业集群的发展现状，包括产业规模、创新能力、人才结构等核心指标，并对未来5年的发展前景进行了预测...",
      source: "浙江省科技厅",
      date: "2024-03-15",
      pages: "45页",
      downloads: "1,234次",
      tags: ["生物医药", "杭州", "产业集群", "发展前景"],
      rating: 4.8
    },
    {
      id: 2,
      type: "政策文件",
      title: "浙江省生物医药产业发展十四五规划",
      description: "规划提出到2025年，全省生物医药产业规模达到8000亿元，形成杭州、宁波等多个千亿级产业集群...",
      source: "浙江省发改委",
      date: "2024-02-28",
      pages: "32页",
      downloads: "892次",
      tags: ["十四五规划", "生物医药", "浙江省"],
      rating: 4.6
    },
    {
      id: 3,
      type: "新闻资讯",
      title: "杭州生物医药港：打造世界级生物医药创新高地",
      description: "杭州生物医药港作为浙江省生物医药产业发展的核心载体，聚集了300多家生物医药企业，形成了完整的产业链条...",
      source: "杭州日报",
      date: "2024-03-10",
      pages: "3页",
      downloads: "567次",
      tags: ["杭州", "生物医药港", "创新高地"],
      rating: 4.3
    },
    {
      id: 4,
      type: "企业信息",
      title: "贝达药业：杭州生物医药产业集群的领军企业",
      description: "贝达药业作为国内首个具有自主知识产权的小分子靶向抗癌药研发企业，在杭州生物医药产业集群中发挥着重要作用...",
      source: "企业年报",
      date: "2024-01-20",
      pages: "28页",
      downloads: "423次",
      tags: ["贝达药业", "小分子靶向药", "创新药"],
      rating: 4.5
    },
    {
      id: 5,
      type: "研究报告",
      title: "长三角生物医药产业集群协同发展研究",
      description: "分析长三角地区生物医药产业集群的空间分布、发展特征和协同机制，为区域一体化发展提供参考...",
      source: "中科院上海生科院",
      date: "2024-02-15",
      pages: "68页",
      downloads: "756次",
      tags: ["长三角", "生物医药", "协同发展"],
      rating: 4.7
    }
  ];

  const handleSearch = () => {
    toast({
      title: "搜索完成",
      description: `找到 ${searchResults.length} 个相关结果`,
    });
  };

  const handleFilterChange = (category: string, key: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as Record<string, boolean>),
        [key]: checked
      }
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "研究报告":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "政策文件":
        return <Building2 className="w-4 h-4 text-green-600" />;
      case "新闻资讯":
        return <Globe className="w-4 h-4 text-orange-600" />;
      case "企业信息":
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "研究报告":
        return "bg-blue-100 text-blue-800";
      case "政策文件":
        return "bg-green-100 text-green-800";
      case "新闻资讯":
        return "bg-orange-100 text-orange-800";
      case "企业信息":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-primary">智能搜索</h1>
        <p className="heading-secondary">
          搜索产业集群数据、报告和分析结果
        </p>
      </div>

      {/* Search Bar */}
      <Card className="professional-card mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <div className="flex">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 text-lg border-r-0 rounded-r-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="搜索产业集群、地区、公司或关键词..."
                />
                <SearchIcon className="absolute right-4 top-3.5 h-6 w-6 text-muted-foreground" />
              </div>
              <Button 
                className="bg-primary text-white px-6 py-3 rounded-l-none hover:bg-blue-600 font-medium"
                onClick={handleSearch}
              >
                搜索
              </Button>
            </div>
          </div>
          
          {/* Search Suggestions */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">热门搜索：</p>
            <div className="flex flex-wrap gap-2">
              {["长三角电子信息", "珠三角制造业", "北京科技园区", "深圳人工智能", "成都生物医药"].map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-muted"
                  onClick={() => setSearchQuery(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-64 space-y-6">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                筛选条件
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type */}
              <div>
                <h4 className="font-medium mb-3">内容类型</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all"
                      checked={filters.contentType.all}
                      onCheckedChange={(checked) => handleFilterChange("contentType", "all", checked as boolean)}
                    />
                    <label htmlFor="all" className="text-sm">全部结果 (186)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reports"
                      checked={filters.contentType.reports}
                      onCheckedChange={(checked) => handleFilterChange("contentType", "reports", checked as boolean)}
                    />
                    <label htmlFor="reports" className="text-sm">研究报告 (45)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="news"
                      checked={filters.contentType.news}
                      onCheckedChange={(checked) => handleFilterChange("contentType", "news", checked as boolean)}
                    />
                    <label htmlFor="news" className="text-sm">新闻资讯 (68)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="policies"
                      checked={filters.contentType.policies}
                      onCheckedChange={(checked) => handleFilterChange("contentType", "policies", checked as boolean)}
                    />
                    <label htmlFor="policies" className="text-sm">政策文件 (32)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="companies"
                      checked={filters.contentType.companies}
                      onCheckedChange={(checked) => handleFilterChange("contentType", "companies", checked as boolean)}
                    />
                    <label htmlFor="companies" className="text-sm">企业信息 (41)</label>
                  </div>
                </div>
              </div>

              {/* Region */}
              <div>
                <h4 className="font-medium mb-3">地区</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="yangtze"
                      checked={filters.region.yangtze}
                      onCheckedChange={(checked) => handleFilterChange("region", "yangtze", checked as boolean)}
                    />
                    <label htmlFor="yangtze" className="text-sm">长三角 (89)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pearl"
                      checked={filters.region.pearl}
                      onCheckedChange={(checked) => handleFilterChange("region", "pearl", checked as boolean)}
                    />
                    <label htmlFor="pearl" className="text-sm">珠三角 (54)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="beijing"
                      checked={filters.region.beijing}
                      onCheckedChange={(checked) => handleFilterChange("region", "beijing", checked as boolean)}
                    />
                    <label htmlFor="beijing" className="text-sm">京津冀 (43)</label>
                  </div>
                </div>
              </div>

              {/* Industry */}
              <div>
                <h4 className="font-medium mb-3">行业</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="biotech"
                      checked={filters.industry.biotech}
                      onCheckedChange={(checked) => handleFilterChange("industry", "biotech", checked as boolean)}
                    />
                    <label htmlFor="biotech" className="text-sm">生物医药 (73)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="electronics"
                      checked={filters.industry.electronics}
                      onCheckedChange={(checked) => handleFilterChange("industry", "electronics", checked as boolean)}
                    />
                    <label htmlFor="electronics" className="text-sm">电子信息 (52)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai"
                      checked={filters.industry.ai}
                      onCheckedChange={(checked) => handleFilterChange("industry", "ai", checked as boolean)}
                    />
                    <label htmlFor="ai" className="text-sm">人工智能 (38)</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="flex-1">
          {/* Results Stats */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              找到 <span className="font-semibold">186</span> 个相关结果 (用时 0.23 秒)
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">相关性排序</SelectItem>
                <SelectItem value="time">时间排序</SelectItem>
                <SelectItem value="popularity">热度排序</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.id} className="professional-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(result.type)}`}>
                          {result.type}
                        </Badge>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          {result.date}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                        <a href="#" className="hover:underline">
                          {result.title}
                        </a>
                      </h3>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {result.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          来源: {result.source}
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {result.pages}
                        </div>
                        <div className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          下载: {result.downloads}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                          {result.rating}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {result.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        预览
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        下载
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination would go here */}
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <Button variant="outline" disabled>上一页</Button>
              <Button variant="outline" className="bg-primary text-white">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">下一页</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
