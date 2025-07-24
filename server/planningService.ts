import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import { FileProcessor } from './fileProcessor';
import { SearchService } from './searchService';
import { ChatOpenAI } from '@langchain/openai';
import puppeteer from 'puppeteer';

export interface PlanningRequest {
  region: string;
  planType: string; // 十四五、十五五等
  templateType: string;
  referenceFiles: string[];
  localFilePath?: string;
  enableWebSearch: boolean;
  userId: string;
}

export interface PlanningTemplate {
  id: string;
  name: string;
  sections: PlanningSection[];
}

export interface PlanningSection {
  title: string;
  subsections: string[];
  requirements: string;
  minWords: number;
}

export interface GeneratedPlanning {
  id: string;
  title: string;
  content: string;
  sections: GeneratedSection[];
  metadata: {
    totalWords: number;
    generatedAt: Date;
    sources: string[];
  };
}

export interface GeneratedSection {
  title: string;
  content: string;
  wordCount: number;
  sources: string[];
}

export class PlanningService {
  private static llm = new ChatOpenAI({
    modelName: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    temperature: 0.7,
    maxTokens: 4000,
  });

  // 预定义的规划模板
  private static templates: PlanningTemplate[] = [
    {
      id: 'comprehensive',
      name: '综合五年规划模板',
      sections: [
        {
          title: '总则',
          subsections: ['指导思想', '基本原则', '发展目标'],
          requirements: '阐述规划的指导思想、遵循的基本原则和要实现的总体发展目标',
          minWords: 800
        },
        {
          title: '发展基础与面临形势',
          subsections: ['发展基础', '机遇挑战', '发展环境'],
          requirements: '分析当前发展基础、面临的机遇挑战以及发展环境',
          minWords: 1200
        },
        {
          title: '发展目标与指标体系',
          subsections: ['总体目标', '具体指标', '分年度目标'],
          requirements: '设定明确的发展目标和可量化的指标体系',
          minWords: 1000
        },
        {
          title: '重点任务与举措',
          subsections: ['产业发展', '基础设施', '民生保障', '生态环境'],
          requirements: '详细规划各领域的重点任务和具体举措',
          minWords: 2000
        },
        {
          title: '空间布局与重大项目',
          subsections: ['空间布局', '重大项目', '投资安排'],
          requirements: '明确空间发展布局和重大项目安排',
          minWords: 1000
        },
        {
          title: '保障措施',
          subsections: ['组织保障', '政策保障', '资金保障', '监督评估'],
          requirements: '制定具体的保障措施确保规划实施',
          minWords: 800
        }
      ]
    },
    {
      id: 'industry',
      name: '产业发展专项规划模板',
      sections: [
        {
          title: '产业发展现状',
          subsections: ['产业基础', '发展水平', '存在问题'],
          requirements: '全面分析产业发展现状和存在的问题',
          minWords: 1000
        },
        {
          title: '发展环境分析',
          subsections: ['政策环境', '市场环境', '技术环境', '竞争环境'],
          requirements: '深入分析产业发展的内外部环境',
          minWords: 800
        },
        {
          title: '发展目标与路径',
          subsections: ['发展目标', '发展路径', '发展重点'],
          requirements: '明确产业发展的目标、路径和重点方向',
          minWords: 1200
        },
        {
          title: '重点任务',
          subsections: ['产业链完善', '创新能力提升', '平台建设', '人才培养'],
          requirements: '制定产业发展的重点任务和具体措施',
          minWords: 1500
        },
        {
          title: '保障措施',
          subsections: ['政策支持', '资金保障', '组织实施'],
          requirements: '确保产业规划顺利实施的保障措施',
          minWords: 600
        }
      ]
    }
  ];

  // 获取可用模板
  static getTemplates(): PlanningTemplate[] {
    return this.templates;
  }

  // 从本地路径读取和分析参考文件
  static async processReferenceFiles(filePaths: string[]): Promise<any[]> {
    const processedFiles = [];
    
    for (const filePath of filePaths) {
      try {
        if (!fs.existsSync(filePath)) {
          console.warn(`文件不存在: ${filePath}`);
          continue;
        }

        const fileStats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        const fileExtension = path.extname(filePath).toLowerCase();

        // 根据文件类型处理
        let processedData;
        if (['.docx', '.doc'].includes(fileExtension)) {
          processedData = await this.processWordFile(filePath);
        } else if (fileExtension === '.pdf') {
          processedData = await this.processPdfFile(filePath);
        } else if (['.xlsx', '.xls'].includes(fileExtension)) {
          processedData = await this.processExcelFile(filePath);
        } else if (['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
          processedData = await this.processImageFile(filePath);
        } else {
          console.warn(`不支持的文件类型: ${fileExtension}`);
          continue;
        }

        processedFiles.push({
          fileName,
          filePath,
          fileType: fileExtension,
          fileSize: fileStats.size,
          processedData,
          extractedText: processedData.extractedText,
          metadata: processedData.metadata
        });

      } catch (error) {
        console.error(`处理文件失败 ${filePath}:`, error);
      }
    }

    return processedFiles;
  }

  // 自动归类参考文件
  static categorizeFiles(processedFiles: any[]): Record<string, any[]> {
    const categories: Record<string, any[]> = {
      national_policies: [], // 国家政策
      provincial_plans: [], // 省级规划
      city_plans: [], // 市级规划
      industry_analysis: [], // 行业分析
      data_reports: [], // 数据报告
      other: [] // 其他
    };

    for (const file of processedFiles) {
      const content = file.extractedText?.toLowerCase() || '';
      const fileName = file.fileName?.toLowerCase() || '';

      if (content.includes('国务院') || content.includes('国家发改委') || fileName.includes('国家')) {
        categories.national_policies.push(file);
      } else if (content.includes('省政府') || content.includes('省发改委') || fileName.includes('省')) {
        categories.provincial_plans.push(file);
      } else if (content.includes('市政府') || content.includes('市发改委') || fileName.includes('市')) {
        categories.city_plans.push(file);
      } else if (fileName.includes('分析') || fileName.includes('报告') || content.includes('数据')) {
        if (fileName.includes('行业') || content.includes('产业')) {
          categories.industry_analysis.push(file);
        } else {
          categories.data_reports.push(file);
        }
      } else {
        categories.other.push(file);
      }
    }

    return categories;
  }

  // 生成五年规划
  static async generatePlanning(request: PlanningRequest): Promise<GeneratedPlanning> {
    const startTime = Date.now();
    
    // 1. 处理参考文件
    let referenceContent = '';
    let sources: string[] = [];
    
    if (request.referenceFiles && request.referenceFiles.length > 0) {
      const processedFiles = await this.processReferenceFiles(request.referenceFiles);
      const categorizedFiles = this.categorizeFiles(processedFiles);
      
      referenceContent = this.extractRelevantContent(categorizedFiles);
      sources = processedFiles.map(f => f.fileName);
    }

    // 2. 网络搜索最新政策和数据
    let webSearchContent = '';
    if (request.enableWebSearch) {
      const searchQueries = [
        `${request.region} ${request.planType} 发展规划`,
        `${request.region} 产业发展 政策`,
        `${request.planType} 国家政策 指导意见`,
        `${request.region} 经济发展 数据 统计`
      ];

      for (const query of searchQueries) {
        try {
          const searchResults = await SearchService.searchWithFallback(query);
          if (searchResults.results.length > 0) {
            webSearchContent += `\n\n## ${query} 搜索结果:\n`;
            searchResults.results.slice(0, 3).forEach((result, index) => {
              webSearchContent += `${index + 1}. ${result.title}\n${result.snippet}\n来源: ${result.link}\n\n`;
              sources.push(result.title);
            });
          }
        } catch (error) {
          console.error(`搜索失败: ${query}`, error);
        }
      }
    }

    // 3. 获取模板
    const template = this.templates.find(t => t.id === request.templateType) || this.templates[0];

    // 4. 生成各个章节内容
    const generatedSections: GeneratedSection[] = [];
    
    for (const section of template.sections) {
      const sectionContent = await this.generateSection(
        section,
        request,
        referenceContent,
        webSearchContent
      );
      generatedSections.push(sectionContent);
    }

    // 5. 组合完整规划
    const fullContent = this.assembleFullPlanning(request, generatedSections);
    
    const totalWords = generatedSections.reduce((sum, section) => sum + section.wordCount, 0);

    return {
      id: `planning_${Date.now()}`,
      title: `${request.region}${request.planType}发展规划`,
      content: fullContent,
      sections: generatedSections,
      metadata: {
        totalWords,
        generatedAt: new Date(),
        sources: [...new Set(sources)] // 去重
      }
    };
  }

  // 生成单个章节内容
  private static async generateSection(
    section: PlanningSection,
    request: PlanningRequest,
    referenceContent: string,
    webSearchContent: string
  ): Promise<GeneratedSection> {
    
    const prompt = `你是一位资深的政府规划专家，正在为${request.region}编写${request.planType}发展规划的"${section.title}"章节。

章节要求：
- 需要包含以下子章节：${section.subsections.join('、')}
- 具体要求：${section.requirements}
- 最少字数：${section.minWords}字

参考资料：
${referenceContent || '暂无参考资料'}

最新政策和数据：
${webSearchContent || '暂无网络搜索结果'}

请根据以上资料，编写专业、详实的规划内容，要求：
1. 内容要符合政府规划文件的专业规范
2. 数据要准确，引用要恰当
3. 结构清晰，逻辑严密
4. 语言正式，表述准确
5. 确保字数达到要求

请直接输出章节内容，不需要额外说明：`;

    const result = await this.llm.invoke([{ role: 'user', content: prompt }]);
    const content = result.content?.toString() || '';
    const wordCount = this.countChineseWords(content);

    return {
      title: section.title,
      content,
      wordCount,
      sources: []
    };
  }

  // 组装完整规划文档
  private static assembleFullPlanning(request: PlanningRequest, sections: GeneratedSection[]): string {
    let fullContent = '';
    
    // 添加标题
    fullContent += `# ${request.region}${request.planType}发展规划\n\n`;
    
    // 添加目录
    fullContent += '## 目录\n\n';
    sections.forEach((section, index) => {
      fullContent += `${index + 1}. ${section.title}\n`;
    });
    fullContent += '\n---\n\n';

    // 添加各章节内容
    sections.forEach((section, index) => {
      fullContent += `## ${index + 1}. ${section.title}\n\n`;
      fullContent += section.content;
      fullContent += '\n\n---\n\n';
    });

    return fullContent;
  }

  // 导出为Word文档
  static async exportToWord(planning: GeneratedPlanning): Promise<Buffer> {
    const sections = [];

    // 封面
    sections.push(
      new Paragraph({
        text: planning.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: '',
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: `生成时间：${planning.metadata.generatedAt.toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `总字数：${planning.metadata.totalWords}字`,
        alignment: AlignmentType.CENTER,
      })
    );

    // 目录
    sections.push(
      new Paragraph({
        text: '目录',
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      })
    );

    planning.sections.forEach((section, index) => {
      sections.push(
        new Paragraph({
          text: `${index + 1}. ${section.title}`,
          spacing: { after: 120 }
        })
      );
    });

    // 正文内容
    planning.sections.forEach((section, index) => {
      sections.push(
        new Paragraph({
          text: `${index + 1}. ${section.title}`,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: index === 0,
        })
      );

      // 将内容按段落分割
      const paragraphs = section.content.split('\n\n');
      paragraphs.forEach(para => {
        if (para.trim()) {
          sections.push(
            new Paragraph({
              children: [new TextRun(para.trim())],
              spacing: { after: 200 }
            })
          );
        }
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }],
    });

    return await Packer.toBuffer(doc);
  }

  // 导出为PDF
  static async exportToPDF(planning: GeneratedPlanning): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 生成HTML内容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'SimSun', serif; margin: 40px; line-height: 1.6; }
          h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
          h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h3 { color: #2c3e50; }
          p { text-align: justify; margin-bottom: 15px; }
          .cover { text-align: center; margin-bottom: 50px; }
          .toc { margin-bottom: 30px; }
          .section { margin-bottom: 40px; }
          @page { margin: 2cm; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>${planning.title}</h1>
          <p>生成时间：${planning.metadata.generatedAt.toLocaleDateString()}</p>
          <p>总字数：${planning.metadata.totalWords}字</p>
        </div>
        
        <div class="toc">
          <h2>目录</h2>
          ${planning.sections.map((section, index) => 
            `<p>${index + 1}. ${section.title}</p>`
          ).join('')}
        </div>
        
        ${planning.sections.map((section, index) => `
          <div class="section">
            <h2>${index + 1}. ${section.title}</h2>
            ${section.content.split('\n\n').map(para => 
              para.trim() ? `<p>${para.trim()}</p>` : ''
            ).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '2cm',
        bottom: '2cm',
        left: '2cm',
        right: '2cm'
      }
    });

    await browser.close();
    return pdfBuffer;
  }

  // 辅助方法
  private static async processWordFile(filePath: string): Promise<any> {
    const buffer = fs.readFileSync(filePath);
    return await FileProcessor.processWord(buffer);
  }

  private static async processPdfFile(filePath: string): Promise<any> {
    const buffer = fs.readFileSync(filePath);
    return await FileProcessor.processPdf(buffer);
  }

  private static async processExcelFile(filePath: string): Promise<any> {
    const buffer = fs.readFileSync(filePath);
    return await FileProcessor.processExcel(buffer);
  }

  private static async processImageFile(filePath: string): Promise<any> {
    const buffer = fs.readFileSync(filePath);
    return await FileProcessor.processImage(buffer, filePath);
  }

  private static extractRelevantContent(categorizedFiles: any): string {
    let content = '';
    
    Object.entries(categorizedFiles).forEach(([category, files]: [string, any[]]) => {
      if (files.length > 0) {
        content += `\n\n## ${this.getCategoryName(category)}:\n`;
        files.forEach(file => {
          content += `\n### ${file.fileName}\n`;
          content += file.extractedText.substring(0, 2000) + '...\n';
        });
      }
    });

    return content;
  }

  private static getCategoryName(category: string): string {
    const names = {
      national_policies: '国家政策文件',
      provincial_plans: '省级规划文件',
      city_plans: '市级规划文件',
      industry_analysis: '行业分析报告',
      data_reports: '数据统计报告',
      other: '其他参考资料'
    };
    return names[category] || category;
  }

  private static countChineseWords(text: string): number {
    // 简单的中文字符计数
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
    return chineseChars ? chineseChars.length : 0;
  }
}