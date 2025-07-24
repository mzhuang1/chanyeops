#!/usr/bin/env python3
"""
FastAPI Backend Startup Script for 产业集群智能体
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_requirements():
    """检查并安装依赖"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    try:
        # Check if virtual environment exists
        venv_path = Path(__file__).parent / "venv"
        if not venv_path.exists():
            print("📦 Creating virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", str(venv_path)], check=True)
        
        # Activate virtual environment and install requirements
        if os.name == 'nt':  # Windows
            pip_path = venv_path / "Scripts" / "pip"
            python_path = venv_path / "Scripts" / "python"
        else:  # Unix/Linux/macOS
            pip_path = venv_path / "bin" / "pip"
            python_path = venv_path / "bin" / "python"
        
        print("📦 Installing dependencies...")
        subprocess.run([str(pip_path), "install", "-r", str(requirements_file)], check=True)
        print("✅ Dependencies installed successfully")
        
        return str(python_path)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_environment():
    """设置环境变量"""
    env_vars = {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "MCP_SERVER_URL": "http://localhost:9000",
        "REMOTE_SERVER_TOKEN": "your_remote_server_token",
        "REMOTE_SERVER_USER": "username",
        "REMOTE_SERVER_PASS": "password"
    }
    
    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print("🔧 Creating .env file...")
        with open(env_file, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        print("⚠️  Please update .env file with your actual API keys and server configurations")
    
    # Load environment variables
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

def start_server(python_path):
    """启动FastAPI服务器"""
    print("🚀 Starting FastAPI backend server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔗 Node.js Frontend: http://localhost:5000")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        os.chdir(Path(__file__).parent)
        subprocess.run([
            python_path, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload",
            "--log-level", "info"
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")

def main():
    """主函数"""
    print("🎯 产业集群智能体 FastAPI Backend")
    print("=" * 50)
    
    # Check and install requirements
    python_path = check_requirements()
    if not python_path:
        print("❌ Failed to setup environment")
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Create output directories
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("temp_uploads", exist_ok=True)
    
    # Start server
    start_server(python_path)

if __name__ == "__main__":
    main()