from langchain.agents import initialize_agent, Tool, AgentType
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from services.chart_generator import ChartGenerator
from services.report_generator import ReportGenerator
from services.file_reader import FileReader
from services.mcp_client import MCPClient
import os
from typing import Dict, Any, List
import json

class AgentExecutor:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.chart_generator = ChartGenerator()
        self.report_generator = ReportGenerator()
        self.file_reader = FileReader()
        self.mcp_client = MCPClient()
        
        # Initialize tools
        self.tools = [
            Tool(
                name="GenerateChart",
                func=self.generate_chart,
                description="根据数据和描述生成专业的ECharts图表配置"
            ),
            Tool(
                name="GenerateReport", 
                func=self.generate_report,
                description="根据数据和分析要求生成专业的分析报告"
            ),
            Tool(
                name="ReadRemoteFile",
                func=self.read_remote_file,
                description="从远程服务器读取文件内容进行分析"
            ),
            Tool(
                name="MCPQuery",
                func=self.mcp_query,
                description="使用MCP协议查询和处理文档数据"
            )
        ]
        
        # Initialize agent
        self.agent = initialize_agent(
            self.tools,
            self.llm,
            agent=AgentType.OPENAI_FUNCTIONS,
            verbose=True,
            max_iterations=3,
            handle_parsing_errors=True
        )

    async def execute(self, user_input: str, session_id: str = "default") -> Dict[str, Any]:
        """执行用户请求"""
        try:
            # Determine the type of request and execute accordingly
            if any(keyword in user_input.lower() for keyword in ['图表', 'chart', '可视化', '统计图']):
                return await self.handle_chart_request(user_input, session_id)
            elif any(keyword in user_input.lower() for keyword in ['报告', 'report', '分析文档', '文档']):
                return await self.handle_report_request(user_input, session_id)
            elif any(keyword in user_input.lower() for keyword in ['读取', '文件', '远程', '服务器']):
                return await self.handle_file_request(user_input, session_id)
            else:
                # General analysis request
                result = await self.agent.arun(input=user_input)
                return {
                    "success": True,
                    "result": result,
                    "type": "analysis",
                    "session_id": session_id
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"执行失败: {str(e)}",
                "session_id": session_id
            }

    async def handle_chart_request(self, user_input: str, session_id: str) -> Dict[str, Any]:
        """处理图表生成请求"""
        try:
            chart_config = await self.chart_generator.generate(user_input)
            return {
                "success": True,
                "result": chart_config,
                "type": "chart",
                "session_id": session_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"图表生成失败: {str(e)}",
                "session_id": session_id
            }

    async def handle_report_request(self, user_input: str, session_id: str) -> Dict[str, Any]:
        """处理报告生成请求"""
        try:
            report_path = await self.report_generator.generate(user_input, session_id)
            return {
                "success": True,
                "result": report_path,
                "type": "report",
                "session_id": session_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"报告生成失败: {str(e)}",
                "session_id": session_id
            }

    async def handle_file_request(self, user_input: str, session_id: str) -> Dict[str, Any]:
        """处理文件读取请求"""
        try:
            file_content = await self.file_reader.read_remote_file(user_input)
            # Process the file content with AI
            analysis = await self.llm.apredict(
                f"请分析以下文件内容：\n\n{file_content}\n\n用户要求：{user_input}"
            )
            return {
                "success": True,
                "result": analysis,
                "type": "file_analysis",
                "session_id": session_id
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"文件处理失败: {str(e)}",
                "session_id": session_id
            }

    def generate_chart(self, prompt: str) -> str:
        """图表生成工具函数"""
        return self.chart_generator.generate_sync(prompt)

    def generate_report(self, prompt: str) -> str:
        """报告生成工具函数"""
        return self.report_generator.generate_sync(prompt)

    def read_remote_file(self, file_path: str) -> str:
        """远程文件读取工具函数"""
        return self.file_reader.read_remote_file_sync(file_path)

    def mcp_query(self, query: str) -> str:
        """MCP查询工具函数"""
        return self.mcp_client.query_sync(query)