import React, { useState } from "react";
import { ChatInput } from "../ChatInput";
import { ChatMessage } from "../ChatMessage";
import { Button } from "../ui/button";
import { UploadCloudIcon, DatabaseIcon, FileTextIcon, SparklesIcon, BookOpen, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VisualizationDashboard } from "../VisualizationDashboard";
import { DataUploadDialog } from "../DataUploadDialog";
import { BatchProcessDialog } from "../BatchProcessDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { UploadResult } from "../../services/DataUploadService";
import { toast } from "sonner@2.0.3";

export function HomePage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [activeSection, setActiveSection] = useState('welcome');
  const [uploadHistory, setUploadHistory] = useState<UploadResult[]>([]);
  
  const handleSendMessage = () => {
    // Navigate to chat page with the message
    if (inputValue.trim()) {
      navigate("/chat");
    }
  };
  
  // 导航到模板页面
  const navigateToTemplates = () => {
    navigate("/templates");
  };
  
  // 切换到数据可视化视图
  const showVisualization = () => {
    setActiveSection('visualization');
  };

  // 处理上传完成
  const handleUploadComplete = (results: UploadResult[]) => {
    const successfulUploads = results.filter(result => result.success);
    setUploadHistory(prev => [...successfulUploads, ...prev]);
    
    if (successfulUploads.length > 0) {
      toast.success(`成功上传 ${successfulUploads.length} 个文件`, {
        description: "文件已处理完成，您可以在批量处理中使用这些数据。"
      });
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-auto">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full h-full">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
              <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
                <TabsTrigger value="welcome" className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  智能助手
                </TabsTrigger>
                <TabsTrigger value="visualization" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  数据可视化
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="welcome" className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className="py-8 px-4 flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-3xl font-bold mb-6 text-center">产业集群发展潜力评估系统</h1>
                <p className="text-center max-w-md mb-8 text-muted-foreground">
                  通过AI智能分析与大数据评估，为您提供专业的产业集群发展潜力分析和预测
                </p>
                
                <div className="max-w-md w-full space-y-4">
                  <ChatMessage 
                    role="assistant" 
                    content={
                      <div>
                        <p>
                          您好，我是产业集群评估助手。我可以帮助您评估产业集群发展潜力、分析区域优势、预测未来趋势。
                        </p>
                        <p className="mt-2">
                          您可以：
                        </p>
                        <ul className="list-disc pl-6 mt-1 space-y-1">
                          <li>要求我分析特定区域的产业发展潜力</li>
                          <li>生成产业评估报告模板</li>
                          <li>获取政策建议和发展预测</li>
                          <li>查看丰富的数据可视化分析</li>
                        </ul>
                        <p className="mt-2">
                          请问您想了解哪个区域或行业的产业集群分析？
                        </p>
                      </div>
                    } 
                  />
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-blue-500" />
                      <h3 className="font-medium">模板生成功能</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      您可以直接要求我生成各类产业评估报告模板，例如：
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => navigate("/chat")}
                      >
                        生成杭州生物医药产业综合评估报告模板
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-xs h-8"
                        onClick={() => navigate("/chat")}
                      >
                        创建包含政策建议的产业评估报告
                      </Button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-center text-sm h-9"
                        onClick={navigateToTemplates}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        浏览所有报告模板
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full justify-center text-sm h-9"
                        onClick={showVisualization}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        查看数据可视化示例
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 功能按钮区域 */}
            <div className="flex justify-center gap-4 mb-8">
              <DataUploadDialog 
                onUploadComplete={handleUploadComplete}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <UploadCloudIcon className="w-4 h-4" />
                    上传数据
                  </Button>
                }
              />
              
              <BatchProcessDialog 
                uploadHistory={uploadHistory}
                trigger={
                  <Button variant="outline" className="gap-2">
                    <DatabaseIcon className="w-4 h-4" />
                    批量处理
                  </Button>
                }
              />
              
              <Button variant="outline" className="gap-2" onClick={() => navigate("/templates")}>
                <FileTextIcon className="w-4 h-4" />
                模板库
              </Button>
            </div>
            
            <ChatInput 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSend={handleSendMessage}
              placeholder="请输入您的问题，例如：请帮我评估杭州市生物医药产业集群潜力..."
            />
          </TabsContent>

          <TabsContent value="visualization" className="h-full overflow-auto">
            <div className="container mx-auto px-4 py-6">
              <VisualizationDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}