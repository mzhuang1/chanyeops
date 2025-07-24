import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Trash2,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from "lucide-react";
import { DataUpload } from "@shared/schema";

interface FileUploadProps {
  onFileUploaded?: (upload: DataUpload) => void;
  className?: string;
}

export default function FileUpload({ onFileUploaded, className = "" }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch uploaded files
  const { data: uploads = [], isLoading } = useQuery<DataUpload[]>({
    queryKey: ["/api/uploads"],
    refetchInterval: 5000 // Refresh every 5 seconds to check processing status
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress tracking
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
        }));
      }, 200);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 2000);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "文件上传成功",
        description: "文件正在后台处理中，请稍后查看分析结果。"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      onFileUploaded?.(data);
    },
    onError: (error: Error) => {
      toast({
        title: "上传失败",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "文件过大",
          description: `文件 ${file.name} 超过50MB限制`,
          variant: "destructive"
        });
        return;
      }
      uploadMutation.mutate(file);
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
      case 'analyzing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'processing':
        return '处理中';
      case 'analyzing':
        return '分析中';
      default:
        return '等待中';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const supportedFormats = [
    'Excel (.xlsx, .xls)', 'CSV (.csv)', 'PDF (.pdf)', 
    'Word (.docx, .doc)', 'PowerPoint (.pptx, .ppt)',
    'JSON (.json)', '图片 (.jpg, .png, .gif)', '文本 (.txt)'
  ];

  return (
    <div className={className}>
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>文件上传与分析</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              拖拽文件到这里或点击上传
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              支持多种文件格式，最大50MB
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              选择文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInput}
              accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.pptx,.ppt,.json,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            />
          </div>

          {/* Supported Formats */}
          <div>
            <p className="text-sm font-medium mb-2">支持的文件格式：</p>
            <div className="flex flex-wrap gap-2">
              {supportedFormats.map((format, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {format}
                </Badge>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {Object.entries(uploadProgress).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">上传进度：</p>
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          )}

          {/* File List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium">已上传的文件 ({uploads.length})</p>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                搜索文件
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : uploads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无上传文件</p>
                </div>
              ) : (
                uploads.map((upload: DataUpload) => (
                  <Card key={upload.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getFileIcon(upload.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{upload.originalName}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>{formatFileSize(upload.fileSize)}</span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(upload.status)}
                              <span>{getStatusText(upload.status)}</span>
                            </div>
                            <span>{upload.createdAt ? new Date(upload.createdAt).toLocaleString('zh-CN') : '未知时间'}</span>
                          </div>
                          {upload.summary && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {upload.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {upload.status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}