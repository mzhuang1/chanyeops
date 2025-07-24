import fs from 'fs';
import path from 'path';
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ReportSection {
  title: string;
  content: string;
  level: number;
}

export async function generateReport(topic: string): Promise<string> {
  try {
    // Use OpenAI to generate comprehensive report content
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `你是专业的产业分析报告撰写专家。请根据主题生成完整的分析报告，包含以下结构：

1. 执行摘要
2. 行业概况
3. 现状分析  
4. 问题识别
5. 发展趋势
6. 建议措施
7. 结论

每个部分都要详细、专业，符合产业分析报告的标准格式。返回JSON格式：
{
  "title": "报告标题",
  "sections": [
    {"title": "章节标题", "content": "详细内容", "level": 1},
    ...
  ]
}`
        },
        {
          role: "user",
          content: `请为以下主题生成详细的产业分析报告：${topic}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3000
    });

    const reportData = JSON.parse(response.choices[0].message.content || "{}");
    
    // Generate HTML report
    const htmlContent = generateHTMLReport(reportData);
    
    // Save to outputs directory
    const outputsDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputsDir)) {
      fs.mkdirSync(outputsDir, { recursive: true });
    }
    
    const filename = `${topic.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}_${Date.now()}.html`;
    const filepath = path.join(outputsDir, filename);
    
    fs.writeFileSync(filepath, htmlContent, 'utf8');
    
    return `/download/${filename}`;

  } catch (error) {
    console.error("Report generation error:", error);
    throw new Error("报告生成失败");
  }
}

function generateHTMLReport(reportData: any): string {
  const { title, sections } = reportData;
  
  let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #1f2937;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            text-align: center;
        }
        h2 {
            color: #374151;
            border-left: 4px solid #10b981;
            padding-left: 15px;
            margin-top: 30px;
        }
        h3 {
            color: #4b5563;
            margin-top: 25px;
        }
        p {
            text-align: justify;
            margin-bottom: 15px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .date {
            color: #6b7280;
            font-style: italic;
        }
        .section {
            margin-bottom: 30px;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            h1 { page-break-before: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p class="date">生成时间：${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
`;

  sections.forEach((section: ReportSection) => {
    const headingTag = `h${Math.min(section.level + 1, 6)}`;
    htmlContent += `
    <div class="section">
        <${headingTag}>${section.title}</${headingTag}>
        <p>${section.content.replace(/\n/g, '</p><p>')}</p>
    </div>`;
  });

  htmlContent += `
</body>
</html>`;

  return htmlContent;
}

// Generate Word document (if docx library is available)
export async function generateWordReport(topic: string): Promise<string> {
  // This would require installing docx library
  // For now, we'll use HTML format which is more universally supported
  return generateReport(topic);
}