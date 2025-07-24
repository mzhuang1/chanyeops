# 产业集群发展潜力评估系统 - Windows 本地版本

## 快速启动

1. **一键启动**: 双击 `start_app.bat` 文件
2. **浏览器访问**: http://localhost:5000
3. **登录**: 点击"直接体验演示版"

## 系统特性

- **零配置启动**: 自动检测环境和安装依赖
- **离线运行**: 无需互联网连接（除AI功能外）
- **数据持久化**: 支持本地文件存储
- **多格式支持**: Excel、PDF、Word、CSV文件分析
- **可视化图表**: 自动生成产业集群分析图表

## 目录结构

```
项目文件夹/
├── start_app.bat           # Windows启动脚本
├── LOCAL_SETUP_GUIDE.md    # 详细安装指南
├── client/                 # 前端界面
├── server/                 # 后端服务
├── uploads/                # 文件上传存储
├── .env                    # 环境配置
└── package.json            # 项目依赖
```

## 功能模块

### 1. 智能对话系统
- AI驱动的产业分析对话
- 支持中英文交互
- 上下文记忆功能

### 2. 文件分析引擎
- Excel数据自动分析
- PDF文档内容提取
- Word文件结构化解析
- 图表自动生成

### 3. 知识库管理
- 文档上传和存储
- 智能检索功能
- 内容分类管理

### 4. 可视化报表
- 产业结构饼图
- 发展趋势折线图
- 对比分析柱状图
- 交互式图表展示

## 配置选项

### 基础配置 (.env文件)
```env
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_secret_key
```

### AI功能配置
```env
OPENAI_API_KEY=your_openai_key
```

### 高级配置
```env
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
LOG_LEVEL=info
```

## 常见问题解决

### 端口占用
```cmd
netstat -ano | findstr :5000
taskkill /PID [进程ID] /F
```

### 权限问题
以管理员身份运行 `start_app.bat`

### 依赖安装失败
```cmd
npm cache clean --force
rmdir /s node_modules
npm install
```

### 浏览器兼容性
推荐使用：
- Chrome 90+
- Edge 90+
- Firefox 88+

## 性能优化

### 内存使用
- 建议系统内存 4GB+
- 关闭不必要的后台程序

### 磁盘空间
- 预留 2GB+ 可用空间
- 定期清理上传文件

### 网络配置
- 本地运行无需网络
- AI功能需要网络连接

## 数据安全

### 本地存储
- 所有数据存储在本地
- 无远程数据传输（除AI功能）
- 支持数据备份

### 隐私保护
- 文件仅在本地处理
- 无用户信息收集
- 可完全离线使用

## 更新维护

### 检查更新
```cmd
git pull origin main
npm install
```

### 备份数据
```cmd
xcopy uploads backup_uploads /E /I
```

### 重置系统
```cmd
rmdir /s node_modules uploads
npm install
```

## 技术规格

- **前端**: React 18 + TypeScript
- **后端**: Node.js + Express
- **数据库**: 内存存储（可扩展PostgreSQL）
- **AI引擎**: OpenAI GPT-4
- **图表库**: Recharts
- **文件处理**: 多格式解析引擎

## 联系支持

如遇到技术问题：
1. 检查错误日志
2. 确认系统要求
3. 尝试重启应用
4. 查看详细文档

---
**版本**: 1.0 Windows Edition  
**兼容**: Windows 10/11 (64位)  
**更新**: 2025年1月