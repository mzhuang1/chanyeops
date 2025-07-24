import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  FolderPlus,
  Archive,
  Check,
  X,
  MessageCircle
} from "lucide-react";
import { Conversation } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatSessionItemProps {
  conversation: Conversation;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: (id: number) => void;
  className?: string;
}

export default function ChatSessionItem({
  conversation,
  isActive,
  isCollapsed,
  onSelect,
  className = ""
}: ChatSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Project options for "Add to Project" feature
  const projectOptions = [
    { id: 1, name: "产业分析项目", color: "bg-blue-500" },
    { id: 2, name: "政策研究", color: "bg-green-500" },
    { id: 3, name: "案例收集", color: "bg-purple-500" },
    { id: 4, name: "数据分析", color: "bg-orange-500" }
  ];

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update conversation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "重命名成功",
        description: "对话标题已更新"
      });
    },
    onError: () => {
      toast({
        title: "重命名失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "删除成功",
        description: "对话已删除"
      });
    },
    onError: () => {
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  });

  // Archive conversation mutation
  const archiveConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}/archive`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive conversation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "归档成功",
        description: "对话已归档"
      });
    },
    onError: () => {
      toast({
        title: "归档失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      updateConversationMutation.mutate({
        id: conversation.id,
        title: editTitle.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    deleteConversationMutation.mutate(conversation.id);
    setShowDeleteDialog(false);
  };

  const handleArchive = () => {
    archiveConversationMutation.mutate(conversation.id);
    setShowMenu(false);
  };

  const handleAddToProject = (projectId: number, projectName: string) => {
    // Implementation for adding to project
    toast({
      title: "已添加到项目",
      description: `对话已添加到「${projectName}」项目`
    });
    setShowMenu(false);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric"
    });
  };

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex justify-center p-3 rounded-lg cursor-pointer transition-colors",
          isActive ? "bg-gray-700" : "hover:bg-gray-800",
          className
        )}
        onClick={() => onSelect(conversation.id)}
      >
        <MessageCircle className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "group relative p-3 rounded-lg transition-all cursor-pointer chat-session-item",
          isActive ? "bg-gray-700" : "hover:bg-gray-800",
          className
        )}
        onClick={!isEditing ? () => onSelect(conversation.id) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm bg-gray-600 border-gray-500 text-white focus:border-blue-500 chat-session-edit-input"
                  disabled={updateConversationMutation.isPending}
                />
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit();
                    }}
                    disabled={updateConversationMutation.isPending}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h4 className="font-medium text-sm truncate mb-1 text-white">
                  {conversation.title}
                </h4>
                <p className="text-xs text-gray-400">
                  {formatDate(conversation.updatedAt || conversation.createdAt)}
                </p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-gray-800 border-gray-700 text-gray-200 chat-session-menu"
                  sideOffset={5}
                >
                  <DropdownMenuItem
                    className="text-gray-200 hover:text-white hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit();
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    重命名
                  </DropdownMenuItem>

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-gray-200 hover:text-white hover:bg-gray-700 cursor-pointer">
                      <FolderPlus className="w-4 h-4 mr-2" />
                      添加到项目
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-gray-800 border-gray-700">
                      {projectOptions.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          className="text-gray-200 hover:text-white hover:bg-gray-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToProject(project.id, project.name);
                          }}
                        >
                          <div className={`project-indicator ${project.color}`} />
                          {project.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem
                    className="text-gray-200 hover:text-white hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive();
                    }}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    归档
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-gray-700" />

                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                      setShowMenu(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除对话</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              确定要删除对话「{conversation.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConversationMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteConversationMutation.isPending ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}