import asyncio
import json
import os
from typing import Dict, Any, List, Optional
import httpx
from datetime import datetime

class MCPClient:
    """Model Context Protocol Client for document processing and knowledge management"""
    
    def __init__(self):
        # Use the specific file-extractor MCP server
        self.mcp_server_url = os.getenv("MCP_SERVER_URL", "https://server.smithery.ai/@dravidsajinraj-iex/file-extractor-mcp/mcp")
        self.api_key = os.getenv("MCP_API_KEY", "6a270c05-42b5-4572-9116-05b7f75a42f6")
        self.profile = os.getenv("MCP_PROFILE", "itchy-silverfish-GpwjDM")
        self.session_id = None
        self.context_store = {}

    async def initialize_session(self) -> str:
        """初始化MCP会话"""
        headers = self._get_headers()
        
        # Add profile parameter for the specific MCP server
        params = {
            "api_key": self.api_key,
            "profile": self.profile
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/sessions",
                headers=headers,
                params=params,
                json={"client_info": {"name": "产业集群智能体", "version": "1.0.0"}}
            )
            response.raise_for_status()
            
            data = response.json()
            self.session_id = data.get("session_id", "default_session")
            return self.session_id

    async def query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """使用MCP协议进行查询"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        # Add required parameters for this specific MCP server
        params = {
            "api_key": self.api_key,
            "profile": self.profile
        }
        
        payload = {
            "query": query,
            "session_id": self.session_id,
            "context": context or {},
            "options": {
                "include_sources": True,
                "max_results": 10,
                "temperature": 0.7
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/query",
                headers=headers,
                params=params,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    def query_sync(self, query: str) -> str:
        """同步版本的MCP查询"""
        try:
            loop = asyncio.get_event_loop()
            result = loop.run_until_complete(self.query(query))
            return json.dumps(result, ensure_ascii=False, indent=2)
        except RuntimeError:
            result = asyncio.run(self.query(query))
            return json.dumps(result, ensure_ascii=False, indent=2)

    async def extract_file(self, file_url_or_path: str, extraction_type: str = "text") -> Dict[str, Any]:
        """使用file-extractor MCP服务提取文件内容"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        params = {
            "api_key": self.api_key,
            "profile": self.profile
        }
        
        payload = {
            "file_source": file_url_or_path,
            "extraction_type": extraction_type,
            "session_id": self.session_id,
            "options": {
                "preserve_formatting": True,
                "extract_metadata": True,
                "include_images": False,
                "chunk_size": 1000
            }
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/extract",
                headers=headers,
                params=params,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def process_document(self, document_path: str, document_type: str = "auto") -> Dict[str, Any]:
        """处理文档并添加到知识库（使用file-extractor服务）"""
        try:
            # Use the file-extractor MCP service
            return await self.extract_file(document_path, document_type)
        except Exception as e:
            # Fallback to basic processing
            return {
                "success": False,
                "error": f"文档处理失败: {str(e)}",
                "document_path": document_path,
                "fallback_used": True
            }

    async def semantic_search(self, query: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """语义搜索"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        payload = {
            "query": query,
            "session_id": self.session_id,
            "filters": filters or {},
            "search_options": {
                "similarity_threshold": 0.7,
                "max_results": 20,
                "include_metadata": True,
                "rerank": True
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/api/search/semantic",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def get_document_insights(self, document_id: str) -> Dict[str, Any]:
        """获取文档洞察"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.mcp_server_url}/api/documents/{document_id}/insights",
                headers=headers,
                params={"session_id": self.session_id}
            )
            response.raise_for_status()
            return response.json()

    async def create_knowledge_graph(self, documents: List[str], topic: str) -> Dict[str, Any]:
        """创建知识图谱"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        payload = {
            "documents": documents,
            "topic": topic,
            "session_id": self.session_id,
            "graph_options": {
                "entity_types": ["PERSON", "ORGANIZATION", "LOCATION", "TECHNOLOGY", "CONCEPT"],
                "relationship_types": ["PART_OF", "RELATED_TO", "DEVELOPS", "LOCATED_IN"],
                "min_confidence": 0.8
            }
        }

        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/api/knowledge-graph/create",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def analyze_documents(self, document_ids: List[str], analysis_type: str = "comprehensive") -> Dict[str, Any]:
        """分析多个文档"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        payload = {
            "document_ids": document_ids,
            "analysis_type": analysis_type,
            "session_id": self.session_id,
            "analysis_options": {
                "extract_trends": True,
                "identify_gaps": True,
                "generate_recommendations": True,
                "cross_reference": True
            }
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/api/documents/analyze",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def get_context_summary(self, context_keys: List[str]) -> Dict[str, Any]:
        """获取上下文摘要"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        payload = {
            "context_keys": context_keys,
            "session_id": self.session_id,
            "summary_options": {
                "max_length": 500,
                "include_sources": True,
                "highlight_key_points": True
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/api/context/summary",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()

    async def store_context(self, key: str, data: Dict[str, Any]) -> bool:
        """存储上下文数据"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        payload = {
            "key": key,
            "data": data,
            "session_id": self.session_id,
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "source": "产业集群智能体"
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.mcp_server_url}/api/context/store",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            return response.json().get("success", False)

    async def retrieve_context(self, key: str) -> Optional[Dict[str, Any]]:
        """检索上下文数据"""
        if not self.session_id:
            await self.initialize_session()

        headers = self._get_headers()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.mcp_server_url}/api/context/{key}",
                headers=headers,
                params={"session_id": self.session_id}
            )
            
            if response.status_code == 404:
                return None
                
            response.raise_for_status()
            return response.json()

    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "产业集群智能体/1.0.0",
            "Accept": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["X-API-Key"] = self.api_key
            
        return headers

    async def health_check(self) -> Dict[str, Any]:
        """检查MCP服务器健康状态"""
        try:
            # Try basic connectivity test first
            params = {
                "api_key": self.api_key,
                "profile": self.profile
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Test the main URL for basic connectivity
                response = await client.get(self.mcp_server_url, params=params)
                return {
                    "status": "connected" if response.status_code in [200, 404, 405] else "error",
                    "server": self.mcp_server_url, 
                    "profile": self.profile,
                    "response_code": response.status_code
                }
        except Exception as e:
            return {"status": "connection_failed", "error": str(e), "server": self.mcp_server_url}

    async def close_session(self):
        """关闭MCP会话"""
        if self.session_id:
            headers = self._get_headers()
            
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.delete(
                        f"{self.mcp_server_url}/api/sessions/{self.session_id}",
                        headers=headers
                    )
            except Exception as e:
                print(f"Warning: Failed to close MCP session: {e}")
            
            self.session_id = None