from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import json
import os
from typing import Dict, Any
import asyncio

class ChartGenerator:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

    async def generate(self, prompt: str) -> str:
        """异步生成图表配置"""
        system_message = SystemMessage(content="""
你是专业的数据可视化专家。请根据用户描述生成符合ECharts规范的JSON配置。

要求：
1. 返回完整的ECharts配置JSON
2. 数据要合理、真实，符合产业分析场景
3. 图表类型包括：bar(柱状图)、line(折线图)、pie(饼图)、scatter(散点图)等
4. 配色专业，适合商业报告
5. 包含完整的title、tooltip、legend、xAxis、yAxis、series配置

示例输出格式：
{
  "title": {"text": "图表标题", "left": "center"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["类别1", "类别2"]},
  "yAxis": {"type": "value"},
  "series": [{"name": "数据系列", "type": "bar", "data": [100, 200]}]
}
""")

        human_message = HumanMessage(content=f"请为以下需求生成ECharts配置：{prompt}")
        
        response = await self.llm.agenerate([[system_message, human_message]])
        chart_config = response.generations[0][0].text

        try:
            # Validate JSON
            json.loads(chart_config)
            return chart_config
        except json.JSONDecodeError:
            # If not valid JSON, return a fallback configuration
            return self._get_fallback_chart()

    def generate_sync(self, prompt: str) -> str:
        """同步版本的图表生成"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.generate(prompt))
        except RuntimeError:
            # If no event loop is running, create a new one
            return asyncio.run(self.generate(prompt))

    def _get_fallback_chart(self) -> str:
        """备用图表配置"""
        fallback = {
            "title": {"text": "数据分析图表", "left": "center"},
            "tooltip": {"trigger": "axis"},
            "xAxis": {
                "type": "category",
                "data": ["第一季度", "第二季度", "第三季度", "第四季度"]
            },
            "yAxis": {"type": "value"},
            "series": [{
                "name": "发展指标",
                "type": "bar",
                "data": [120, 200, 150, 180],
                "itemStyle": {"color": "#3b82f6"}
            }],
            "grid": {
                "left": "3%",
                "right": "4%",
                "bottom": "3%",
                "top": "15%",
                "containLabel": True
            }
        }
        return json.dumps(fallback, ensure_ascii=False, indent=2)

    async def generate_from_data(self, data: Dict[str, Any], chart_type: str = "bar") -> str:
        """根据数据生成图表"""
        prompt = f"""
基于以下数据生成{chart_type}图表：
{json.dumps(data, ensure_ascii=False, indent=2)}

请创建一个专业的数据可视化图表配置。
"""
        return await self.generate(prompt)