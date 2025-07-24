import httpx
import aiofiles
import os
import asyncio
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import mimetypes
import json

class FileReader:
    def __init__(self):
        self.remote_servers = {
            "server1": {
                "base_url": "http://192.168.1.100:8080",
                "auth_token": os.getenv("REMOTE_SERVER_TOKEN"),
                "username": os.getenv("REMOTE_SERVER_USER"),
                "password": os.getenv("REMOTE_SERVER_PASS")
            },
            "server2": {
                "base_url": "http://another-server.com:3000",
                "auth_token": os.getenv("REMOTE_SERVER2_TOKEN"),
                "username": os.getenv("REMOTE_SERVER2_USER"),
                "password": os.getenv("REMOTE_SERVER2_PASS")
            }
        }

    async def read_remote_file(self, file_reference: str) -> str:
        """异步读取远程文件"""
        try:
            # Parse file reference (could be URL, server:path, or just filename)
            server_config, file_path = self._parse_file_reference(file_reference)
            
            if server_config:
                return await self._read_from_remote_server(server_config, file_path)
            else:
                # Try to read as direct URL
                return await self._read_from_url(file_reference)
                
        except Exception as e:
            raise Exception(f"读取远程文件失败: {str(e)}")

    def read_remote_file_sync(self, file_reference: str) -> str:
        """同步版本的远程文件读取"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.read_remote_file(file_reference))
        except RuntimeError:
            return asyncio.run(self.read_remote_file(file_reference))

    def _parse_file_reference(self, file_reference: str) -> tuple:
        """解析文件引用"""
        # Check if it's a server:path format
        if ":" in file_reference and not file_reference.startswith("http"):
            parts = file_reference.split(":", 1)
            server_name = parts[0]
            file_path = parts[1]
            
            if server_name in self.remote_servers:
                return self.remote_servers[server_name], file_path
        
        # Check if it's a direct URL
        if file_reference.startswith(("http://", "https://")):
            return None, file_reference
            
        # Default to server1 if no server specified
        return self.remote_servers["server1"], file_reference

    async def _read_from_remote_server(self, server_config: Dict[str, str], file_path: str) -> str:
        """从配置的远程服务器读取文件"""
        base_url = server_config["base_url"]
        auth_token = server_config.get("auth_token")
        username = server_config.get("username")
        password = server_config.get("password")

        headers = {}
        auth = None

        # Set up authentication
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"
        elif username and password:
            auth = (username, password)

        # Construct full URL
        if not file_path.startswith("/"):
            file_path = "/" + file_path
        url = f"{base_url}/api/files{file_path}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, auth=auth)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            
            if "application/json" in content_type:
                data = response.json()
                return json.dumps(data, ensure_ascii=False, indent=2)
            elif "text/" in content_type or "application/xml" in content_type:
                return response.text
            else:
                # For binary files, return base64 or description
                return f"[Binary file: {file_path}, Size: {len(response.content)} bytes, Type: {content_type}]"

    async def _read_from_url(self, url: str) -> str:
        """从URL直接读取文件"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "")
            
            if "application/json" in content_type:
                data = response.json()
                return json.dumps(data, ensure_ascii=False, indent=2)
            elif "text/" in content_type:
                return response.text
            else:
                return f"[Binary content from {url}, Size: {len(response.content)} bytes]"

    async def list_remote_files(self, server_name: str = "server1", directory: str = "/") -> Dict[str, Any]:
        """列出远程服务器的文件"""
        if server_name not in self.remote_servers:
            raise ValueError(f"未知的服务器: {server_name}")
            
        server_config = self.remote_servers[server_name]
        base_url = server_config["base_url"]
        auth_token = server_config.get("auth_token")

        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        url = f"{base_url}/api/files/list"
        params = {"path": directory}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    async def upload_to_remote(self, server_name: str, local_file_path: str, remote_path: str) -> Dict[str, Any]:
        """上传文件到远程服务器"""
        if server_name not in self.remote_servers:
            raise ValueError(f"未知的服务器: {server_name}")
            
        server_config = self.remote_servers[server_name]
        base_url = server_config["base_url"]
        auth_token = server_config.get("auth_token")

        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        url = f"{base_url}/api/files/upload"

        async with aiofiles.open(local_file_path, 'rb') as f:
            file_content = await f.read()
            
        files = {
            "file": (os.path.basename(local_file_path), file_content, mimetypes.guess_type(local_file_path)[0])
        }
        
        data = {"path": remote_path}

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, files=files, data=data)
            response.raise_for_status()
            return response.json()

    def get_server_status(self, server_name: str = "server1") -> Dict[str, Any]:
        """获取远程服务器状态"""
        if server_name not in self.remote_servers:
            return {"status": "error", "message": f"未知的服务器: {server_name}"}
            
        try:
            server_config = self.remote_servers[server_name]
            base_url = server_config["base_url"]
            
            # Try to ping the server
            with httpx.Client(timeout=10.0) as client:
                response = client.get(f"{base_url}/health")
                if response.status_code == 200:
                    return {"status": "online", "server": server_name, "url": base_url}
                else:
                    return {"status": "error", "server": server_name, "message": f"Server returned {response.status_code}"}
                    
        except Exception as e:
            return {"status": "offline", "server": server_name, "error": str(e)}

    async def search_files(self, server_name: str, query: str, file_types: list = None) -> Dict[str, Any]:
        """在远程服务器搜索文件"""
        if server_name not in self.remote_servers:
            raise ValueError(f"未知的服务器: {server_name}")
            
        server_config = self.remote_servers[server_name]
        base_url = server_config["base_url"]
        auth_token = server_config.get("auth_token")

        headers = {}
        if auth_token:
            headers["Authorization"] = f"Bearer {auth_token}"

        url = f"{base_url}/api/files/search"
        params = {"query": query}
        
        if file_types:
            params["types"] = ",".join(file_types)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()