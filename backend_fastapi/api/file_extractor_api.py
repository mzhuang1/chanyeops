from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.mcp_client import MCPClient
import tempfile
import os

router = APIRouter()

# Initialize MCP client for file extraction
mcp_client = MCPClient()

class FileExtractionRequest(BaseModel):
    file_url: str
    extraction_type: str = "text"
    session_id: str = "default"
    options: Optional[Dict[str, Any]] = None

class BatchExtractionRequest(BaseModel):
    file_urls: List[str]
    extraction_type: str = "text"
    session_id: str = "default"

@router.post("/extract-url")
async def extract_from_url(request: FileExtractionRequest):
    """从URL提取文件内容"""
    try:
        result = await mcp_client.extract_file(
            request.file_url, 
            request.extraction_type
        )
        
        return {
            "success": True,
            "file_url": request.file_url,
            "extraction_type": request.extraction_type,
            "result": result,
            "session_id": request.session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件提取失败: {str(e)}")

@router.post("/extract-upload")
async def extract_from_upload(
    file: UploadFile = File(...),
    extraction_type: str = "text",
    session_id: str = "default"
):
    """从上传的文件提取内容"""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract content using MCP
            result = await mcp_client.extract_file(
                temp_file_path,
                extraction_type
            )
            
            return {
                "success": True,
                "filename": file.filename,
                "file_size": len(content),
                "extraction_type": extraction_type,
                "result": result,
                "session_id": session_id
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传提取失败: {str(e)}")

@router.post("/extract-batch")
async def extract_batch(request: BatchExtractionRequest):
    """批量提取多个文件"""
    try:
        results = []
        errors = []
        
        for file_url in request.file_urls:
            try:
                result = await mcp_client.extract_file(
                    file_url,
                    request.extraction_type
                )
                results.append({
                    "file_url": file_url,
                    "success": True,
                    "result": result
                })
            except Exception as e:
                errors.append({
                    "file_url": file_url,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total_files": len(request.file_urls),
            "successful_extractions": len(results),
            "failed_extractions": len(errors),
            "results": results,
            "errors": errors,
            "session_id": request.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量提取失败: {str(e)}")

@router.get("/supported-formats")
async def get_supported_formats():
    """获取支持的文件格式"""
    return {
        "text_formats": [
            "txt", "md", "csv", "json", "xml", "html", 
            "py", "js", "ts", "java", "cpp", "c", "go", "rs"
        ],
        "document_formats": [
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"
        ],
        "image_formats": [
            "jpg", "jpeg", "png", "gif", "bmp", "tiff"
        ],
        "extraction_types": [
            "text", "metadata", "full", "structured", "images"
        ]
    }

@router.post("/analyze-extracted")
async def analyze_extracted_content(
    content: str,
    analysis_type: str = "summary",
    session_id: str = "default"
):
    """分析提取的内容"""
    try:
        # Use MCP for advanced analysis
        analysis_result = await mcp_client.query(
            f"请对以下内容进行{analysis_type}分析：\n\n{content[:2000]}",  # Limit content length
            context={"analysis_type": analysis_type, "content_length": len(content)}
        )
        
        return {
            "success": True,
            "analysis_type": analysis_type,
            "content_length": len(content),
            "analysis": analysis_result,
            "session_id": session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"内容分析失败: {str(e)}")

@router.get("/extraction-status/{session_id}")
async def get_extraction_status(session_id: str):
    """获取提取任务状态"""
    try:
        # Query session status from MCP
        context = await mcp_client.retrieve_context(f"extraction_status_{session_id}")
        
        if context:
            return {
                "session_id": session_id,
                "status": context.get("status", "unknown"),
                "progress": context.get("progress", 0),
                "results": context.get("results", [])
            }
        else:
            return {
                "session_id": session_id,
                "status": "not_found",
                "message": "会话未找到或已过期"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"状态查询失败: {str(e)}")

@router.delete("/sessions/{session_id}")
async def clear_extraction_session(session_id: str):
    """清除提取会话"""
    try:
        # Clear session data
        await mcp_client.store_context(
            f"extraction_status_{session_id}",
            {"status": "cleared", "timestamp": "cleared"}
        )
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "提取会话已清除"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"会话清除失败: {str(e)}")