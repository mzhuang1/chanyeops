import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Download, Eye, Clock, Users } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const templateCategories = [
  { value: "all", label: "All Categories" },
  { value: "assessment", label: "Development Assessment" },
  { value: "planning", label: "Strategic Planning" },
  { value: "analysis", label: "Market Analysis" },
  { value: "investment", label: "Investment Evaluation" },
  { value: "policy", label: "Policy Research" }
];

const sampleTemplates = [
  {
    id: 1,
    name: "Industrial Cluster Development Assessment Report",
    category: "assessment",
    description: "Comprehensive evaluation template for industrial cluster development potential and competitiveness analysis",
    tags: ["Development", "Assessment", "Competitiveness"],
    usageCount: 156,
    rating: 4.8,
    lastUpdated: "2024-01-15"
  },
  {
    id: 2,
    name: "Five-Year Strategic Development Plan",
    category: "planning",
    description: "Complete framework for creating strategic development plans with implementation roadmaps",
    tags: ["Strategy", "Planning", "Implementation"],
    usageCount: 203,
    rating: 4.9,
    lastUpdated: "2024-01-10"
  },
  {
    id: 3,
    name: "Regional Economic Analysis Template",
    category: "analysis",
    description: "In-depth analysis framework for regional economic conditions and development opportunities",
    tags: ["Economics", "Regional", "Analysis"],
    usageCount: 89,
    rating: 4.6,
    lastUpdated: "2024-01-08"
  },
  {
    id: 4,
    name: "Investment Project Evaluation Report",
    category: "investment",
    description: "Professional template for evaluating investment projects and ROI analysis",
    tags: ["Investment", "Evaluation", "ROI"],
    usageCount: 142,
    rating: 4.7,
    lastUpdated: "2024-01-12"
  },
  {
    id: 5,
    name: "Policy Impact Assessment Framework",
    category: "policy",
    description: "Systematic approach to analyzing policy impacts on industrial development",
    tags: ["Policy", "Impact", "Government"],
    usageCount: 67,
    rating: 4.5,
    lastUpdated: "2024-01-05"
  },
  {
    id: 6,
    name: "Technology Innovation Cluster Analysis",
    category: "assessment",
    description: "Specialized template for evaluating technology and innovation clusters",
    tags: ["Technology", "Innovation", "Clusters"],
    usageCount: 98,
    rating: 4.8,
    lastUpdated: "2024-01-14"
  }
];

export default function TemplatesEn() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTemplates = sampleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePreviewTemplate = (template: any) => {
    console.log("Preview template:", template.name);
  };

  const handleCreateReport = (template: any) => {
    console.log("Create report from template:", template.name);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
        <p className="text-lg text-gray-600">
          Professional templates for industrial cluster assessment and strategic planning
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 bg-white rounded-lg border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="mb-2">
                  {templateCategories.find(cat => cat.value === template.category)?.label}
                </Badge>
                <div className="flex items-center text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="ml-1 text-sm font-medium">{template.rating}</span>
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
              <CardDescription className="line-clamp-3">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Statistics */}
              <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {template.usageCount} uses
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(template.lastUpdated).toLocaleDateString('en-US')}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCreateReport(template)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or category filter to find relevant templates.
          </p>
        </div>
      )}
    </div>
  );
}