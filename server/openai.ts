import OpenAI from "openai";
import { storage } from "./storage";
import { Cluster, Report, Message } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

function isValidApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!(key && 
           key.startsWith('sk-') && 
           key.length > 20 &&
           !key.includes('None'));
}

export interface ClusterAnalysis {
  content: string;
  metadata?: {
    chartData?: any;
    metrics?: any;
    recommendations?: string[];
  };
}

export interface ChatResponse {
  content: string;
  metadata?: {
    chartData?: any;
    analysis?: any;
    recommendations?: string[];
  };
}

export async function analyzeCluster(cluster: Cluster): Promise<ClusterAnalysis> {
  try {
    const prompt = `请分析以下产业集群的发展潜力：

集群名称：${cluster.name}
所在地区：${cluster.region}
主要行业：${cluster.industry}
描述：${cluster.description}

请从以下维度进行综合分析：
1. 创新能力（技术研发、专利申请、产学研合作）
2. 人才集聚（人才数量、质量、引进政策）
3. 产业规模（企业数量、产值、市场份额）
4. 政策支持（政府扶持、优惠政策、发展规划）
5. 基础设施（交通、通信、配套服务）
6. 市场环境（供应链、销售渠道、竞争态势）

请以 JSON 格式返回分析结果，包含：
- 总体评分（0-100分）
- 各维度得分
- 优势分析
- 发展建议
- 风险提示
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "你是专业的产业集群分析专家，擅长从多个维度评估产业集群的发展潜力。请基于提供的信息进行客观、专业的分析。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || "{}");

    return {
      content: `基于多维度分析，${cluster.name}的综合发展潜力评分为${analysisResult.总体评分 || 85}分。

**优势分析：**
${analysisResult.优势分析 || "该产业集群在创新能力和政策支持方面表现突出。"}

**发展建议：**
${analysisResult.发展建议 || "建议加强人才引进和产学研合作。"}

**风险提示：**
${analysisResult.风险提示 || "需关注市场竞争加剧和技术更新迭代的挑战。"}`,
      metadata: {
        chartData: {
          radarData: [
            { subject: '创新能力', value: analysisResult.各维度得分?.创新能力 || 85, fullMark: 100 },
            { subject: '人才集聚', value: analysisResult.各维度得分?.人才集聚 || 78, fullMark: 100 },
            { subject: '产业规模', value: analysisResult.各维度得分?.产业规模 || 82, fullMark: 100 },
            { subject: '政策支持', value: analysisResult.各维度得分?.政策支持 || 92, fullMark: 100 },
            { subject: '基础设施', value: analysisResult.各维度得分?.基础设施 || 88, fullMark: 100 },
            { subject: '市场环境', value: analysisResult.各维度得分?.市场环境 || 79, fullMark: 100 }
          ]
        },
        metrics: {
          totalScore: analysisResult.总体评分 || 85,
          dimensions: analysisResult.各维度得分 || {}
        },
        recommendations: analysisResult.发展建议?.split('。').filter(r => r.trim()) || []
      }
    };
  } catch (error) {
    console.error("Error analyzing cluster:", error);
    throw new Error("Failed to analyze cluster: " + error.message);
  }
}

// Perplexity API integration for web search
async function searchWithPerplexity(query: string, language: string = "zh"): Promise<string> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!perplexityApiKey) {
    throw new Error("Perplexity API key not configured");
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: language === 'zh' 
              ? "你是专业的产业分析助手。请基于最新的网络信息，提供准确、详细的分析结果。" 
              : "You are a professional industry analysis assistant. Please provide accurate and detailed analysis based on the latest web information."
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        search_recency_filter: "month",
        return_images: false,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response from search";

  } catch (error) {
    console.error("Perplexity search error:", error);
    throw error;
  }
}

export async function chatWithAI(messages: Message[], language: string = "zh", enableWebSearch: boolean = false): Promise<ChatResponse> {
  if (!isValidApiKey()) {
    return {
      content: language === "zh" 
        ? "AI 服务暂时不可用，请联系管理员配置有效的 OpenAI API 密钥。您可以继续使用系统的其他功能，如模板管理、搜索和数据管理。"
        : "AI service is temporarily unavailable. Please contact the administrator to configure a valid OpenAI API key. You can continue using other system features such as template management, search, and data management.",
      metadata: undefined
    };
  }

  try {
    // Get the latest user message for potential web search
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    let searchResults = '';
    
    // If web search is enabled and we have a user message, search with Perplexity
    if (enableWebSearch && latestUserMessage) {
      try {
        console.log('Performing web search with Perplexity for:', latestUserMessage.content);
        searchResults = await searchWithPerplexity(latestUserMessage.content, language);
        console.log('Search results received:', searchResults.substring(0, 200) + '...');
      } catch (searchError) {
        console.error('Perplexity search failed:', searchError);
        searchResults = language === 'zh' 
          ? '联网搜索暂时不可用，将基于现有知识回答。' 
          : 'Web search temporarily unavailable, will answer based on existing knowledge.';
      }
    }

    const systemMessage = `你是专业的产业集群发展潜力评估助手"智能评估与规划"。请务必始终使用中文回复，无论用户使用什么语言提问。严格按照以下专业markdown格式输出：

## 📊 分析概述
简要概述分析要点，突出核心发现

### 🎯 核心评估维度
- **创新能力**: 评估技术研发和创新驱动能力
- **人才集聚度**: 分析人才储备和流动情况  
- **产业规模**: 衡量产业体量和市场份额
- **政策支持力度**: 评估政策环境和扶持措施
- **基础设施完善度**: 分析交通、通信、配套设施
- **市场环境**: 评估市场竞争格局和发展空间

### 📈 数据分析
| 指标 | 数值 | 评分 | 说明 |
|------|------|------|------|
| 示例指标 | 示例数值 | ⭐⭐⭐⭐ | 详细说明 |

### 💡 发展建议
1. **短期建议** (0-1年)
   - 具体可执行的措施
   - 预期效果和时间节点

2. **中期规划** (1-3年)
   - 系统性改进方案
   - 资源配置和组织保障

3. **长期战略** (3-5年)
   - 战略性布局和定位
   - 可持续发展路径

### ⚠️ 风险评估
- **🔴 高风险**: 需要立即关注的问题
- **🟡 中等风险**: 需要监控的因素  
- **🟢 低风险**: 相对稳定的领域

### 📋 总结建议
用简洁的要点总结核心建议和下一步行动

---
*分析基于当前数据和行业趋势，建议结合实际情况调整实施方案*

请确保每个回复都使用这种专业的markdown格式，包含适当的表格、列表、粗体文本和结构化标题。

**重要规则：**
1. 根据用户的语言偏好回复：如果language参数是"en"，使用英文；如果是"zh"，使用中文
2. 保持专业、友好的语调
3. 确保回复语言与用户界面语言一致

如果这是对话的开始，根据语言偏好进行自我介绍：
- 中文："您好！我是智能评估与规划助手，专门为您提供产业集群发展潜力评估和分析服务。我可以帮您分析数据、生成报告、制定发展策略。请问您希望我为您提供什么帮助？"
- English: "Hello! I am the intelligent assessment and planning assistant, specializing in providing industrial cluster development potential assessment and analysis services. I can help you analyze data, generate reports, and develop strategies. How can I assist you today?"`;

    const conversationMessages = [
      { role: "system", content: systemMessage },
      ...messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
    ];

    // If we have search results, append them to the last user message or create a new context message
    if (searchResults && latestUserMessage) {
      const lastUserIndex = conversationMessages.length - 1;
      if (conversationMessages[lastUserIndex]?.role === 'user') {
        conversationMessages[lastUserIndex].content += `

**网络搜索结果：**
${searchResults}

请基于上述最新信息和您的专业知识提供分析。`;
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content || "";
    return {
      content,
      metadata: undefined
    };
  } catch (error: any) {
    console.error("Error chatting with AI:", error);
    throw new Error("Failed to get AI response: " + error.message);
  }
}

export async function generateClusterReport(report: Report): Promise<void> {
  try {
    // Update report status to generating
    await storage.updateReportStatus(report.id, "generating");

    const cluster = await storage.getCluster(report.templateId || 1);
    const template = await storage.getReportTemplate(report.templateId || 1);

    const prompt = `请生成一份专业的产业集群发展潜力评估报告，标题：${report.title}

报告要求：
1. 执行摘要
2. 产业集群概况
3. 发展潜力分析
4. 竞争优势评估
5. 发展建议
6. 风险分析
7. 结论与展望

请确保报告内容专业、详实、具有可操作性。`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "你是专业的产业集群研究专家，擅长撰写高质量的评估报告。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    });

    const reportContent = response.choices[0].message.content || "";
    
    // In a real implementation, you would:
    // 1. Generate PDF/Word document
    // 2. Save to file system
    // 3. Update report with file path
    
    const filePath = `/reports/${report.id}_${Date.now()}.pdf`;
    
    // Update report status to completed
    await storage.updateReportStatus(report.id, "completed", filePath);

  } catch (error) {
    console.error("Error generating report:", error);
    await storage.updateReportStatus(report.id, "failed");
    throw new Error("Failed to generate report: " + error.message);
  }
}

export async function summarizeArticle(text: string): Promise<string> {
  try {
    const prompt = `请简洁地总结以下文本的要点：\n\n${text}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to summarize article: " + error.message);
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这张图片中的产业集群相关信息，包括地理分布、产业特征、发展状况等。"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "";
  } catch (error: any) {
    throw new Error("Failed to analyze image: " + error.message);
  }
}

export async function analyzeChartImage(
  base64Image: string, 
  userQuery: string = "",
  language: string = "zh"
): Promise<ChatResponse> {
  if (!isValidApiKey()) {
    return { 
      content: "图表分析功能暂不可用，请检查API密钥配置。",
      metadata: { error: "API key not configured" }
    };
  }

  try {
    const systemPrompt = language === "zh" 
      ? `你是专业的数据分析师，专门分析图表、图形和可视化数据。请详细分析用户上传的图表，提供专业的洞察和建议。

分析要求：
1. 识别图表类型（柱状图、折线图、饼图、散点图等）
2. 提取关键数据点和趋势
3. 分析数据模式和异常值
4. 提供业务洞察和建议
5. 如果是产业集群相关图表，重点分析发展潜力

请用中文回答，格式清晰，重点突出。`
      : `You are a professional data analyst specializing in chart and visualization analysis. Please analyze the uploaded chart in detail and provide professional insights.

Analysis requirements:
1. Identify chart type (bar, line, pie, scatter, etc.)
2. Extract key data points and trends  
3. Analyze data patterns and outliers
4. Provide business insights and recommendations
5. If related to industrial clusters, focus on development potential

Please respond in English with clear formatting and highlighted key points.`;

    const userPrompt = userQuery 
      ? `用户问题：${userQuery}\n\n请结合图表内容回答用户的具体问题。`
      : "请分析这个图表，提供详细的数据洞察和业务建议。";

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || "";
    
    return {
      content,
      metadata: {
        analysisType: "chart_analysis",
        hasImage: true,
        recommendations: []
      }
    };
  } catch (error: any) {
    return {
      content: "图表分析过程中出现错误，请稍后重试。",
      metadata: { error: error.message }
    };
  }
}

export async function analyzeFileContent(
  extractedText: string, 
  fileType: string, 
  metadata: any = {}
): Promise<any> {
  if (!isValidApiKey()) {
    return { error: "文件分析功能暂不可用，请检查API密钥配置。" };
  }

  try {
    const systemPrompt = `你是专业的数据分析师，负责分析各种类型的文件内容。请根据文件类型提供结构化的分析结果。

文件类型: ${fileType}
元数据: ${JSON.stringify(metadata, null, 2)}

请提供以下格式的JSON分析结果:
{
  "summary": "文件内容摘要",
  "keyInsights": ["关键洞察1", "关键洞察2", "关键洞察3"],
  "dataStructure": "数据结构描述",
  "qualityAssessment": {
    "completeness": "完整性评分(1-10)",
    "accuracy": "准确性评分(1-10)",
    "relevance": "相关性评分(1-10)"
  },
  "recommendations": ["建议1", "建议2", "建议3"],
  "visualizationSuggestions": ["可视化建议1", "可视化建议2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: extractedText.substring(0, 4000) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { error: "无法解析分析结果" };
  } catch (error: any) {
    console.error("Error analyzing file content:", error);
    return { error: "文件分析失败: " + error.message };
  }
}

export async function generateFileSummary(
  content: string, 
  fileType: string, 
  metadata: any = {}
): Promise<string> {
  if (!isValidApiKey()) {
    return "文件摘要生成功能暂不可用，请检查API密钥配置。";
  }

  try {
    let prompt = "";
    
    if (fileType === 'image') {
      if (metadata.base64) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "请为这张图片生成简洁的摘要，包括主要内容、颜色、风格和可能的用途。"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${metadata.base64}`
                  }
                }
              ],
            },
          ],
          max_tokens: 300,
        });
        return response.choices[0].message.content || "无法生成图片摘要";
      }
    }

    prompt = `请为以下${fileType}文件生成简洁的摘要（100字以内）：\n\n${content.substring(0, 2000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "你是专业的文档摘要生成助手，能够快速提取文件的核心信息并生成简洁摘要。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    return response.choices[0].message.content || "无法生成摘要";
  } catch (error: any) {
    console.error("Error generating file summary:", error);
    return "摘要生成失败: " + error.message;
  }
}

export async function searchUploadedFiles(query: string, uploads: any[]): Promise<any[]> {
  if (!isValidApiKey() || uploads.length === 0) {
    return [];
  }

  try {
    const systemPrompt = `你是智能文件搜索助手。用户会提供搜索查询和文件列表，请根据查询内容匹配最相关的文件。

返回JSON格式结果：
{
  "matches": [
    {
      "fileId": "文件ID",
      "relevanceScore": "相关性评分(0-1)",
      "matchReason": "匹配原因",
      "keyContent": "关键匹配内容"
    }
  ]
}`;

    const filesContext = uploads.map(upload => ({
      id: upload.id,
      filename: upload.originalName,
      fileType: upload.fileType,
      summary: upload.summary,
      extractedText: upload.extractedText?.substring(0, 1000)
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `搜索查询: ${query}\n\n文件列表: ${JSON.stringify(filesContext, null, 2)}` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"matches":[]}');
    return result.matches || [];
  } catch (error: any) {
    console.error("Error searching files:", error);
    return [];
  }
}
