import React, { useState, useEffect } from 'react';
import { AuthService, User, UserRole, UserStatus } from '../../services/AuthService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from "sonner@2.0.3";
import { Search, UserPlus, UserCog, Lock, Shield, UserX } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  
  // 获取用户列表
  const fetchUsers = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await AuthService.getUsers(page, pageSize);
      setUsers(response.users);
      setTotalUsers(response.total);
      setCurrentPage(page);
    } catch (error) {
      toast.error('获取用户列表失败');
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 首次加载获取用户列表
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // 处理页面变化
  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 在实际应用中，这里应该调用搜索API
    toast.info(`搜索用户: ${searchTerm}`);
  };
  
  // 处理角色变更
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    setIsLoading(true);
    try {
      await AuthService.updateUserRole(selectedUser.id, selectedRole as UserRole);
      toast.success(`已将 ${selectedUser.name} 的角色更改为 ${getRoleName(selectedRole as UserRole)}`);
      
      // 更新用户列表
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: selectedRole as UserRole }
          : user
      ));
    } catch (error) {
      toast.error('更改用户角色失败');
      console.error('Failed to update user role:', error);
    } finally {
      setIsLoading(false);
      setShowRoleDialog(false);
      setSelectedUser(null);
      setSelectedRole('');
    }
  };
  
  // 处理状态变更
  const handleStatusChange = async () => {
    if (!selectedUser || !selectedStatus) return;
    
    setIsLoading(true);
    try {
      await AuthService.updateUserStatus(selectedUser.id, selectedStatus as UserStatus);
      toast.success(`已将 ${selectedUser.name} 的状态更改为 ${getStatusName(selectedStatus as UserStatus)}`);
      
      // 更新用户列表
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, status: selectedStatus as UserStatus }
          : user
      ));
    } catch (error) {
      toast.error('更改用户状态失败');
      console.error('Failed to update user status:', error);
    } finally {
      setIsLoading(false);
      setShowStatusDialog(false);
      setSelectedUser(null);
      setSelectedStatus('');
    }
  };
  
  // 获取角色名称
  const getRoleName = (role: UserRole): string => {
    const roleNames: {[key in UserRole]: string} = {
      [UserRole.ADMIN]: '系统管理员',
      [UserRole.MANAGER]: '园区管理员',
      [UserRole.RESEARCHER]: '研究人员',
      [UserRole.USER]: '普通用户'
    };
    return roleNames[role];
  };
  
  // 获取状态名称
  const getStatusName = (status: UserStatus): string => {
    const statusNames: {[key in UserStatus]: string} = {
      [UserStatus.ACTIVE]: '正常',
      [UserStatus.INACTIVE]: '未激活',
      [UserStatus.PENDING]: '待审核',
      [UserStatus.LOCKED]: '已锁定'
    };
    return statusNames[status];
  };
  
  // 获取状态徽章变体
  const getStatusBadgeVariant = (status: UserStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case UserStatus.ACTIVE:
        return "default";
      case UserStatus.INACTIVE:
        return "secondary";
      case UserStatus.PENDING:
        return "outline";
      case UserStatus.LOCKED:
        return "destructive";
      default:
        return "outline";
    }
  };
  
  // 计算总页数
  const totalPages = Math.ceil(totalUsers / pageSize);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium">用户管理</h2>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          添加用户
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <form onSubmit={handleSearch} className="relative w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            <div className="flex items-center gap-2">
              <Label>显示:</Label>
              <Select value={pageSize.toString()} disabled>
                <SelectTrigger className="w-20">
                  <SelectValue>{pageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>电子邮箱</TableHead>
                  <TableHead>单位/组织</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <span className="mr-2 h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      没有找到用户
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organization || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {getRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {getStatusName(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AlertDialog open={showRoleDialog && selectedUser?.id === user.id} onOpenChange={setShowRoleDialog}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role);
                                  setShowRoleDialog(true);
                                }}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>更改用户角色</AlertDialogTitle>
                                <AlertDialogDescription>
                                  为用户 <strong>{user.name}</strong> 选择新的角色：
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="py-4">
                                <Select 
                                  value={selectedRole} 
                                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择角色" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={UserRole.USER}>普通用户</SelectItem>
                                    <SelectItem value={UserRole.RESEARCHER}>研究人员</SelectItem>
                                    <SelectItem value={UserRole.MANAGER}>园区管理员</SelectItem>
                                    <SelectItem value={UserRole.ADMIN}>系统管理员</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRoleChange} disabled={isLoading}>
                                  {isLoading ? '处理中...' : '确认'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <AlertDialog open={showStatusDialog && selectedUser?.id === user.id} onOpenChange={setShowStatusDialog}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedStatus(user.status);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>更改用户状态</AlertDialogTitle>
                                <AlertDialogDescription>
                                  为用户 <strong>{user.name}</strong> 选择新的状态：
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="py-4">
                                <Select 
                                  value={selectedStatus} 
                                  onValueChange={(value) => setSelectedStatus(value as UserStatus)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={UserStatus.ACTIVE}>正常</SelectItem>
                                    <SelectItem value={UserStatus.INACTIVE}>未激活</SelectItem>
                                    <SelectItem value={UserStatus.PENDING}>待审核</SelectItem>
                                    <SelectItem value={UserStatus.LOCKED}>已锁定</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={handleStatusChange} disabled={isLoading}>
                                  {isLoading ? '处理中...' : '确认'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button variant="ghost" size="icon">
                            <Lock className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="ghost" size="icon">
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};