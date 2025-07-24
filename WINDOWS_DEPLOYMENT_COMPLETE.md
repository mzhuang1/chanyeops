# Windows 10 本地部署包 - 完整转换文档

## 转换完成清单

✅ **核心文件创建**
- `start_app.bat` - 一键启动脚本
- `deploy_windows.bat` - 自动部署工具
- `LOCAL_SETUP_GUIDE.md` - 详细安装指南
- `README_WINDOWS.md` - Windows版本说明
- `package_for_windows.js` - 配置更新脚本

✅ **服务器优化**
- Windows进程信号处理
- 端口配置优化
- 本地主机绑定
- 优雅关闭机制

✅ **环境配置**
- 自动环境变量设置
- Windows路径兼容性
- 权限检查机制

## 使用方法

### 方法一：快速部署（推荐）
1. 双击运行 `deploy_windows.bat`
2. 脚本自动完成所有配置
3. 在桌面创建启动快捷方式
4. 双击快捷方式启动应用

### 方法二：手动安装
1. 确保安装 Node.js 18+
2. 双击 `start_app.bat`
3. 首次运行自动安装依赖
4. 浏览器访问 http://localhost:5000

## 系统特性

### 🔧 零配置启动
- 自动检测Node.js环境
- 自动安装项目依赖
- 自动创建必要目录
- 自动打开浏览器

### 🖥️ Windows优化
- 支持中文路径
- 进程优雅退出
- 端口冲突检测
- 权限自动处理

### 📁 本地存储
- 文件上传本地保存
- 对话历史持久化
- 无需外部数据库
- 支持离线运行

### 🔒 安全配置
- 本地数据处理
- 无远程依赖
- 隐私保护
- 可完全断网运行

## 功能保持完整

### ✅ 保留功能
- 智能对话系统
- 文件上传分析
- Excel图表生成
- 对话历史记录
- 用户会话管理
- 多语言支持
- 可视化图表
- 模板系统

### 🔄 适配优化
- Windows路径处理
- 中文编码支持
- 本地文件存储
- 端口配置灵活
- 进程管理优化

## 部署包结构

```
项目文件夹/
├── 🚀 start_app.bat              # 一键启动（主要入口）
├── 📦 deploy_windows.bat         # 自动部署工具
├── 📋 LOCAL_SETUP_GUIDE.md       # 详细安装说明
├── 📋 README_WINDOWS.md          # Windows版本文档
├── 📋 WINDOWS_DEPLOYMENT_COMPLETE.md # 转换完整文档
├── ⚙️ package_for_windows.js     # 配置脚本
├── 🌐 client/                    # 前端应用
├── 🖥️ server/                    # 后端服务
├── 🔧 shared/                    # 共享组件
├── 📄 package.json               # 项目配置
└── 📄 .env                       # 环境配置
```

## 系统要求

- **操作系统**: Windows 10/11 (64位)
- **Node.js**: 18.0+ (必需)
- **内存**: 4GB+ (推荐)
- **磁盘**: 2GB+ 可用空间
- **浏览器**: Chrome/Edge/Firefox 最新版

## 故障排除

### 常见问题
1. **端口5000被占用**
   - 修改 `.env` 文件中的 `PORT=5001`
   - 或关闭占用进程

2. **Node.js未安装**
   - 访问 https://nodejs.org 下载安装
   - 选择LTS版本

3. **权限不足**
   - 右键"以管理员身份运行"
   - 确保对文件夹有写入权限

4. **依赖安装失败**
   - 检查网络连接
   - 清除缓存：`npm cache clean --force`
   - 删除 node_modules 重新安装

### 网络配置
- **本地访问**: http://localhost:5000
- **局域网访问**: http://[本机IP]:5000
- **离线模式**: 除AI功能外完全支持

## 数据迁移

### 从在线版本迁移
1. 导出对话历史
2. 下载上传文件
3. 复制到本地 uploads 目录
4. 重启应用加载数据

### 备份建议
- 定期备份 uploads 文件夹
- 导出重要对话记录
- 保存环境配置文件

## 技术支持

### 日志查看
```cmd
# 启动时查看详细日志
npm run dev
```

### 重置系统
```cmd
# 删除缓存和数据
rmdir /s node_modules
rmdir /s uploads
npm install
```

### 更新系统
```cmd
# 下载最新代码
git pull origin main
npm install
```

---

**转换状态**: ✅ 完成  
**测试状态**: ✅ 通过  
**兼容性**: Windows 10/11  
**版本**: 1.0 Local Edition