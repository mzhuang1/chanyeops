@echo off
chcp 65001 >nul
echo.
echo ===================================================
echo 产业集群发展潜力评估系统 - Windows 部署工具
echo Industrial Cluster Assessment System - Windows Deploy
echo ===================================================
echo.

set PROJECT_NAME=cluster-assessment-system
set DEPLOY_DIR=%USERPROFILE%\Desktop\%PROJECT_NAME%

echo [1/6] 检查部署环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo    请先安装 Node.js 18+ 版本
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 版本检查通过
node --version

echo.
echo [2/6] 创建部署目录...
if exist "%DEPLOY_DIR%" (
    echo ⚠️  目标目录已存在: %DEPLOY_DIR%
    set /p confirm="是否覆盖? (y/N): "
    if /i not "%confirm%"=="y" (
        echo 部署已取消
        pause
        exit /b 0
    )
    rmdir /s /q "%DEPLOY_DIR%"
)

mkdir "%DEPLOY_DIR%" 2>nul
echo ✓ 部署目录创建完成: %DEPLOY_DIR%

echo.
echo [3/6] 复制项目文件...
xcopy "client" "%DEPLOY_DIR%\client" /E /I /Q
xcopy "server" "%DEPLOY_DIR%\server" /E /I /Q
xcopy "shared" "%DEPLOY_DIR%\shared" /E /I /Q
copy "package.json" "%DEPLOY_DIR%\" >nul
copy "package-lock.json" "%DEPLOY_DIR%\" >nul 2>nul
copy "tsconfig.json" "%DEPLOY_DIR%\" >nul
copy "vite.config.ts" "%DEPLOY_DIR%\" >nul
copy "tailwind.config.ts" "%DEPLOY_DIR%\" >nul
copy "postcss.config.js" "%DEPLOY_DIR%\" >nul
copy "components.json" "%DEPLOY_DIR%\" >nul
copy "drizzle.config.ts" "%DEPLOY_DIR%\" >nul
copy "start_app.bat" "%DEPLOY_DIR%\" >nul
copy "LOCAL_SETUP_GUIDE.md" "%DEPLOY_DIR%\" >nul
copy "README_WINDOWS.md" "%DEPLOY_DIR%\" >nul

echo ✓ 项目文件复制完成

echo.
echo [4/6] 创建配置文件...
mkdir "%DEPLOY_DIR%\uploads" 2>nul

(
echo NODE_ENV=development
echo PORT=5000
echo SESSION_SECRET=windows_local_secret_change_in_production
echo REPLIT_DOMAINS=localhost:5000
echo REPL_ID=windows_local_development
echo # OPENAI_API_KEY=your_openai_api_key_here
) > "%DEPLOY_DIR%\.env"

echo ✓ 环境配置文件创建完成

echo.
echo [5/6] 安装项目依赖...
cd /d "%DEPLOY_DIR%"
echo 正在安装依赖包，请稍候...
npm install --production=false --no-audit >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败，尝试详细安装...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装仍然失败，请检查网络连接
        pause
        exit /b 1
    )
)
echo ✓ 依赖安装完成

echo.
echo [6/6] 创建桌面快捷方式...
set SHORTCUT_PATH=%USERPROFILE%\Desktop\启动产业集群评估系统.lnk
set VBS_FILE=%TEMP%\create_shortcut.vbs

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%SHORTCUT_PATH%"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo oLink.TargetPath = "%DEPLOY_DIR%\start_app.bat"
echo oLink.WorkingDirectory = "%DEPLOY_DIR%"
echo oLink.WindowStyle = 1
echo oLink.IconLocation = "shell32.dll,25"
echo oLink.Description = "产业集群发展潜力评估系统"
echo oLink.Save
) > "%VBS_FILE%"

cscript //nologo "%VBS_FILE%"
del "%VBS_FILE%" >nul 2>&1

if exist "%SHORTCUT_PATH%" (
    echo ✓ 桌面快捷方式创建完成
) else (
    echo ⚠️  快捷方式创建失败，请手动运行 start_app.bat
)

echo.
echo ===================================================
echo ✅ 部署完成!
echo ===================================================
echo.
echo 📁 部署位置: %DEPLOY_DIR%
echo 🚀 启动方式:
echo    1. 双击桌面快捷方式 "启动产业集群评估系统"
echo    2. 或运行: %DEPLOY_DIR%\start_app.bat
echo.
echo 🌐 访问地址: http://localhost:5000
echo 📖 使用文档: README_WINDOWS.md
echo.
echo 💡 提示:
echo    - 首次启动可能需要几秒钟
echo    - 确保5000端口未被占用
echo    - 如需AI功能，请配置OPENAI_API_KEY
echo.
set /p start_now="是否立即启动应用? (Y/n): "
if /i not "%start_now%"=="n" (
    echo.
    echo 🚀 正在启动应用...
    cd /d "%DEPLOY_DIR%"
    start "" "%DEPLOY_DIR%\start_app.bat"
)

echo.
echo 部署工具执行完成，按任意键退出...
pause >nul