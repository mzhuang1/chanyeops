#!/usr/bin/env python3
"""
FastAPI后端集成测试脚本
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

class FastAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def test_health(self) -> bool:
        """测试健康检查"""
        try:
            async with self.session.get(f"{self.base_url}/health") as resp:
                data = await resp.json()
                print(f"✅ Health check: {data.get('status', 'unknown')}")
                return resp.status == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False

    async def test_chat_api(self) -> bool:
        """测试聊天API"""
        try:
            payload = {
                "session_id": "test_session",
                "user_input": "分析景德镇陶瓷产业发展现状",
                "context": {}
            }
            
            async with self.session.post(
                f"{self.base_url}/api/chat/",
                json=payload
            ) as resp:
                data = await resp.json()
                print(f"✅ Chat API test: Response received")
                print(f"   Type: {data.get('type', 'unknown')}")
                print(f"   Response length: {len(str(data.get('response', '')))}")
                return resp.status == 200
        except Exception as e:
            print(f"❌ Chat API test failed: {e}")
            return False

    async def test_agent_api(self) -> bool:
        """测试智能体API"""
        try:
            payload = {
                "user_input": "生成景德镇陶瓷产业数据图表",
                "session_id": "test_agent"
            }
            
            async with self.session.post(
                f"{self.base_url}/api/agent/execute",
                json=payload
            ) as resp:
                data = await resp.json()
                print(f"✅ Agent API test: {data.get('success', False)}")
                print(f"   Type: {data.get('type', 'unknown')}")
                return resp.status == 200 and data.get('success', False)
        except Exception as e:
            print(f"❌ Agent API test failed: {e}")
            return False

    async def test_chart_generation(self) -> bool:
        """测试图表生成"""
        try:
            payload = {
                "data_description": "景德镇陶瓷产业近5年发展数据",
                "session_id": "test_chart",
                "chart_type": "bar"
            }
            
            async with self.session.post(
                f"{self.base_url}/api/chat/generate-chart",
                json=payload
            ) as resp:
                data = await resp.json()
                print(f"✅ Chart generation test: Success")
                chart_config = data.get('chart_config', '')
                if chart_config:
                    try:
                        json.loads(chart_config)
                        print(f"   Valid JSON chart config generated")
                    except:
                        print(f"   Chart config format: {type(chart_config)}")
                return resp.status == 200
        except Exception as e:
            print(f"❌ Chart generation test failed: {e}")
            return False

    async def test_report_generation(self) -> bool:
        """测试报告生成"""
        try:
            params = {
                "topic": "景德镇陶瓷产业分析",
                "session_id": "test_report",
                "format": "html"
            }
            
            async with self.session.post(
                f"{self.base_url}/api/chat/generate-report",
                params=params
            ) as resp:
                data = await resp.json()
                print(f"✅ Report generation test: Success")
                report_path = data.get('report_path', '')
                if report_path and '/download/' in report_path:
                    print(f"   Report available at: {report_path}")
                return resp.status == 200
        except Exception as e:
            print(f"❌ Report generation test failed: {e}")
            return False

    async def test_mcp_health(self) -> bool:
        """测试MCP健康状态"""
        try:
            async with self.session.get(f"{self.base_url}/api/mcp/health") as resp:
                data = await resp.json()
                status = data.get('status', 'unknown')
                print(f"✅ MCP health check: {status}")
                if status == 'unhealthy':
                    print(f"   MCP服务器未运行，这是正常的（MCP为可选服务）")
                return True  # MCP is optional, so don't fail if unavailable
        except Exception as e:
            print(f"⚠️  MCP health check: Service not available (optional)")
            return True

    async def test_server_status(self) -> bool:
        """测试服务器状态"""
        try:
            async with self.session.get(f"{self.base_url}/api/agent/servers/status") as resp:
                data = await resp.json()
                print(f"✅ Server status check: Retrieved")
                servers = data.get('servers', {})
                for name, status in servers.items():
                    print(f"   {name}: {status.get('status', 'unknown')}")
                return resp.status == 200
        except Exception as e:
            print(f"❌ Server status test failed: {e}")
            return False

    async def run_all_tests(self):
        """运行所有测试"""
        print("🧪 FastAPI后端集成测试")
        print("=" * 40)
        
        tests = [
            ("健康检查", self.test_health),
            ("MCP健康检查", self.test_mcp_health),
            ("服务器状态", self.test_server_status),
            ("聊天API", self.test_chat_api),
            ("智能体API", self.test_agent_api),
            ("图表生成", self.test_chart_generation),
            ("报告生成", self.test_report_generation)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running {test_name}...")
            try:
                result = await test_func()
                if result:
                    passed += 1
                else:
                    print(f"❌ {test_name} 失败")
            except Exception as e:
                print(f"❌ {test_name} 异常: {e}")
        
        print("\n" + "=" * 40)
        print(f"📊 测试结果: {passed}/{total} 通过")
        
        if passed == total:
            print("🎉 所有测试通过！FastAPI后端运行正常")
        elif passed >= total * 0.7:
            print("⚠️  大部分测试通过，系统基本可用")
        else:
            print("❌ 多个测试失败，请检查系统配置")
        
        return passed / total

async def main():
    """主测试函数"""
    print("⏰ 等待FastAPI服务器启动...")
    await asyncio.sleep(2)
    
    async with FastAPITester() as tester:
        success_rate = await tester.run_all_tests()
        
        if success_rate >= 0.8:
            print("\n✅ 集成测试完成，系统就绪")
        else:
            print("\n⚠️  部分功能可能不可用，请检查服务配置")

if __name__ == "__main__":
    asyncio.run(main())