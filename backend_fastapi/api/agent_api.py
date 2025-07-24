from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from agent.agent_executor import AgentExecutor
from services.file_reader import FileReader
from services.mcp_client import MCPClient

router = APIRouter()

# Initialize services
agent_executor = AgentExecutor()
file_reader = FileReader()
mcp_client = MCPClient()

class AgentRequest(BaseModel):
    user_input: str
    session_id: str = "default"
    context: Optional[Dict[str, Any]] = None

class FileProcessingRequest(BaseModel):
    server_name: str = "server1"
    file_path: str
    processing_type: str = "analysis"
    session_id: str = "default"

class MCPQueryRequest(BaseModel):
    query: str
    session_id: str = "default"
    context: Optional[Dict[str, Any]] = None

class DocumentAnalysisRequest(BaseModel):
    document_ids: List[str]
    analysis_type: str = "comprehensive"
    session_id: str = "default"

@router.post("/execute")
async def execute_agent(request: AgentRequest):
    """执行智能体任务"""
    try:
        result = await agent_executor.execute(request.user_input, request.session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

@router.post("/process-remote-file")
async def process_remote_file(request: FileProcessingRequest):
    """处理远程文件"""
    try:
        # Read file from remote server
        file_content = await file_reader.read_remote_file(f"{request.server_name}:{request.file_path}")
        
        # Process with MCP if available
        try:
            # First process document with MCP
            mcp_result = await mcp_client.process_document(
                document_path=request.file_path,
                document_type="auto"
            )
            
            # Then analyze with agent
            analysis_prompt = f"分析以下文件内容并提供{request.processing_type}：\n\n{file_content}"
            agent_result = await agent_executor.execute(analysis_prompt, request.session_id)
            
            return {
                "success": True,
                "file_path": request.file_path,
                "server": request.server_name,
                "mcp_processing": mcp_result,
                "agent_analysis": agent_result,
                "session_id": request.session_id
            }
            
        except Exception as mcp_error:
            # Fallback to agent-only processing
            analysis_prompt = f"分析以下文件内容并提供{request.processing_type}：\n\n{file_content}"
            agent_result = await agent_executor.execute(analysis_prompt, request.session_id)
            
            return {
                "success": True,
                "file_path": request.file_path,
                "server": request.server_name,
                "agent_analysis": agent_result,
                "mcp_error": str(mcp_error),
                "session_id": request.session_id
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件处理失败: {str(e)}")

@router.post("/mcp-query")
async def mcp_query(request: MCPQueryRequest):
    """使用MCP协议查询"""
    try:
        result = await mcp_client.query(request.query, request.context)
        return {
            "success": True,
            "query": request.query,
            "result": result,
            "session_id": request.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP查询失败: {str(e)}")

@router.post("/analyze-documents")
async def analyze_documents(request: DocumentAnalysisRequest):
    """分析多个文档"""
    try:
        # Use MCP for document analysis
        analysis_result = await mcp_client.analyze_documents(
            document_ids=request.document_ids,
            analysis_type=request.analysis_type
        )
        
        # Enhance with agent processing
        analysis_summary = analysis_result.get("summary", "")
        enhancement_prompt = f"请基于以下分析结果提供更深入的洞察和建议：\n\n{analysis_summary}"
        
        agent_enhancement = await agent_executor.execute(enhancement_prompt, request.session_id)
        
        return {
            "success": True,
            "document_ids": request.document_ids,
            "mcp_analysis": analysis_result,
            "agent_enhancement": agent_enhancement,
            "session_id": request.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档分析失败: {str(e)}")

@router.get("/servers/status")
async def get_servers_status():
    """获取所有远程服务器状态"""
    try:
        server_status = {}
        
        # Check configured servers
        for server_name in ["server1", "server2"]:
            status = file_reader.get_server_status(server_name)
            server_status[server_name] = status
        
        # Check MCP server
        mcp_status = await mcp_client.health_check()
        server_status["mcp_server"] = mcp_status
        
        return {
            "servers": server_status,
            "timestamp": "2025-01-27T12:00:00Z"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"状态检查失败: {str(e)}")

@router.get("/servers/{server_name}/files")
async def list_remote_files(server_name: str, directory: str = "/"):
    """列出远程服务器文件"""
    try:
        files = await file_reader.list_remote_files(server_name, directory)
        return {
            "server": server_name,
            "directory": directory,
            "files": files
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@router.post("/servers/{server_name}/search")
async def search_remote_files(
    server_name: str,
    query: str,
    file_types: Optional[List[str]] = None
):
    """搜索远程服务器文件"""
    try:
        results = await file_reader.search_files(server_name, query, file_types)
        return {
            "server": server_name,
            "query": query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件搜索失败: {str(e)}")

@router.post("/knowledge-graph")
async def create_knowledge_graph(
    documents: List[str],
    topic: str,
    session_id: str = "default"
):
    """创建知识图谱"""
    try:
        kg_result = await mcp_client.create_knowledge_graph(documents, topic)
        
        # Enhance with agent insights
        insight_prompt = f"基于知识图谱为主题'{topic}'提供深度分析和应用建议"
        agent_insights = await agent_executor.execute(insight_prompt, session_id)
        
        return {
            "success": True,
            "topic": topic,
            "knowledge_graph": kg_result,
            "agent_insights": agent_insights,
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"知识图谱创建失败: {str(e)}")

@router.post("/semantic-search")
async def semantic_search(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    session_id: str = "default"
):
    """语义搜索"""
    try:
        search_results = await mcp_client.semantic_search(query, filters)
        
        # Process results with agent
        results_summary = search_results.get("results", [])
        analysis_prompt = f"分析以下搜索结果并提供关键洞察：\n\n{results_summary}"
        
        agent_analysis = await agent_executor.execute(analysis_prompt, session_id)
        
        return {
            "success": True,
            "query": query,
            "search_results": search_results,
            "agent_analysis": agent_analysis,
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语义搜索失败: {str(e)}")