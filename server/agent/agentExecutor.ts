import OpenAI from "openai";
import { generateChart } from "../services/chartGenerator";
import { generateReport } from "../services/reportGenerator";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Tool {
  name: string;
  description: string;
  function: (input: string) => Promise<string> | string;
}

const tools: Tool[] = [
  {
    name: "GenerateChart",
    description: "根据提示生成 ECharts JSON 图表配置",
    function: generateChart
  },
  {
    name: "GenerateReport", 
    description: "根据提示生成 Word 报告文档",
    function: generateReport
  }
];

export class AgentExecutor {
  async execute(userInput: string, sessionId: string = "default"): Promise<string> {
    try {
      // Determine which tool to use based on user input
      const selectedTool = this.selectTool(userInput);
      
      if (selectedTool) {
        console.log(`Using tool: ${selectedTool.name} for input: ${userInput}`);
        const result = await selectedTool.function(userInput);
        return result;
      }

      // If no specific tool is needed, use OpenAI for general response
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "你是一个专业的产业集群分析助手。可以生成图表和报告。如果用户需要图表，请明确说明需要调用图表生成工具。如果需要报告，请说明需要调用报告生成工具。"
          },
          {
            role: "user", 
            content: userInput
          }
        ],
        temperature: 0.7
      });

      return response.choices[0].message.content || "抱歉，无法生成回复。";

    } catch (error) {
      console.error("Agent execution error:", error);
      return "处理请求时发生错误，请稍后重试。";
    }
  }

  private selectTool(input: string): Tool | null {
    const lowerInput = input.toLowerCase();
    
    // Check for chart generation keywords
    if (lowerInput.includes('图表') || lowerInput.includes('chart') || 
        lowerInput.includes('可视化') || lowerInput.includes('统计图')) {
      return tools.find(t => t.name === 'GenerateChart') || null;
    }
    
    // Check for report generation keywords  
    if (lowerInput.includes('报告') || lowerInput.includes('report') ||
        lowerInput.includes('文档') || lowerInput.includes('分析文档')) {
      return tools.find(t => t.name === 'GenerateReport') || null;
    }
    
    return null;
  }
}

export const agentExecutor = new AgentExecutor();