# 产业集群发展潜力评估系统 - Windows 10 本地部署指南

## 系统要求

- Windows 10 (64位)
- Node.js 18+ 
- Git
- 至少 4GB 可用内存
- 至少 2GB 可用磁盘空间

## 安装步骤

### 1. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本 (推荐 18.x 或 20.x)
3. 运行安装程序，保持默认设置
4. 打开命令提示符(CMD)验证安装：
   ```cmd
   node --version
   npm --version
   ```

### 2. 安装 Git (可选)

1. 访问 [Git 官网](https://git-scm.com/download/win)
2. 下载并安装 Git for Windows
3. 安装时选择默认设置

### 3. 下载项目文件

#### 方法一：通过 Git (推荐)
```cmd
git clone [项目地址]
cd [项目文件夹]
```

#### 方法二：手动下载
1. 下载项目压缩包
2. 解压到本地文件夹
3. 打开命令提示符，导航到项目文件夹

### 4. 安装依赖包

在项目根目录执行：
```cmd
npm install
```

### 5. 环境配置

创建 `.env` 文件 (在项目根目录):
```env
# 数据库配置 (使用内存数据库，无需额外设置)
NODE_ENV=development

# OpenAI API 密钥 (可选 - 如需AI功能)
OPENAI_API_KEY=your_openai_api_key_here

# SerpAPI 密钥 (可选 - 如需联网搜索功能)
SERPAPI_API_KEY=your_serpapi_api_key_here

# 会话密钥 (必需)
SESSION_SECRET=your_super_secret_session_key_here

# 应用域名 (本地开发)
REPLIT_DOMAINS=localhost:5000
REPL_ID=local_development
```

### 6. 启动应用

```cmd
npm run dev
```

应用将在 `http://localhost:5000` 启动

## 使用说明

### 登录系统
1. 打开浏览器访问 `http://localhost:5000`
2. 点击"直接体验演示版"按钮
3. 无需注册，直接进入系统

### 主要功能
- **智能对话**: AI驱动的产业集群分析
- **文件上传**: 支持Excel、PDF、Word等格式
- **数据可视化**: 自动生成图表和分析报告
- **知识库管理**: 文档存储和检索
- **模板系统**: 预设分析模板

## 常见问题

### Q: 启动时出现端口占用错误
A: 修改 `server/index.ts` 中的端口号，或结束占用5000端口的进程

### Q: 无法访问AI功能
A: 在 `.env` 文件中配置有效的 `OPENAI_API_KEY`

### Q: 文件上传失败
A: 确保 `uploads` 文件夹存在且有写入权限

### Q: 页面显示异常
A: 清除浏览器缓存，或尝试隐私模式访问

## 开发模式

### 启动开发服务器
```cmd
npm run dev
```

### 构建生产版本
```cmd
npm run build
```

### 数据库迁移 (如使用PostgreSQL)
```cmd
npm run db:push
```

## 文件结构说明

```
项目根目录/
├── client/              # 前端源码
│   ├── src/
│   │   ├── components/  # UI组件
│   │   ├── pages/       # 页面组件
│   │   ├── hooks/       # React钩子
│   │   └── lib/         # 工具库
├── server/              # 后端源码
│   ├── index.ts         # 服务器入口
│   ├── routes.ts        # API路由
│   ├── storage.ts       # 数据存储
│   └── openai.ts        # AI服务
├── shared/              # 共享类型定义
├── uploads/             # 文件上传目录
├── package.json         # 项目配置
└── README.md           # 项目说明
```

## 性能优化建议

1. **内存使用**: 系统默认使用内存数据库，重启后数据会丢失
2. **文件清理**: 定期清理 `uploads` 文件夹中的临时文件
3. **浏览器兼容**: 推荐使用 Chrome 或 Edge 浏览器

## 安全注意事项

1. 不要在生产环境中使用默认的 SESSION_SECRET
2. 定期更新依赖包: `npm audit fix`
3. 限制文件上传大小和类型
4. 使用HTTPS (生产环境)

## 技术支持

如遇到问题，请检查：
1. Node.js 版本是否符合要求
2. 网络连接是否正常
3. 防火墙设置是否阻止了应用
4. 杀毒软件是否误报

## 更新说明

定期更新系统:
```cmd
git pull origin main
npm install
npm run dev
```

---
**版本**: 1.0.0  
**更新日期**: 2025年1月  
**技术栈**: React + TypeScript + Node.js + Express