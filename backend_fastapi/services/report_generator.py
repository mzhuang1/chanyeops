from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import os
import json
import asyncio
from datetime import datetime
from jinja2 import Template
from typing import Dict, Any, List
import aiofiles

class ReportGenerator:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.5,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

    async def generate(self, topic: str, session_id: str = "default") -> str:
        """异步生成报告"""
        # Generate report content using AI
        report_data = await self._generate_report_content(topic)
        
        # Create HTML report
        html_content = self._create_html_report(report_data)
        
        # Save report to file
        filename = f"{self._sanitize_filename(topic)}_{session_id}_{int(datetime.now().timestamp())}.html"
        filepath = os.path.join("outputs", filename)
        
        os.makedirs("outputs", exist_ok=True)
        async with aiofiles.open(filepath, 'w', encoding='utf-8') as f:
            await f.write(html_content)
        
        return f"/download/{filename}"

    def generate_sync(self, topic: str) -> str:
        """同步版本的报告生成"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.generate(topic))
        except RuntimeError:
            return asyncio.run(self.generate(topic))

    async def _generate_report_content(self, topic: str) -> Dict[str, Any]:
        """使用AI生成报告内容"""
        system_message = SystemMessage(content="""
你是专业的产业分析报告撰写专家。请根据主题生成完整的分析报告内容。

报告结构要求：
1. 执行摘要
2. 行业概况
3. 现状分析
4. 问题识别
5. 发展趋势
6. 建议措施
7. 结论

请返回JSON格式，包含以下字段：
{
  "title": "报告标题",
  "executive_summary": "执行摘要内容",
  "sections": [
    {
      "title": "章节标题",
      "content": "详细内容",
      "subsections": [
        {"title": "子章节标题", "content": "子章节内容"}
      ]
    }
  ],
  "recommendations": ["建议1", "建议2", "建议3"],
  "conclusion": "结论内容"
}
""")

        human_message = HumanMessage(content=f"请为以下主题生成详细的产业分析报告：{topic}")
        
        response = await self.llm.agenerate([[system_message, human_message]])
        content = response.generations[0][0].text

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Return fallback structure if JSON parsing fails
            return self._get_fallback_report_data(topic)

    def _create_html_report(self, report_data: Dict[str, Any]) -> str:
        """创建HTML格式的报告"""
        template_str = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ report_data.title }}</title>
    <style>
        body {
            font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
            line-height: 1.8;
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
            background-color: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 50px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 30px;
        }
        h1 {
            color: #1f2937;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        .meta-info {
            color: #6b7280;
            font-size: 1.1em;
            margin-top: 20px;
        }
        .executive-summary {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 5px solid #3b82f6;
        }
        .executive-summary h2 {
            color: #1f2937;
            margin-top: 0;
            font-size: 1.5em;
        }
        .section {
            margin: 40px 0;
            padding: 25px;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        h2 {
            color: #1f2937;
            font-size: 1.4em;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        h3 {
            color: #374151;
            font-size: 1.2em;
            margin: 25px 0 15px 0;
        }
        .subsection {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .recommendations {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 5px solid #10b981;
        }
        .recommendations h2 {
            color: #047857;
            margin-top: 0;
        }
        .recommendation-list {
            list-style: none;
            padding: 0;
        }
        .recommendation-list li {
            background: white;
            margin: 15px 0;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 3px solid #10b981;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .recommendation-list li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 10px;
        }
        .conclusion {
            background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 40px 0;
            border-left: 5px solid #f59e0b;
        }
        .conclusion h2 {
            color: #92400e;
            margin-top: 0;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.9em;
        }
        @media print {
            body { margin: 0; padding: 20px; }
            .header, .section, .recommendations, .conclusion {
                page-break-inside: avoid;
            }
        }
        @media (max-width: 768px) {
            body { padding: 20px 15px; }
            h1 { font-size: 2em; }
            .executive-summary, .section, .recommendations, .conclusion {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ report_data.title }}</h1>
        <div class="meta-info">
            <p>生成时间：{{ current_time }}</p>
            <p>产业集群智能体系统 - 专业分析报告</p>
        </div>
    </div>

    <div class="executive-summary">
        <h2>📋 执行摘要</h2>
        <p>{{ report_data.executive_summary }}</p>
    </div>

    {% for section in report_data.sections %}
    <div class="section">
        <h2>{{ loop.index }}. {{ section.title }}</h2>
        <p>{{ section.content }}</p>
        
        {% if section.subsections %}
            {% for subsection in section.subsections %}
            <div class="subsection">
                <h3>{{ subsection.title }}</h3>
                <p>{{ subsection.content }}</p>
            </div>
            {% endfor %}
        {% endif %}
    </div>
    {% endfor %}

    <div class="recommendations">
        <h2>💡 建议措施</h2>
        <ul class="recommendation-list">
            {% for recommendation in report_data.recommendations %}
            <li>{{ recommendation }}</li>
            {% endfor %}
        </ul>
    </div>

    <div class="conclusion">
        <h2>🎯 总结</h2>
        <p>{{ report_data.conclusion }}</p>
    </div>

    <div class="footer">
        <p>本报告由产业集群智能体系统自动生成</p>
        <p>© 2025 产业集群智能体 - 专业的产业分析解决方案</p>
    </div>
</body>
</html>
"""
        
        template = Template(template_str)
        return template.render(
            report_data=report_data,
            current_time=datetime.now().strftime("%Y年%m月%d日 %H:%M")
        )

    def _get_fallback_report_data(self, topic: str) -> Dict[str, Any]:
        """备用报告数据结构"""
        return {
            "title": f"{topic} - 产业分析报告",
            "executive_summary": f"本报告针对{topic}进行了全面的产业分析，涵盖了行业现状、发展趋势和战略建议。",
            "sections": [
                {
                    "title": "行业概况",
                    "content": f"{topic}作为重要的产业领域，在国民经济中占据重要地位。",
                    "subsections": []
                },
                {
                    "title": "现状分析",
                    "content": "通过深入分析当前产业发展状况，识别关键机遇和挑战。",
                    "subsections": []
                }
            ],
            "recommendations": [
                "加强政策支持和引导",
                "推动技术创新和升级",
                "完善产业链配套"
            ],
            "conclusion": f"综合分析显示，{topic}具有良好的发展前景，需要持续关注和投入。"
        }

    def _sanitize_filename(self, filename: str) -> str:
        """清理文件名，移除特殊字符"""
        import re
        # Remove or replace invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
        filename = re.sub(r'\s+', '_', filename)
        return filename[:50]  # Limit length