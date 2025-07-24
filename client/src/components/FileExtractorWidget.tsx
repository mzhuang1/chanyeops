import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Link, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ExtractionResult {
  success: boolean;
  file_url?: string;
  filename?: string;
  extraction_type: string;
  result: any;
  session_id: string;
}

interface FileExtractorWidgetProps {
  onExtractionComplete?: (result: ExtractionResult) => void;
  className?: string;
}

export function FileExtractorWidget({ onExtractionComplete, className }: FileExtractorWidgetProps) {
  const [activeTab, setActiveTab] = useState('url');
  const [fileUrl, setFileUrl] = useState('');
  const [extractionType, setExtractionType] = useState('text');
  const [extractedContent, setExtractedContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [supportedFormats, setSupportedFormats] = useState<any>(null);
  const { toast } = useToast();

  // Load supported formats on component mount
  useEffect(() => {
    loadSupportedFormats();
  }, []);

  const loadSupportedFormats = async () => {
    try {
      const response = await fetch('/api/fastapi/file-extractor/supported-formats');
      if (response.ok) {
        const formats = await response.json();
        setSupportedFormats(formats);
      }
    } catch (error) {
      console.error('Failed to load supported formats:', error);
    }
  };

  const extractFromUrl = async () => {
    if (!fileUrl.trim()) {
      toast({
        title: "请输入文件URL",
        description: "请提供有效的文件URL地址",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(20);

    try {
      // Try FastAPI backend first
      let response = await fetch('/api/fastapi/file-extractor/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: fileUrl,
          extraction_type: extractionType,
          session_id: `extract_${Date.now()}`
        })
      });

      setExtractionProgress(60);

      if (!response.ok) {
        // Fallback to Node.js backend
        response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput: `请提取并分析文件内容：${fileUrl}`,
            sessionId: `extract_${Date.now()}`
          })
        });
      }

      const result = await response.json();
      setExtractionProgress(100);

      if (result.success) {
        const content = typeof result.result === 'string' ? result.result : 
                      result.result?.content || JSON.stringify(result.result, null, 2);
        
        setExtractedContent(content);
        
        toast({
          title: "文件提取成功",
          description: `已成功提取 ${extractionType} 内容`,
        });

        if (onExtractionComplete) {
          onExtractionComplete(result);
        }
      } else {
        throw new Error(result.error || '提取失败');
      }
    } catch (error) {
      toast({
        title: "文件提取失败",
        description: error.message || "请检查URL是否正确或启动FastAPI后端",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };

  const extractFromUpload = async (file: File) => {
    setIsExtracting(true);
    setExtractionProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extraction_type', extractionType);
      formData.append('session_id', `upload_${Date.now()}`);

      setExtractionProgress(40);

      const response = await fetch('/api/fastapi/file-extractor/extract-upload', {
        method: 'POST',
        body: formData
      });

      setExtractionProgress(80);

      const result = await response.json();
      setExtractionProgress(100);

      if (result.success) {
        const content = typeof result.result === 'string' ? result.result : 
                      result.result?.content || JSON.stringify(result.result, null, 2);
        
        setExtractedContent(content);
        
        toast({
          title: "文件上传提取成功",
          description: `已成功提取 ${file.name} 的 ${extractionType} 内容`,
        });

        if (onExtractionComplete) {
          onExtractionComplete(result);
        }
      } else {
        throw new Error(result.detail || '上传提取失败');
      }
    } catch (error) {
      toast({
        title: "文件上传提取失败",
        description: error.message || "请检查文件格式或启动FastAPI后端",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };

  const analyzeContent = async () => {
    if (!extractedContent.trim()) {
      toast({
        title: "没有内容可分析",
        description: "请先提取文件内容",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/fastapi/file-extractor/analyze-extracted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: extractedContent,
          analysis_type: 'summary',
          session_id: `analyze_${Date.now()}`
        })
      });

      const result = await response.json();

      if (result.success) {
        const analysis = typeof result.analysis === 'string' ? result.analysis : 
                        JSON.stringify(result.analysis, null, 2);
        
        setExtractedContent(extractedContent + '\n\n**智能分析结果：**\n' + analysis);
        
        toast({
          title: "内容分析完成",
          description: "已生成智能分析结果",
        });
      } else {
        throw new Error(result.detail || '分析失败');
      }
    } catch (error) {
      toast({
        title: "内容分析失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const downloadContent = () => {
    if (!extractedContent.trim()) {
      toast({
        title: "没有内容可下载",
        description: "请先提取文件内容",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([extractedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_content_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "内容已下载",
      description: "提取的内容已保存到本地文件",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          智能文件提取器
        </CardTitle>
        <CardDescription>
          使用MCP协议从URL或上传文件中提取内容，支持多种文件格式
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              从URL提取
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              上传文件
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文件URL</label>
              <Input
                placeholder="https://example.com/document.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                disabled={isExtracting}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">提取类型</label>
              <select 
                className="w-full border rounded-md px-3 py-2"
                value={extractionType}
                onChange={(e) => setExtractionType(e.target.value)}
                disabled={isExtracting}
              >
                <option value="text">文本内容</option>
                <option value="metadata">元数据</option>
                <option value="full">完整内容</option>
                <option value="structured">结构化数据</option>
              </select>
            </div>

            <Button 
              onClick={extractFromUrl} 
              disabled={isExtracting || !fileUrl.trim()}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提取中...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  从URL提取
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">上传文件</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      extractFromUpload(file);
                    }
                  }}
                  disabled={isExtracting}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    点击上传文件或拖拽到此处
                  </p>
                  {supportedFormats && (
                    <p className="text-xs text-gray-500 mt-1">
                      支持: {supportedFormats.text_formats?.slice(0, 5).join(', ')} 等
                    </p>
                  )}
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isExtracting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">正在提取文件内容...</span>
            </div>
            <Progress value={extractionProgress} className="w-full" />
          </div>
        )}

        {extractedContent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">提取结果</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={analyzeContent}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  智能分析
                </Button>
                <Button variant="outline" size="sm" onClick={downloadContent}>
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
            </div>
            <Textarea
              value={extractedContent}
              onChange={(e) => setExtractedContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              placeholder="提取的内容将在这里显示..."
            />
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {extractedContent.length} 字符
              </Badge>
              <Badge variant="outline">
                {extractionType} 格式
              </Badge>
            </div>
          </div>
        )}

        {supportedFormats && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              查看支持的文件格式
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>文档格式:</strong> {supportedFormats.document_formats?.join(', ')}
              </div>
              <div>
                <strong>文本格式:</strong> {supportedFormats.text_formats?.join(', ')}
              </div>
              <div>
                <strong>图像格式:</strong> {supportedFormats.image_formats?.join(', ')}
              </div>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}