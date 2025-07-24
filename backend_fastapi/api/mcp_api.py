from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.mcp_client import MCPClient
import json
import os

router = APIRouter()

# Initialize MCP client
mcp_client = MCPClient()

class MCPRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None
    session_id: str = "default"

class DocumentProcessRequest(BaseModel):
    document_path: str
    document_type: str = "auto"
    session_id: str = "default"

class ContextStoreRequest(BaseModel):
    key: str
    data: Dict[str, Any]
    session_id: str = "default"

class KnowledgeGraphRequest(BaseModel):
    documents: List[str]
    topic: str
    session_id: str = "default"

@router.post("/query")
async def mcp_query(request: MCPRequest):
    """MCP查询接口"""
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

@router.post("/documents/process")
async def process_document(request: DocumentProcessRequest):
    """处理文档"""
    try:
        result = await mcp_client.process_document(request.document_path, request.document_type)
        return {
            "success": True,
            "document_path": request.document_path,
            "result": result,
            "session_id": request.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档处理失败: {str(e)}")

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = "default"
):
    """上传并处理文档"""
    try:
        # Save uploaded file temporarily
        upload_dir = "temp_uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process with MCP
        result = await mcp_client.process_document(file_path)
        
        # Clean up temporary file
        os.remove(file_path)
        
        return {
            "success": True,
            "filename": file.filename,
            "result": result,
            "session_id": session_id
        }
        
    except Exception as e:
        # Clean up on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"文档上传处理失败: {str(e)}")

@router.post("/search/semantic")
async def semantic_search(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    session_id: str = "default"
):
    """语义搜索"""
    try:
        result = await mcp_client.semantic_search(query, filters)
        return {
            "success": True,
            "query": query,
            "result": result,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"语义搜索失败: {str(e)}")

@router.get("/documents/{document_id}/insights")
async def get_document_insights(document_id: str, session_id: str = "default"):
    """获取文档洞察"""
    try:
        result = await mcp_client.get_document_insights(document_id)
        return {
            "success": True,
            "document_id": document_id,
            "insights": result,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文档洞察失败: {str(e)}")

@router.post("/knowledge-graph/create")
async def create_knowledge_graph(request: KnowledgeGraphRequest):
    """创建知识图谱"""
    try:
        result = await mcp_client.create_knowledge_graph(request.documents, request.topic)
        return {
            "success": True,
            "topic": request.topic,
            "documents": request.documents,
            "knowledge_graph": result,
            "session_id": request.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"知识图谱创建失败: {str(e)}")

@router.post("/documents/analyze")
async def analyze_documents(
    document_ids: List[str],
    analysis_type: str = "comprehensive",
    session_id: str = "default"
):
    """分析文档"""
    try:
        result = await mcp_client.analyze_documents(document_ids, analysis_type)
        return {
            "success": True,
            "document_ids": document_ids,
            "analysis_type": analysis_type,
            "result": result,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文档分析失败: {str(e)}")

@router.post("/context/store")
async def store_context(request: ContextStoreRequest):
    """存储上下文"""
    try:
        success = await mcp_client.store_context(request.key, request.data)
        return {
            "success": success,
            "key": request.key,
            "session_id": request.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上下文存储失败: {str(e)}")

@router.get("/context/{key}")
async def retrieve_context(key: str, session_id: str = "default"):
    """检索上下文"""
    try:
        result = await mcp_client.retrieve_context(key)
        if result is None:
            raise HTTPException(status_code=404, detail="上下文未找到")
        
        return {
            "success": True,
            "key": key,
            "data": result,
            "session_id": session_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上下文检索失败: {str(e)}")

@router.post("/context/summary")
async def get_context_summary(
    context_keys: List[str],
    session_id: str = "default"
):
    """获取上下文摘要"""
    try:
        result = await mcp_client.get_context_summary(context_keys)
        return {
            "success": True,
            "context_keys": context_keys,
            "summary": result,
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上下文摘要生成失败: {str(e)}")

@router.get("/health")
async def health_check():
    """健康检查"""
    try:
        result = await mcp_client.health_check()
        return result
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@router.post("/sessions/initialize")
async def initialize_session(client_info: Optional[Dict[str, Any]] = None):
    """初始化MCP会话"""
    try:
        session_id = await mcp_client.initialize_session()
        return {
            "success": True,
            "session_id": session_id,
            "client_info": client_info or {"name": "产业集群智能体", "version": "1.0.0"}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"会话初始化失败: {str(e)}")

@router.delete("/sessions/{session_id}")
async def close_session(session_id: str):
    """关闭MCP会话"""
    try:
        await mcp_client.close_session()
        return {
            "success": True,
            "session_id": session_id,
            "message": "会话已关闭"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"会话关闭失败: {str(e)}")