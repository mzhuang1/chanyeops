#!/usr/bin/env python3
"""
启动脚本：同时运行Node.js前端和FastAPI后端
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path

class ServerManager:
    def __init__(self):
        self.processes = []
        self.root_dir = Path(__file__).parent

    def start_nodejs_server(self):
        """启动Node.js服务器"""
        print("🚀 Starting Node.js server...")
        try:
            process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=self.root_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes.append(("Node.js", process))
            print("✅ Node.js server started on port 5000")
            return process
        except Exception as e:
            print(f"❌ Failed to start Node.js server: {e}")
            return None

    def start_fastapi_server(self):
        """启动FastAPI服务器"""
        print("🚀 Starting FastAPI server...")
        try:
            fastapi_dir = self.root_dir / "backend_fastapi"
            
            # Check if virtual environment exists
            venv_path = fastapi_dir / "venv"
            if venv_path.exists():
                if os.name == 'nt':  # Windows
                    python_path = venv_path / "Scripts" / "python"
                else:  # Unix/Linux/macOS
                    python_path = venv_path / "bin" / "python"
            else:
                python_path = "python"
            
            process = subprocess.Popen(
                [str(python_path), "start_fastapi.py"],
                cwd=fastapi_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes.append(("FastAPI", process))
            print("✅ FastAPI server started on port 8000")
            return process
        except Exception as e:
            print(f"❌ Failed to start FastAPI server: {e}")
            print("💡 Try running: cd backend_fastapi && python start_fastapi.py")
            return None

    def check_processes(self):
        """检查进程状态"""
        for name, process in self.processes:
            if process.poll() is not None:
                print(f"⚠️  {name} server has stopped")
                return False
        return True

    def stop_all(self):
        """停止所有服务器"""
        print("\n🛑 Stopping all servers...")
        for name, process in self.processes:
            try:
                print(f"Stopping {name} server...")
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"Force killing {name} server...")
                process.kill()
            except Exception as e:
                print(f"Error stopping {name} server: {e}")
        
        self.processes.clear()
        print("✅ All servers stopped")

    def run(self):
        """运行服务器管理器"""
        print("🎯 产业集群智能体 - 双服务器启动器")
        print("=" * 50)
        
        # Handle Ctrl+C gracefully
        def signal_handler(sig, frame):
            self.stop_all()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start servers
        nodejs_process = self.start_nodejs_server()
        time.sleep(2)  # Wait a bit before starting FastAPI
        
        fastapi_process = self.start_fastapi_server()
        
        if not nodejs_process:
            print("❌ Failed to start Node.js server")
            return
        
        print("\n" + "=" * 50)
        print("🌟 All servers are running!")
        print("📍 Frontend: http://localhost:5000")
        print("📍 FastAPI Backend: http://localhost:8000")
        print("📖 FastAPI Docs: http://localhost:8000/docs")
        print("🔗 Integrated System: Both services working together")
        print("\nPress Ctrl+C to stop all servers")
        print("=" * 50 + "\n")
        
        # Monitor processes
        try:
            while True:
                if not self.check_processes():
                    break
                time.sleep(5)
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_all()

def main():
    """主函数"""
    # Check Node.js dependencies
    if not (Path(__file__).parent / "node_modules").exists():
        print("⚠️  Node.js dependencies not found. Running npm install...")
        try:
            subprocess.run(["npm", "install"], check=True)
            print("✅ Node.js dependencies installed")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Node.js dependencies")
            print("💡 Please run: npm install")
            return
    
    # Check FastAPI setup
    fastapi_dir = Path(__file__).parent / "backend_fastapi"
    if not fastapi_dir.exists():
        print("❌ FastAPI backend directory not found")
        print("💡 Please ensure backend_fastapi directory exists")
        return
    
    # Start server manager
    manager = ServerManager()
    manager.run()

if __name__ == "__main__":
    main()