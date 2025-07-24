import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChartConfig {
  title: {
    text: string;
    left?: string;
    textStyle?: object;
  };
  tooltip?: object;
  legend?: object;
  xAxis?: object;
  yAxis?: object;
  series: object[];
  grid?: object;
  color?: string[];
}

export async function generateChart(prompt: string): Promise<string> {
  try {
    // Use OpenAI to generate appropriate chart configuration based on prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `你是专业的数据可视化专家。请根据用户的描述生成符合ECharts规范的JSON配置。
          
返回格式必须是有效的JSON，包含以下结构：
{
  "title": {"text": "图表标题"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["类别1", "类别2", "类别3"]},
  "yAxis": {"type": "value"},
  "series": [{"name": "系列名", "type": "bar", "data": [数值1, 数值2, 数值3]}]
}

请确保：
1. 数据真实合理，符合产业分析场景
2. 颜色搭配专业美观
3. 支持的图表类型包括：bar(柱状图)、line(折线图)、pie(饼图)、scatter(散点图)等`
        },
        {
          role: "user",
          content: `请为以下需求生成ECharts配置：${prompt}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const chartConfig = JSON.parse(response.choices[0].message.content || "{}");
    
    // Enhance the chart with professional styling
    const enhancedConfig: ChartConfig = {
      ...chartConfig,
      title: {
        ...chartConfig.title,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1f2937'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    };

    return JSON.stringify(enhancedConfig, null, 2);

  } catch (error) {
    console.error("Chart generation error:", error);
    
    // Fallback chart configuration
    const fallbackChart: ChartConfig = {
      title: { text: "数据图表" },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
      },
      yAxis: { type: 'value' },
      series: [{
        name: '数据系列',
        type: 'bar',
        data: [120, 200, 150, 80, 70, 110]
      }]
    };
    
    return JSON.stringify(fallbackChart, null, 2);
  }
}

// Generate sample data for different chart types
export function generateSampleData(chartType: string, categories: string[]) {
  switch (chartType) {
    case 'pie':
      return categories.map(cat => ({
        name: cat,
        value: Math.floor(Math.random() * 100) + 20
      }));
    
    case 'line':
    case 'bar':
      return categories.map(() => Math.floor(Math.random() * 200) + 50);
    
    default:
      return [];
  }
}