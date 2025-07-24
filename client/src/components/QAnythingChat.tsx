import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, MessageCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QAnythingDocument {
  id: number;
  originalName: string;
  fileId: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
  summary?: string;
}

interface QAnythingChatProps {
  onChatWithDocument: (fileId: string, fileName: string) => void;
}

export const QAnythingChat: React.FC<QAnythingChatProps> = ({ onChatWithDocument }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch QAnything documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/qanything/documents'],
    refetchInterval: 5000, // Refresh every 5 seconds to check processing status
  });

  // Upload file to QAnything
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/qanything/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '文档上传失败');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/qanything/documents'] });
      setSelectedFile(null);
      toast({
        title: "上传成功",
        description: "文档正在处理中，请稍后查看状态",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "上传失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />已就绪</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />处理失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            文档上传
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
                className="flex-1"
              />
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="min-w-20"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "上传"
                )}
              </Button>
            </div>
            {selectedFile && (
              <div className="text-sm text-gray-600">
                已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            已上传文档
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无已上传的文档
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: QAnythingDocument) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{doc.originalName}</h4>
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {doc.summary && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.summary}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    {doc.status === 'ready' ? (
                      <Button
                        size="sm"
                        onClick={() => onChatWithDocument(doc.fileId, doc.originalName)}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        问答
                      </Button>
                    ) : (
                      <Button size="sm" disabled variant="outline">
                        {doc.status === 'processing' ? '处理中...' : '不可用'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};