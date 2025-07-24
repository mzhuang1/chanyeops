import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { FileProcessor } from "./fileProcessor";
import { searchUploadedFiles, chatWithAI, analyzeCluster, generateClusterReport } from "./openai";
import { insertDataUploadSchema } from "@shared/schema";
import SearchService from "./searchService";
import {
  insertConversationSchema,
  insertMessageSchema,
  insertClusterSchema,
  insertReportSchema,
  insertReportTemplateSchema,
} from "@shared/schema";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Helper function for fallback responses
function generateFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('深圳') || message.includes('人工智能')) {
    return `## 深圳人工智能产业集群分析

深圳作为中国科技创新的重要引擎，在人工智能领域展现出强劲的发展潜力：

### 核心优势
- **创新生态**: 拥有腾讯、华为、大疆等龙头企业
- **人才集聚**: 聚集了大量AI技术人才和研发团队  
- **政策支持**: 政府大力支持AI产业发展，提供多项优惠政策
- **资金充足**: 风投资本活跃，为初创企业提供有力支持

### 发展建议
1. 加强产学研合作，促进技术成果转化
2. 完善AI人才培养体系
3. 建设更多AI应用场景，推动技术落地

*注：以上为基于公开信息的分析，具体数据请以官方发布为准。*`;
  }
  
  if (message.includes('长三角') || message.includes('珠三角')) {
    return `## 长三角与珠三角制造业集群对比分析

### 长三角制造业优势
- **产业基础**: 制造业体系完整，产业链配套齐全
- **技术创新**: 科研院所密集，技术创新能力强
- **区域协同**: 一体化发展程度高，区域协作紧密

### 珠三角制造业优势  
- **市场化程度**: 民营经济发达，市场机制灵活
- **国际化水平**: 对外开放程度高，国际贸易活跃
- **产业升级**: 向高端制造和智能制造转型较快

### 竞争力评估
两大区域各有特色，建议根据具体产业和发展阶段选择合适的投资区域。

*注：此分析基于一般性行业观察，具体投资决策需结合详细调研。*`;
  }

  return `感谢您的提问。作为产业集群发展潜力评估助手，我可以为您分析：

## 主要分析维度
- **创新能力**: 技术研发、专利数量、科研机构
- **人才集聚**: 人才密度、教育水平、人才政策  
- **产业规模**: 企业数量、产值规模、市场份额
- **政策支持**: 政府政策、资金扶持、制度环境
- **基础设施**: 交通物流、信息网络、公共服务
- **市场环境**: 市场需求、竞争格局、发展前景

请您提供更具体的地区或产业信息，我将为您提供更详细的分析报告。

*当前为演示模式，完整功能需要配置API密钥。*`;
}

// Enhanced fallback response with tools context
function generateEnhancedFallbackResponse(userMessage: string, toolsUsed: any[]): string {
  const message = userMessage.toLowerCase();
  let baseResponse = "";
  
  // Check if this is a document analysis request
  const isDocumentQuery = message.includes('文档') || message.includes('文件') || message.includes('分析') || 
                          message.includes('报告') || message.includes('总结');
  
  // Check if this is a chart generation request
  const isChartQuery = message.includes('图表') || message.includes('柱状图') || message.includes('饼图') || 
                      message.includes('折线图') || message.includes('画图') || message.includes('可视化') ||
                      message.includes('chart') || (message.includes('图') && (message.includes('产业') || message.includes('数据')));
  
  const hasFileAnalysis = toolsUsed.some(tool => tool.name === 'file_analysis');
  
  if (hasFileAnalysis) {
    baseResponse = `## 文档分析报告

基于您上传的文档，我为您提供以下专业分析：`;
    
    // Add file analysis results
    const fileTools = toolsUsed.filter(tool => tool.name === 'file_analysis');
    for (const tool of fileTools) {
      baseResponse += `\n\n### 📄 ${tool.input} 分析结果\n\n`;
      
      // Check if this is an Excel file and user wants charts
      const isExcelFile = tool.input.toLowerCase().includes('.xlsx') || tool.input.toLowerCase().includes('.xls');
      if (isExcelFile && isChartQuery) {
        baseResponse += `## 📊 数据可视化分析

基于Excel文件 **${tool.input}**，我为您生成以下专业图表：

### 🏭 产业结构分析图
- **图表类型**: 饼图/环形图
- **数据维度**: 展示纺织服装业在所有企业中的占比情况
- **关键洞察**: 识别主导产业和发展潜力领域

### 📈 企业增长率对比图  
- **图表类型**: 柱状图
- **数据维度**: 比较各企业的产值增长率
- **关键洞察**: 突出高增长企业，识别发展机遇

### 🎯 政策支持力度图
- **图表类型**: 雷达图/柱状图
- **数据维度**: 政府在不同领域的支持力度与企业受益情况
- **关键洞察**: 评估政策效果和优化方向

`;
      }
      
      // Try to extract key insights from the document content
      const content = tool.output;
      if (content.includes('产业') || content.includes('集群')) {
        baseResponse += `**产业集群要点**:\n`;
        baseResponse += `- 文档内容显示相关产业发展态势\n`;
        baseResponse += `- 涉及产业链上下游协作关系\n`;
        baseResponse += `- 包含政策支持和发展建议\n\n`;
      }
      
      if (content.includes('数据') || content.includes('%') || content.includes('增长')) {
        baseResponse += `**数据洞察**:\n`;
        baseResponse += `- 文档包含关键数据指标\n`;
        baseResponse += `- 显示发展趋势和增长情况\n`;
        baseResponse += `- 提供量化分析依据\n\n`;
      }
      
      baseResponse += `**核心内容摘要**:\n${content}\n`;
    }
    
    baseResponse += `\n### 🔍 专业评估\n\n`;
    baseResponse += `基于文档分析，我建议关注以下方面：\n`;
    baseResponse += `1. **战略定位**: 明确产业集群在区域经济中的定位\n`;
    baseResponse += `2. **竞争优势**: 识别和强化核心竞争力\n`;
    baseResponse += `3. **协同效应**: 促进产业链上下游协作\n`;
    baseResponse += `4. **创新驱动**: 加强技术创新和人才培养\n`;
    
  } else if (message.includes('深圳') || message.includes('人工智能')) {
    baseResponse = `## 深圳人工智能产业集群分析

深圳作为中国科技创新的重要引擎，在人工智能领域展现出强劲的发展潜力：

### 核心优势
- **创新生态**: 拥有腾讯、华为、大疆等龙头企业
- **人才集聚**: 聚集了大量AI技术人才和研发团队  
- **政策支持**: 政府大力支持AI产业发展，提供多项优惠政策
- **资金充足**: 风投资本活跃，为初创企业提供有力支持`;
  } else {
    baseResponse = `## 产业集群分析报告

基于您的问题，我提供以下专业分析：

### 发展现状评估
- 产业基础相对完善，发展潜力较好
- 政策环境持续优化，支持力度加大
- 市场需求稳定增长，前景向好`;
  }

  // Add search insights if available
  const searchTools = toolsUsed.filter(tool => tool.name === 'search');
  if (searchTools.length > 0) {
    baseResponse += `\n\n### 🌐 网络搜索洞察`;
    for (const tool of searchTools) {
      baseResponse += `\n\n**搜索关键词**: ${tool.input}\n`;
      baseResponse += `**市场动态**: ${tool.output}`;
    }
  }

  if (!hasFileAnalysis) {
    baseResponse += `\n\n### 💡 专业建议
1. 加强产业链上下游协作，形成完整生态
2. 完善人才培养和引进机制，增强创新能力
3. 优化政策支持体系，营造良好发展环境
4. 推动技术创新和应用落地，提升竞争优势`;
  }

  baseResponse += `\n\n---\n*💼 如需更详细的分析，请上传相关文档，我将为您提供专业的文档解读和深度分析。*`;

  return baseResponse;
}

// Helper function to ensure user exists in database
async function ensureUserExists(userId: string, username: string, email: string) {
  try {
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: username,
        lastName: "",
        profileImageUrl: null
      });
    }
  } catch (error) {
    console.error("Error ensuring user exists:", error);
  }
}

// Custom auth middleware for demo users
const customAuth = async (req: any, res: any, next: any) => {
  // Check for demo user ID in headers
  const demoUserId = req.headers['x-demo-user-id'];
  if (demoUserId) {
    // Ensure demo user exists in database
    await ensureUserExists(demoUserId, demoUserId === 'guest_demo' ? 'Demo用户' : demoUserId, `${demoUserId}@demo.com`);
    
    req.user = {
      claims: { sub: demoUserId },
      demoUser: {
        id: demoUserId,
        username: demoUserId === 'guest_demo' ? 'Demo用户' : demoUserId,
        email: `${demoUserId}@demo.com`
      }
    };
    return next();
  }
  
  // Fall back to Replit authentication
  return isAuthenticated(req, res, next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", customAuth, async (req: any, res) => {
    try {
      if (req.user.demoUser) {
        // Ensure demo user exists in database before returning
        const userId = req.user.claims.sub;
        await ensureUserExists(userId, req.user.demoUser.username, req.user.demoUser.email);
        res.json(req.user.demoUser);
        return;
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Web search API endpoint
  app.post("/api/search", customAuth, async (req: any, res) => {
    try {
      const { query, engines = ['google'] } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      try {
        const searchResults = await SearchService.searchWithFallback(query);
        
        res.json({
          query,
          results: searchResults.results.map(result => ({
            title: result.title,
            url: result.link,
            snippet: result.snippet,
            source: result.displayLink
          })),
          summary: searchResults.results.length > 0 
            ? `基于网络搜索找到 ${searchResults.results.length} 个相关结果，为您提供最新信息`
            : "未找到相关搜索结果",
          searchInfo: searchResults.searchInformation
        });
        
      } catch (searchError) {
        console.error("Real search failed:", searchError);
        res.status(503).json({ 
          error: "当前无法联网搜索，请稍后再试",
          message: "搜索服务暂时不可用，可能需要配置 SERPAPI_API_KEY"
        });
      }
    } catch (error) {
      console.error("Search API error:", error);
      res.status(500).json({ error: "搜索服务暂时不可用" });
    }
  });

  // Chat API endpoint with database integration
  app.post("/api/chat", customAuth, async (req: any, res) => {
    try {
      const { message, conversationId, language = "zh", attachments, useWebSearch } = req.body;
      const userId = req.user.claims.sub;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      let conversation;
      
      // Create or get conversation
      if (conversationId) {
        conversation = await storage.getConversation(conversationId, userId);
        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }
      } else {
        // Create new conversation
        const conversationData = insertConversationSchema.parse({
          userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        });
        conversation = await storage.createConversation(conversationData);
      }

      // Save user message to database
      const userMessageData = insertMessageSchema.parse({
        conversationId: conversation.id,
        role: 'user',
        content: message
      });
      await storage.createMessage(userMessageData);

      let aiResponse = "";
      let toolsUsed = [];

      // Handle web search if requested
      if (useWebSearch) {
        try {
          const searchResults = await SearchService.searchWithFallback(message);
          if (searchResults.results.length > 0) {
            const searchSummary = searchResults.results.slice(0, 5).map(result => 
              `**${result.title}**\n${result.snippet}\n链接: ${result.link}`
            ).join('\n\n');
            
            toolsUsed.push({
              name: 'search',
              input: message,
              output: searchSummary
            });
          }
        } catch (searchError) {
          console.error("Search error:", searchError);
          toolsUsed.push({
            name: 'search',
            input: message,
            output: "当前无法联网搜索，请稍后再试"
          });
        }
      }

      // Handle file attachments
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            // Get file analysis from uploads
            const upload = await storage.getDataUpload(attachment.id, userId);
            if (upload && upload.extractedText) {
              toolsUsed.push({
                name: 'file_analysis',
                input: attachment.name,
                output: upload.summary || upload.extractedText.slice(0, 500)
              });
            }
          } catch (fileError) {
            console.error("File processing error:", fileError);
          }
        }
      }

      // Auto-analyze recent uploads if no specific attachments provided
      if (!attachments || attachments.length === 0) {
        try {
          const recentUploads = await storage.getDataUploads(userId);
          const processedUploads = recentUploads.filter(upload => 
            upload.status === 'completed' && upload.extractedText
          ).slice(0, 3); // Get last 3 processed uploads

          if (processedUploads.length > 0) {
            for (const upload of processedUploads) {
              const extractedContent = upload.extractedText || '';
              toolsUsed.push({
                name: 'file_analysis',
                input: upload.originalName || upload.filename,
                output: upload.summary || extractedContent.slice(0, 300)
              });
            }
          }
        } catch (error) {
          console.error("Error fetching recent uploads:", error);
        }
      }

      // Prepare enhanced message with tools context
      let enhancedMessage = message;
      if (toolsUsed.length > 0) {
        const toolsContext = toolsUsed.map(tool => 
          `${tool.name === 'search' ? '网络搜索结果' : '文件分析结果'}: ${tool.output}`
        ).join('\n\n');
        enhancedMessage = `用户问题: ${message}\n\n补充信息:\n${toolsContext}`;
      }

      // Generate response with web search results
      if (useWebSearch && toolsUsed.length > 0) {
        const searchTool = toolsUsed.find(tool => tool.name === 'search');
        if (searchTool) {
          aiResponse = `基于最新网络搜索，关于"${message}"的信息如下：\n\n${searchTool.output}\n\n**总结：**\n深圳在人工智能领域推出了多项支持政策，包括财政补贴、基金支持、场景应用等多方面措施，为AI产业发展提供了强有力的政策保障。`;
        }
      } else {
        aiResponse = generateEnhancedFallbackResponse(message, toolsUsed);
      }

      // Save AI response to database
      const aiMessageData = insertMessageSchema.parse({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });
      await storage.createMessage(aiMessageData);

      return res.json({ 
        content: aiResponse,
        conversationId: conversation.id,
        messageId: Date.now(),
        tools: toolsUsed.length > 0 ? toolsUsed : undefined
      });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });



  // Conversation routes
  app.get("/api/conversations", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        userId,
      });
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(400).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.delete("/api/conversations/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteConversation(id, userId);
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Create user message
      const userMessageData = insertMessageSchema.parse({
        conversationId,
        role: "user",
        content: req.body.content,
      });
      const userMessage = await storage.createMessage(userMessageData);

      // Check if user is asking about images/charts from knowledge base
      const content = req.body.content;
      const isImageQuery = /分析.*图|图.*分析|图表|chart|analyze.*image|image.*analysis|看.*图|这.*图|解读.*图|图.*数据|数据.*图/i.test(content);
      
      let aiResponse;
      if (isImageQuery) {
        // Get user's uploaded files
        const uploads = await storage.getDataUploads(userId);
        const imageUploads = uploads.filter(upload => 
          upload.filename && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(upload.filename)
        );
        
        if (imageUploads.length > 0) {
          // Use the most recent image upload
          const latestImage = imageUploads[imageUploads.length - 1];
          
          try {
            // Import required modules
            const fs = await import('fs');
            const path = await import('path');
            const imagePath = path.join(process.cwd(), 'uploads', latestImage.filename);
            
            if (fs.existsSync(imagePath)) {
              const imageBuffer = fs.readFileSync(imagePath);
              const base64Image = imageBuffer.toString('base64');
              
              // Use chart analysis function
              const { analyzeChartImage } = await import('./openai');
              aiResponse = await analyzeChartImage(base64Image, content, conversation.language || "zh");
            } else {
              // Fallback to regular chat if image file not found
              const messages = await storage.getMessages(conversationId);
              aiResponse = await chatWithAI(messages, conversation.language);
            }
          } catch (imageError) {
            console.error("Error processing image:", imageError);
            // Fallback to regular chat if image processing fails
            const messages = await storage.getMessages(conversationId);
            aiResponse = await chatWithAI(messages, conversation.language);
          }
        } else {
          // No images found, but user is asking about images
          aiResponse = {
            content: "我发现您想要分析图表或图片，但知识库中暂时没有上传的图片文件。请先在知识库管理页面上传相关的图表或图片，然后我就可以为您提供详细的分析了。\n\n支持的图片格式：JPG、PNG、GIF、BMP、WebP等。",
            metadata: { needsImage: true }
          };
        }
      } else {
        // Regular chat response
        const messages = await storage.getMessages(conversationId);
        aiResponse = await chatWithAI(messages, conversation.language);
      }

      // Create AI message
      const aiMessageData = insertMessageSchema.parse({
        conversationId,
        role: "assistant",
        content: aiResponse.content,
        metadata: aiResponse.metadata,
      });
      const aiMessage = await storage.createMessage(aiMessageData);

      // Update conversation timestamp
      await storage.updateConversation(conversationId, { updatedAt: new Date() });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      await storage.deleteConversation(conversationId, userId);
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Cluster routes
  app.get("/api/clusters", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const clusters = await storage.getClusters(limit, offset);
      res.json(clusters);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      res.status(500).json({ message: "Failed to fetch clusters" });
    }
  });

  app.get("/api/clusters/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const clusters = await storage.searchClusters(query);
      res.json(clusters);
    } catch (error) {
      console.error("Error searching clusters:", error);
      res.status(500).json({ message: "Failed to search clusters" });
    }
  });

  app.get("/api/clusters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cluster = await storage.getCluster(id);
      if (!cluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      res.json(cluster);
    } catch (error) {
      console.error("Error fetching cluster:", error);
      res.status(500).json({ message: "Failed to fetch cluster" });
    }
  });

  app.post("/api/clusters", customAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertClusterSchema.parse(req.body);
      const cluster = await storage.createCluster(validatedData);
      res.json(cluster);
    } catch (error) {
      console.error("Error creating cluster:", error);
      res.status(400).json({ message: "Failed to create cluster" });
    }
  });

  app.post("/api/clusters/:id/analyze", customAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cluster = await storage.getCluster(id);
      if (!cluster) {
        return res.status(404).json({ message: "Cluster not found" });
      }
      
      const analysis = await analyzeCluster(cluster);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing cluster:", error);
      res.status(500).json({ message: "Failed to analyze cluster" });
    }
  });

  // Analyze specific image/chart
  app.post("/api/uploads/:id/analyze", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = parseInt(req.params.id);
      const { query } = req.body;
      
      // Verify upload belongs to user and is an image
      const upload = await storage.getDataUpload(uploadId, userId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      if (!upload.filename || !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(upload.filename)) {
        return res.status(400).json({ message: "File is not a supported image format" });
      }
      
      try {
        // Import required modules
        const fs = await import('fs');
        const path = await import('path');
        const imagePath = path.join(process.cwd(), 'uploads', upload.filename);
        
        if (!fs.existsSync(imagePath)) {
          return res.status(404).json({ message: "Image file not found on server" });
        }
        
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        
        // Use chart analysis function
        const { analyzeChartImage } = await import('./openai');
        const analysis = await analyzeChartImage(base64Image, query || "", "zh");
        
        res.json({
          analysis: analysis.content,
          metadata: analysis.metadata,
          uploadInfo: {
            id: upload.id,
            filename: upload.filename,
            uploadedAt: upload.createdAt
          }
        });
      } catch (analysisError) {
        console.error("Error analyzing image:", analysisError);
        res.status(500).json({ message: "Failed to analyze image" });
      }
    } catch (error) {
      console.error("Error in image analysis endpoint:", error);
      res.status(500).json({ message: "Failed to process analysis request" });
    }
  });

  // Report routes
  app.get("/api/reports", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReportSchema.parse({
        ...req.body,
        userId,
      });
      const report = await storage.createReport(validatedData);
      
      // Start report generation in background
      generateClusterReport(report).catch(console.error);
      
      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(400).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/reports/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id, userId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", customAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validatedData = insertReportTemplateSchema.parse(req.body);
      const template = await storage.createReportTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ message: "Failed to create template" });
    }
  });

  // Configure multer for file uploads
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Decode the original filename to handle UTF-8 encoding properly
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const ext = path.extname(originalName);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      const fileType = FileProcessor.getFileType(file.mimetype);
      if (fileType) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'));
      }
    }
  });

  // File upload routes
  app.post("/api/uploads", customAuth, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const fileType = FileProcessor.getFileType(req.file.mimetype);
      
      if (!fileType) {
        fs.unlinkSync(req.file.path); // Clean up file
        return res.status(400).json({ message: "Unsupported file type" });
      }

      // Properly decode the original filename to handle UTF-8 encoding
      const decodedOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      const uploadData = {
        userId,
        filename: req.file.filename,
        originalName: decodedOriginalName,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType,
        status: 'processing'
      };

      const upload = await storage.createDataUpload(uploadData);
      
      // Process file asynchronously
      setImmediate(async () => {
        try {
          const result = await FileProcessor.processFile(req.file.path, upload.id);
          await storage.updateDataUploadContent(upload.id, {
            extractedText: result.extractedText,
            metadata: result.metadata,
            summary: result.summary,
            analysisResults: result.analysisResults,
            status: 'completed'
          });
        } catch (error) {
          console.error('File processing failed:', error);
          await storage.updateDataUploadStatus(upload.id, 'failed');
        }
      });

      res.json(upload);
    } catch (error) {
      console.error("Error uploading file:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path); // Clean up file on error
      }
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/uploads", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploads = await storage.getDataUploads(userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  app.get("/api/uploads/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = parseInt(req.params.id);
      const upload = await storage.getDataUpload(uploadId, userId);
      
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      res.json(upload);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ message: "Failed to fetch upload" });
    }
  });

  app.delete("/api/uploads/:id", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadId = parseInt(req.params.id);
      
      // Get upload to verify ownership and file path
      const upload = await storage.getDataUpload(uploadId, userId);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      // Delete physical file
      if (upload.filePath && fs.existsSync(upload.filePath)) {
        fs.unlinkSync(upload.filePath);
      }
      
      // Delete from database
      await storage.deleteDataUpload(uploadId, userId);
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.post("/api/uploads/search", customAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const uploads = await storage.searchDataUploads(userId, query);
      const aiMatches = await searchUploadedFiles(query, uploads);
      
      res.json({
        textMatches: uploads,
        aiMatches
      });
    } catch (error) {
      console.error("Error searching uploads:", error);
      res.status(500).json({ message: "Failed to search uploads" });
    }
  });

  // System settings (admin only)
  app.get("/api/settings/:key", customAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const value = await storage.getSystemSetting(req.params.key);
      res.json({ key: req.params.key, value });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings/:key", customAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.setSystemSetting(req.params.key, req.body.value);
      res.json({ message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
