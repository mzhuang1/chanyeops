import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Separator } from "../ui/separator";

// Mock data for indicators
const indicators = [
  { id: 1, name: "创新能力", weight: 0.2, description: "包含专利数量、研发投入等指标" },
  { id: 2, name: "人才资源", weight: 0.15, description: "高级人才数量、人才结构等" },
  { id: 3, name: "政策支持", weight: 0.15, description: "产业政策完善度、扶持力度等" },
  { id: 4, name: "基础设施", weight: 0.1, description: "园区配套、物流设施等" },
  { id: 5, name: "市场环境", weight: 0.2, description: "市场容量、增长率等" },
  { id: 6, name: "融资环境", weight: 0.1, description: "风投活跃度、融资难度等" },
  { id: 7, name: "产业链完善度", weight: 0.1, description: "上下游配套、集聚程度等" },
];

// Mock data for users
const users = [
  { id: 1, name: "张三", role: "管理员", department: "研究部", lastLogin: "2025-05-30" },
  { id: 2, name: "李四", role: "分析师", department: "研究部", lastLogin: "2025-05-29" },
  { id: 3, name: "王五", role: "普通用户", department: "产业发展处", lastLogin: "2025-05-28" },
  { id: 4, name: "赵六", role: "普通用户", department: "政策规划处", lastLogin: "2025-05-25" },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("indicators");

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">系统管理</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="indicators">指标管理</TabsTrigger>
          <TabsTrigger value="model">模型参数</TabsTrigger>
          <TabsTrigger value="templates">报表模板</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>评估指标体系</CardTitle>
              <CardDescription>
                管理产业集群潜力评估的指标体系和权重设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between">
                <Button size="sm" className="gap-1">
                  <PlusIcon className="h-4 w-4" />
                  添加指标
                </Button>
                <Button variant="outline" size="sm">
                  导出指标体系
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>序号</TableHead>
                    <TableHead>指标名称</TableHead>
                    <TableHead>权重</TableHead>
                    <TableHead>说明</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicators.map((indicator) => (
                    <TableRow key={indicator.id}>
                      <TableCell>{indicator.id}</TableCell>
                      <TableCell>{indicator.name}</TableCell>
                      <TableCell>{indicator.weight}</TableCell>
                      <TableCell>{indicator.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>模型参数设置</CardTitle>
              <CardDescription>
                配置评估模型的算法参数和计算方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">评估算法</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="model-ahp"
                      name="model-type"
                      defaultChecked
                    />
                    <label htmlFor="model-ahp">层次分析法 (AHP)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="model-entropy"
                      name="model-type"
                    />
                    <label htmlFor="model-entropy">熵值法</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="model-topsis"
                      name="model-type"
                    />
                    <label htmlFor="model-topsis">TOPSIS法</label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">数据处理</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="data-normalization"
                      defaultChecked
                    />
                    <label htmlFor="data-normalization">数据标准化</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="data-outlier"
                      defaultChecked
                    />
                    <label htmlFor="data-outlier">异常值处理</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="data-missing"
                      defaultChecked
                    />
                    <label htmlFor="data-missing">缺失值处理</label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">预测模型参数</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="forecast-years">预测年限</label>
                    <Input id="forecast-years" type="number" defaultValue={3} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confidence-level">置信水平</label>
                    <Input id="confidence-level" type="number" defaultValue={0.95} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="iteration-count">迭代次数</label>
                    <Input id="iteration-count" type="number" defaultValue={1000} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">重置默认值</Button>
                <Button>保存设置</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>报表模板管理</CardTitle>
              <CardDescription>
                上传和管理评估报告的Word模板
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="border-dashed border-2 p-6 flex flex-col items-center justify-center gap-2">
                  <UploadIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-center text-muted-foreground">
                    点击上传新模板<br />
                    支持 .docx 格式
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    上传模板
                  </Button>
                </Card>
                
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">标准评估报告</div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    包含完整评估指标和图表的标准报告模板
                  </p>
                  <div className="text-xs text-muted-foreground">
                    上传于: 2025-05-20
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">简版报告</div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    专为政策简报设计的精简版报告模板
                  </p>
                  <div className="text-xs text-muted-foreground">
                    上传于: 2025-05-15
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户权限管理</CardTitle>
              <CardDescription>
                管理系统用户及其访问权限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between">
                <Button size="sm" className="gap-1">
                  <PlusIcon className="h-4 w-4" />
                  添加用户
                </Button>
                <Input className="max-w-xs" placeholder="搜索用户..." />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}