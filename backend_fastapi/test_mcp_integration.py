#!/usr/bin/env python3
"""
测试MCP服务器集成脚本
"""

import asyncio
import aiohttp
import json
from services.mcp_client import MCPClient

async def test_mcp_connection():
    """测试MCP服务器连接"""
    print("🔍 测试MCP文件提取服务器连接...")
    
    mcp_client = MCPClient()
    
    # Test health check
    print("1. 健康检查...")
    health_result = await mcp_client.health_check()
    print(f"   状态: {health_result.get('status')}")
    print(f"   服务器: {health_result.get('server')}")
    if health_result.get('error'):
        print(f"   错误: {health_result.get('error')}")
    
    # Test session initialization
    print("\n2. 初始化会话...")
    try:
        session_id = await mcp_client.initialize_session()
        print(f"   会话ID: {session_id}")
    except Exception as e:
        print(f"   会话初始化失败: {e}")
        return
    
    # Test file extraction (with a sample URL)
    print("\n3. 测试文件提取...")
    try:
        # Test with a simple text file
        test_url = "https://raw.githubusercontent.com/octocat/Hello-World/master/README"
        extraction_result = await mcp_client.extract_file(test_url, "text")
        print(f"   提取成功: {extraction_result.get('success', False)}")
        if extraction_result.get('content'):
            content = extraction_result['content'][:200] + "..." if len(extraction_result.get('content', '')) > 200 else extraction_result.get('content', '')
            print(f"   内容预览: {content}")
    except Exception as e:
        print(f"   文件提取失败: {e}")
    
    # Test query functionality
    print("\n4. 测试查询功能...")
    try:
        query_result = await mcp_client.query("测试查询：请返回当前服务状态")
        print(f"   查询成功: {query_result.get('success', False)}")
        if query_result.get('response'):
            response = query_result['response'][:200] + "..." if len(query_result.get('response', '')) > 200 else query_result.get('response', '')
            print(f"   响应预览: {response}")
    except Exception as e:
        print(f"   查询失败: {e}")
    
    # Clean up
    print("\n5. 清理会话...")
    try:
        await mcp_client.close_session()
        print("   会话已关闭")
    except Exception as e:
        print(f"   会话关闭失败: {e}")

async def test_fastapi_integration():
    """测试FastAPI集成"""
    print("\n🔍 测试FastAPI文件提取API集成...")
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # Test health endpoint
        print("1. API健康检查...")
        try:
            async with session.get(f"{base_url}/api/mcp/health") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"   MCP状态: {data.get('status')}")
                else:
                    print(f"   API响应错误: {resp.status}")
        except Exception as e:
            print(f"   API连接失败: {e}")
        
        # Test file extraction endpoint
        print("\n2. 测试文件提取API...")
        try:
            payload = {
                "file_url": "https://raw.githubusercontent.com/octocat/Hello-World/master/README",
                "extraction_type": "text",
                "session_id": "test_session"
            }
            
            async with session.post(
                f"{base_url}/api/file-extractor/extract-url",
                json=payload
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"   提取成功: {data.get('success')}")
                    if data.get('result'):
                        print(f"   结果类型: {type(data['result'])}")
                else:
                    error_data = await resp.text()
                    print(f"   API错误 ({resp.status}): {error_data}")
        except Exception as e:
            print(f"   文件提取API失败: {e}")
        
        # Test supported formats endpoint
        print("\n3. 测试支持格式查询...")
        try:
            async with session.get(f"{base_url}/api/file-extractor/supported-formats") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"   支持的文本格式: {len(data.get('text_formats', []))}")
                    print(f"   支持的文档格式: {len(data.get('document_formats', []))}")
                else:
                    print(f"   格式查询失败: {resp.status}")
        except Exception as e:
            print(f"   格式查询API失败: {e}")

async def main():
    """主测试函数"""
    print("🧪 MCP文件提取服务器集成测试")
    print("=" * 50)
    
    # Test direct MCP connection
    await test_mcp_connection()
    
    # Test FastAPI integration
    await test_fastapi_integration()
    
    print("\n" + "=" * 50)
    print("✅ MCP集成测试完成")
    print("\n💡 如果看到连接错误，请确保：")
    print("   1. FastAPI服务器正在运行 (python start_fastapi.py)")
    print("   2. MCP服务器URL和API密钥正确")
    print("   3. 网络连接正常")

if __name__ == "__main__":
    asyncio.run(main())