import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Users,
  CheckCircle,
  FileText,
  Zap,
  Search,
  MoreVertical,
  UserPlus,
  Settings,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Globe
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="professional-card">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">访问受限</h3>
            <p className="text-muted-foreground">
              您需要管理员权限才能访问此页面
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for admin dashboard
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    generatedReports: 3456,
    apiCalls: 28900
  };

  const users = [
    {
      id: "1",
      name: "张三",
      email: "zhangsan@example.com",
      role: "研究人员",
      status: "活跃",
      lastLogin: "2024-06-07 14:30",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@example.com",
      role: "园区管理者",
      status: "活跃",
      lastLogin: "2024-06-07 11:20",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@example.com",
      role: "政府部门",
      status: "已禁用",
      lastLogin: "2024-06-05 16:45",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: "4",
      name: "赵六",
      email: "zhaoliu@example.com",
      role: "研究人员",
      status: "活跃",
      lastLogin: "2024-06-07 09:15",
      avatar: "/api/placeholder/32/32"
    }
  ];

  const systemSettings = [
    {
      key: "max_users",
      label: "最大用户数",
      value: "1000",
      description: "系统支持的最大用户数量"
    },
    {
      key: "api_rate_limit",
      label: "API 调用限制",
      value: "1000/小时",
      description: "每用户每小时API调用次数限制"
    },
    {
      key: "file_upload_limit",
      label: "文件上传限制",
      value: "100MB",
      description: "单个文件最大上传大小"
    },
    {
      key: "data_retention",
      label: "数据保留期",
      value: "365天",
      description: "用户数据保留天数"
    }
  ];

  const handleUserAction = (action: string, userId: string) => {
    toast({
      title: "操作执行",
      description: `正在${action}用户 ${userId}...`,
    });
  };

  const handleSystemSetting = (key: string) => {
    toast({
      title: "设置更新",
      description: `正在更新系统设置 ${key}...`,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "研究人员":
        return "bg-blue-100 text-blue-800";
      case "园区管理者":
        return "bg-green-100 text-green-800";
      case "政府部门":
        return "bg-purple-100 text-purple-800";
      case "管理员":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "活跃":
        return "bg-green-100 text-green-800";
      case "已禁用":
        return "bg-red-100 text-red-800";
      case "待审核":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-primary">系统管理</h1>
        <p className="heading-secondary">
          管理用户、系统配置和数据监控
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="data-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">总用户数</h3>
                <p className="data-metric-value text-2xl">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="data-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">活跃用户</h3>
                <p className="data-metric-value text-2xl">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="data-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">生成报告</h3>
                <p className="data-metric-value text-2xl">{stats.generatedReports.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="data-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">API调用</h3>
                <p className="data-metric-value text-2xl">{(stats.apiCalls / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="system">系统配置</TabsTrigger>
          <TabsTrigger value="monitoring">数据监控</TabsTrigger>
          <TabsTrigger value="settings">高级设置</TabsTrigger>
        </TabsList>

        {/* User Management */}
        <TabsContent value="users">
          <Card className="professional-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>用户管理</CardTitle>
                <Button className="btn-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加用户
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex space-x-2 ml-4">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="researcher">研究人员</SelectItem>
                      <SelectItem value="manager">园区管理者</SelectItem>
                      <SelectItem value="government">政府部门</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="disabled">已禁用</SelectItem>
                      <SelectItem value="pending">待审核</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction("编辑", user.id)}>
                              编辑用户
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction("重置密码", user.id)}>
                              重置密码
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleUserAction("禁用", user.id)}
                            >
                              禁用用户
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  系统设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemSettings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{setting.label}</h4>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {setting.value}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSystemSetting(setting.key)}
                      >
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  数据管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    数据库备份
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="w-4 h-4 mr-2" />
                    清理缓存
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    导出日志
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-destructive">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    重置系统
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Monitoring */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  实时监控
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="status-online"></div>
                      <span className="text-sm font-medium">系统状态</span>
                    </div>
                    <Badge variant="secondary" className="text-secondary">正常</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CPU 使用率</span>
                      <span className="font-semibold">23%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">内存使用率</span>
                      <span className="font-semibold">67%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">磁盘使用率</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">网络流量</span>
                      <span className="font-semibold">1.2 GB/s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="professional-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  性能指标
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="data-metric-card">
                      <div className="data-metric-value text-lg">2.3s</div>
                      <div className="data-metric-label">平均响应时间</div>
                    </div>
                    <div className="data-metric-card">
                      <div className="data-metric-value text-lg">99.9%</div>
                      <div className="data-metric-label">系统可用性</div>
                    </div>
                    <div className="data-metric-card">
                      <div className="data-metric-value text-lg">1.2K</div>
                      <div className="data-metric-label">并发用户</div>
                    </div>
                    <div className="data-metric-card">
                      <div className="data-metric-value text-lg">45/min</div>
                      <div className="data-metric-label">请求频率</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="settings">
          <Card className="professional-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                高级设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">安全设置</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">启用两步验证</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">强制密码复杂度</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">登录日志记录</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">系统配置</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">自动备份</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">错误报告</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">性能监控</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex space-x-4">
                    <Button className="btn-primary">保存设置</Button>
                    <Button variant="outline">重置默认</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
