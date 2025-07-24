@echo off
echo =====================================
echo 产业集群发展潜力评估系统
echo Industrial Cluster Assessment System
echo =====================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装，请先安装 Node.js 18+ 版本
    echo [Error] Node.js not found. Please install Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: Display Node.js version
echo [信息] 检测到 Node.js 版本:
node --version

:: Check if package.json exists
if not exist "package.json" (
    echo [错误] 未找到 package.json 文件，请确保在项目根目录执行
    echo [Error] package.json not found. Please run from project root directory
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖包...
    echo [Info] First run, installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        echo [Error] Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Create uploads directory if it doesn't exist
if not exist "uploads" (
    echo [信息] 创建上传文件夹...
    mkdir uploads
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo [信息] 创建环境配置文件...
    echo NODE_ENV=development > .env
    echo SESSION_SECRET=local_development_secret_key_change_in_production >> .env
    echo REPLIT_DOMAINS=localhost:5000 >> .env
    echo REPL_ID=local_development >> .env
    echo # OPENAI_API_KEY=your_openai_api_key_here >> .env
)

echo.
echo [信息] 启动应用程序...
echo [Info] Starting application...
echo.
echo 应用将在浏览器中自动打开: http://localhost:5000
echo Application will open in browser: http://localhost:5000
echo.
echo 按 Ctrl+C 停止服务器
echo Press Ctrl+C to stop the server
echo.

:: Wait a moment then open browser
start "" timeout /t 3 /nobreak >nul
start "" http://localhost:5000

:: Start the application
npm run dev

pause