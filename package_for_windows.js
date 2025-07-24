const fs = require('fs');
const path = require('path');

// Configuration for Windows deployment
const windowsConfig = {
  scripts: {
    "start": "node server/index.js",
    "dev": "tsx server/index.ts",
    "build": "vite build",
    "build-server": "tsc server/index.ts --outDir dist/server --target es2020 --module commonjs",
    "windows-setup": "npm install && npm run build",
    "windows-start": "npm run build && npm start"
  },
  engines: {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
};

// Update package.json for Windows compatibility
function updatePackageJson() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add Windows-specific scripts
    packageJson.scripts = { ...packageJson.scripts, ...windowsConfig.scripts };
    packageJson.engines = windowsConfig.engines;
    
    // Ensure Windows compatibility for dependencies
    if (!packageJson.dependencies['cross-env']) {
      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies['cross-env'] = '^7.0.3';
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✓ package.json updated for Windows compatibility');
  }
}

// Create Windows-specific environment file
function createWindowsEnv() {
  const envContent = `# 产业集群发展潜力评估系统 - Windows 环境配置
# Industrial Cluster Assessment System - Windows Environment

# 应用模式
NODE_ENV=development

# 服务器端口 (默认5000)
PORT=5000

# 会话密钥 (生产环境请更改)
SESSION_SECRET=windows_local_secret_key_please_change_in_production

# 本地域名配置
REPLIT_DOMAINS=localhost:5000,127.0.0.1:5000
REPL_ID=windows_local_development

# OpenAI API 配置 (可选 - 启用AI功能需要)
# 获取API密钥: https://platform.openai.com/api-keys
# OPENAI_API_KEY=sk-your-openai-api-key-here

# 数据库配置 (当前使用内存数据库)
# 如需持久化数据，请配置PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost:5432/cluster_db

# 文件上传限制
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# 安全配置
CORS_ORIGIN=http://localhost:5000
COOKIE_SECURE=false
TRUST_PROXY=false

# 日志级别
LOG_LEVEL=info`;

  fs.writeFileSync('.env.windows', envContent);
  console.log('✓ Windows environment file created');
}

// Create installation guide
function createInstallGuide() {
  const guide = `# Windows 安装和运行指南

## 快速开始

1. **双击运行 start_app.bat**
   - 系统会自动检查环境
   - 安装依赖包
   - 启动应用程序

2. **手动安装步骤**

### 前置要求
- Windows 10/11 (64位)
- Node.js 18+ (从 https://nodejs.org 下载)

### 安装命令
\`\`\`cmd
# 1. 安装依赖
npm install

# 2. 启动应用 (开发模式)
npm run dev

# 或者构建后启动 (生产模式)
npm run windows-setup
npm run windows-start
\`\`\`

## 配置说明

### 环境变量
复制 \`.env.windows\` 为 \`.env\` 并根据需要修改：

\`\`\`env
# 基础配置
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_secret_here

# AI功能 (可选)
OPENAI_API_KEY=your_openai_key
\`\`\`

### 文件权限
确保以下文件夹有写入权限：
- \`uploads/\` - 文件上传存储
- \`dist/\` - 构建输出目录

## 访问应用

启动成功后，打开浏览器访问：
- http://localhost:5000

## 故障排除

### 端口占用
如果5000端口被占用，修改 \`.env\` 中的 \`PORT\` 值

### 依赖安装失败
1. 删除 \`node_modules\` 文件夹
2. 清除npm缓存: \`npm cache clean --force\`
3. 重新安装: \`npm install\`

### 权限问题
以管理员身份运行命令提示符

## 更新系统
\`\`\`cmd
git pull
npm install
npm run windows-start
\`\`\``;

  fs.writeFileSync('WINDOWS_INSTALL.md', guide);
  console.log('✓ Windows installation guide created');
}

// Main execution
console.log('配置 Windows 本地部署...');
console.log('Configuring Windows local deployment...');

try {
  updatePackageJson();
  createWindowsEnv();
  createInstallGuide();
  
  console.log('\n✅ Windows 部署配置完成!');
  console.log('✅ Windows deployment configuration completed!');
  console.log('\n下一步:');
  console.log('Next steps:');
  console.log('1. 运行 start_app.bat 启动应用');
  console.log('1. Run start_app.bat to start the application');
  console.log('2. 或手动执行: npm install && npm run dev');
  console.log('2. Or manually run: npm install && npm run dev');
  
} catch (error) {
  console.error('❌ 配置过程中出现错误:', error.message);
  console.error('❌ Error during configuration:', error.message);
}