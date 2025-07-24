from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from agent.agent_executor import AgentExecutor
import asyncio

router = APIRouter()

# Initialize agent executor
agent_executor = AgentExecutor()

class ChatRequest(BaseModel):
    session_id: str
    user_input: str
    context: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    type: str
    metadata: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, Any]]] = None

class FileAnalysisRequest(BaseModel):
    session_id: str
    file_reference: str
    analysis_type: str = "comprehensive"
    
class BulkAnalysisRequest(BaseModel):
    session_id: str
    file_references: List[str]
    analysis_prompt: str

@router.post("/", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """与智能体进行对话"""
    try:
        result = await agent_executor.execute(request.user_input, request.session_id)
        
        if result.get("success"):
            return ChatResponse(
                session_id=request.session_id,
                response=result.get("result", ""),
                type=result.get("type", "general"),
                metadata=result.get("metadata"),
                sources=result.get("sources")
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "处理失败"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

@router.post("/analyze-file")
async def analyze_file(request: FileAnalysisRequest):
    """分析单个文件"""
    try:
        prompt = f"请对文件 {request.file_reference} 进行 {request.analysis_type} 分析"
        result = await agent_executor.execute(prompt, request.session_id)
        
        if result.get("success"):
            return {
                "session_id": request.session_id,
                "analysis": result.get("result"),
                "file_reference": request.file_reference,
                "analysis_type": request.analysis_type
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件分析失败: {str(e)}")

@router.post("/bulk-analysis")
async def bulk_analysis(request: BulkAnalysisRequest):
    """批量分析多个文件"""
    try:
        files_str = ", ".join(request.file_references)
        prompt = f"请分析以下文件：{files_str}。分析要求：{request.analysis_prompt}"
        
        result = await agent_executor.execute(prompt, request.session_id)
        
        if result.get("success"):
            return {
                "session_id": request.session_id,
                "analysis": result.get("result"),
                "file_count": len(request.file_references),
                "files_analyzed": request.file_references
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量分析失败: {str(e)}")

@router.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """获取会话历史"""
    # This would typically query a database
    # For now, return a placeholder
    return {
        "session_id": session_id,
        "history": [],
        "message": "Session history feature not yet implemented"
    }

@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """清除会话"""
    try:
        # Clear any session-specific data
        return {
            "session_id": session_id,
            "status": "cleared",
            "message": "会话已清除"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清除会话失败: {str(e)}")

@router.post("/generate-report")
async def generate_custom_report(
    topic: str,
    session_id: str,
    format: str = "html",
    template: Optional[str] = None
):
    """生成自定义报告"""
    try:
        prompt = f"生成关于 {topic} 的专业报告"
        if template:
            prompt += f"，使用模板：{template}"
            
        result = await agent_executor.execute(prompt, session_id)
        
        if result.get("success"):
            return {
                "session_id": session_id,
                "report_path": result.get("result"),
                "topic": topic,
                "format": format
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"报告生成失败: {str(e)}")

@router.post("/generate-chart")
async def generate_custom_chart(
    data_description: str,
    session_id: str,
    chart_type: str = "auto"
):
    """生成自定义图表"""
    try:
        prompt = f"为以下数据生成 {chart_type} 图表：{data_description}"
        result = await agent_executor.execute(prompt, session_id)
        
        if result.get("success"):
            return {
                "session_id": session_id,
                "chart_config": result.get("result"),
                "chart_type": chart_type
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图表生成失败: {str(e)}")