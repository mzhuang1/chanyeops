import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as iconv from "iconv-lite";
import { z } from "zod";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { FileProcessor } from "./fileProcessor";
import { searchUploadedFiles, chatWithAI, analyzeCluster, generateClusterReport } from "./openai";
import { agentExecutor } from "./agent/agentExecutor";
import { insertDataUploadSchema } from "@shared/schema";
import SearchService from "./searchService";
import { createQAnythingService } from "./qanythingService";
import {
  insertConversationSchema,
  insertMessageSchema,
  insertClusterSchema,
  insertReportSchema,
  insertReportTemplateSchema,
} from "@shared/schema";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      // Generate unique filename while preserving extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Fix filename encoding for proper extension extraction
      let originalName = file.originalname;
      try {
        // Try to decode Chinese filenames properly
        const buffer = Buffer.from(originalName, 'latin1');
        const decoded = buffer.toString('utf8');
        if (/[\u4e00-\u9fff]/.test(decoded)) {
          originalName = decoded;
        }
      } catch (error) {
        // Fallback to original if decoding fails
      }
      const ext = originalName.split('.').pop() || 'bin';
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Helper function for fallback responses
function generateFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('hello') || message.includes('hi') || message.includes('你好')) {
    return "您好！我是智能评估与规划助手，专门为您提供产业集群发展潜力评估和分析服务。我可以帮您分析数据、生成报告、制定发展策略。请问您希望我为您提供什么帮助？";
  }
  
  if (message.includes('cluster') || message.includes('产业') || message.includes('集群')) {
    return "我可以帮您分析产业集群，包括市场趋势、发展机遇和政策建议。您是希望我搜索特定的集群信息，还是分析您的数据？";
  }
  
  if (message.includes('report') || message.includes('报告')) {
    return "我可以基于您的数据和需求生成全面的报告。请上传您的数据文件或说明您需要什么类型的报告。";
  }
  
  return "您好！我是智能评估与规划助手，可以帮您进行数据分析、报告生成和产业集群洞察。请您具体说明希望我为您提供什么帮助？";
}

function generateEnhancedFallbackResponse(userMessage: string, toolsUsed: any[]): string {
  let response = generateFallbackResponse(userMessage);
  
  if (toolsUsed.length > 0) {
    const toolNames = toolsUsed.map(tool => tool.name).join(', ');
    response += `\n\n我尝试使用了这些工具来帮助您：${toolNames}。但遇到了一些技术问题。请尝试重新表述您的问题，或者如果问题持续存在请联系技术支持。`;
  }
  
  return response;
}

// Helper function to get current user ID from request
function getCurrentUserId(req: any): string {
  // Check for demo user header first
  const demoUserId = req.headers['x-demo-user-id'] as string;
  if (demoUserId) {
    return demoUserId;
  }
  
  // Fallback to authenticated user or generate demo ID
  if (req.user && req.user.claims && req.user.claims.sub) {
    return req.user.claims.sub;
  }
  
  // Development fallback
  return 'demo-user-' + Date.now();
}

async function ensureUserExists(userId: string, username?: string, email?: string) {
  try {
    let user = await storage.getUser(userId);
    if (!user) {
      user = await storage.upsertUser({
        id: userId,
        email: email || `demo-${userId}@example.com`,
        firstName: username || 'Demo',
        lastName: 'User',
        role: 'user'
      });
    }
    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Web Search API endpoint
  app.post("/api/search", isAuthenticated, async (req, res) => {
    try {
      const { query, engines = ['google'] } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      console.log(`Performing search for: "${query}" using engines: ${engines.join(', ')}`);
      
      const searchResults = await SearchService.multiEngineSearch(query, engines);
      
      console.log(`Search completed. Found ${searchResults.results.length} results`);
      
      res.json({
        query,
        engines,
        results: searchResults.results,
        searchInformation: searchResults.searchInformation
      });
    } catch (error) {
      console.error("Search API error:", error);
      res.status(500).json({ 
        error: "Search service temporarily unavailable",
        message: "Please try again later or contact support if the issue persists."
      });
    }
  });

  // Chat API endpoint with web search integration
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, conversationId, enableWebSearch, attachments, language = 'zh' } = req.body;
      const userId = getCurrentUserId(req);

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Ensure user exists in database
      await ensureUserExists(userId);

      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId, userId);
        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }
      } else {
        const conversationData = insertConversationSchema.parse({
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
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
      const toolsUsed: any[] = [];
      
      // Get user's uploaded files for context
      const userUploads = await storage.getDataUploads(userId);
      let fileContext = "";
      
      if (userUploads.length > 0) {
        // Include recently uploaded files content in the analysis
        const recentFiles = userUploads.slice(0, 5); // Use last 5 uploaded files
        for (const upload of recentFiles) {
          if (upload.extractedText && upload.summary) {
            fileContext += `\n\n=== 文件: ${upload.originalName} ===\n`;
            fileContext += `文件摘要: ${upload.summary}\n`;
            if (upload.extractedText.length > 2000) {
              fileContext += `文件内容摘录: ${upload.extractedText.substring(0, 2000)}...\n`;
            } else {
              fileContext += `文件内容: ${upload.extractedText}\n`;
            }
          }
        }
        
        if (fileContext) {
          toolsUsed.push({
            name: 'file_analysis',
            input: `分析了${recentFiles.length}个上传的文件`,
            output: `包含${recentFiles.map(f => f.originalName).join(', ')}等文件的内容`
          });
        }
      }

      // Handle web search if enabled
      if (enableWebSearch) {
        try {
          console.log("Web search enabled, performing search...");
          const searchResults = await SearchService.searchWithFallback(message);
          
          if (searchResults.results.length > 0) {
            toolsUsed.push({
              name: 'web_search',
              input: message,
              output: searchResults
            });

            // Format search results for AI response
            const formattedResults = searchResults.results.slice(0, 5).map((result, index) => 
              `${index + 1}. **${result.title}**\n   ${result.snippet}\n   [${language === 'zh' ? '查看详情' : 'View Details'}](${result.link})`
            ).join('\n\n');

            aiResponse = language === 'zh' 
              ? `基于网络搜索结果，我为您找到了以下信息：\n\n${formattedResults}\n\n这些搜索结果应该能帮助您了解相关信息。如果您需要更具体的分析或有其他问题，请告诉我。`
              : `Based on web search results, I found the following information:\n\n${formattedResults}\n\nThese search results should help you understand the relevant information. If you need more specific analysis or have other questions, please let me know.`;
          } else {
            aiResponse = language === 'zh' 
              ? "抱歉，我没有找到相关的搜索结果。请尝试使用不同的关键词，或者我可以基于我的知识为您提供帮助。"
              : "Sorry, I couldn't find relevant search results. Please try using different keywords, or I can help you based on my knowledge.";
          }
        } catch (searchError) {
          console.error("Search error:", searchError);
          toolsUsed.push({
            name: 'web_search',
            input: message,
            error: searchError.message
          });
          aiResponse = language === 'zh' 
            ? "搜索服务暂时不可用，但我仍然可以基于我的知识为您提供帮助。请问您想了解什么？"
            : "Search service is temporarily unavailable, but I can still help you based on my knowledge. What would you like to know?";
        }
      } else {
        // Use AI chat when web search is disabled
        try {
          const messages = await storage.getMessages(conversation.id);
          const chatMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

          // Add current user message with file context if available
          let enhancedMessage = message;
          if (fileContext) {
            enhancedMessage = `${message}\n\n=== 上下文：已上传的文件内容 ===${fileContext}`;
          }

          // Replace the last message with the enhanced version if it's the current user message
          const enhancedChatMessages = [...chatMessages];
          if (enhancedChatMessages.length > 0 && enhancedChatMessages[enhancedChatMessages.length - 1].content === message) {
            enhancedChatMessages[enhancedChatMessages.length - 1].content = enhancedMessage;
          }

          const aiChatResponse = await chatWithAI(enhancedChatMessages, language, enableWebSearch);
          aiResponse = aiChatResponse.content;

          if (aiChatResponse.metadata) {
            toolsUsed.push({
              name: 'ai_analysis',
              input: message,
              output: aiChatResponse.metadata
            });
          }
        } catch (aiError) {
          console.error("AI Chat error:", aiError);
          aiResponse = generateFallbackResponse(message);
        }
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
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getMessages(conversationId);
      res.json({ conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      
      const { title, language } = req.body;
      
      // Generate unique title if using default
      let conversationTitle = title;
      if (!title || title === '新对话' || title === 'New Conversation') {
        const existingConversations = await storage.getConversations(userId);
        const defaultTitlePrefix = language === 'en' ? 'New Conversation' : '新对话';
        const defaultTitleCount = existingConversations.filter(conv => 
          conv.title.startsWith(defaultTitlePrefix)
        ).length;
        
        conversationTitle = defaultTitleCount === 0 ? '新对话' : `新对话 ${defaultTitleCount + 1}`;
      }
      
      const conversationData = insertConversationSchema.parse({
        userId,
        title: conversationTitle,
        language: language || 'zh'
      });
      
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.patch("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      const { title } = req.body;
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Valid title is required" });
      }
      
      // Verify conversation exists and belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await storage.updateConversation(conversationId, userId, { title: title.trim() });
      const updatedConversation = await storage.getConversation(conversationId, userId);
      
      res.json(updatedConversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.post("/api/conversations/:id/archive", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      // Verify conversation exists and belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await storage.updateConversation(conversationId, userId, { archived: true });
      res.json({ success: true, message: "Conversation archived successfully" });
    } catch (error) {
      console.error("Error archiving conversation:", error);
      res.status(500).json({ error: "Failed to archive conversation" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      await storage.deleteConversation(conversationId, userId);
      res.json({ success: true, message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ 
        error: "Failed to delete conversation",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      const { content, enableWebSearch = false, language = 'zh' } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Verify conversation exists and belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Save user message
      const userMessageData = insertMessageSchema.parse({
        conversationId,
        role: 'user',
        content
      });
      const userMessage = await storage.createMessage(userMessageData);

      // Generate AI response
      let aiResponse = "";
      const toolsUsed: any[] = [];

      try {
        // Get conversation history for context
        const messages = await storage.getMessages(conversationId);
        const chatMessages = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        // Handle web search if enabled
        if (enableWebSearch) {
          try {
            console.log("Web search enabled for message:", content);
            const searchResults = await SearchService.searchWithFallback(content);
            
            if (searchResults.results.length > 0) {
              toolsUsed.push({
                name: 'web_search',
                input: content,
                output: searchResults.results.slice(0, 5).map(result => 
                  `**${result.title}**\n${result.snippet}\n链接: ${result.link}`
                ).join('\n\n')
              });
            }
          } catch (searchError: any) {
            console.error("Search error:", searchError);
            toolsUsed.push({
              name: 'web_search',
              input: content,
              output: "当前无法联网搜索，请稍后再试"
            });
          }
        }

        // Generate AI response using chat history
        const aiChatResponse = await chatWithAI(chatMessages, language, enableWebSearch);
        aiResponse = aiChatResponse.content;

        if (aiChatResponse.metadata) {
          toolsUsed.push({
            name: 'ai_analysis',
            input: content,
            output: aiChatResponse.metadata
          });
        }
      } catch (aiError: any) {
        console.error("AI response generation error:", aiError);
        aiResponse = generateFallbackResponse(content);
      }

      // Save AI response
      const aiMessageData = insertMessageSchema.parse({
        conversationId,
        role: 'assistant',
        content: aiResponse
      });
      const aiMessage = await storage.createMessage(aiMessageData);

      res.json({
        userMessage,
        aiMessage,
        tools: toolsUsed.length > 0 ? toolsUsed : undefined
      });

    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Delete message
  app.delete("/api/conversations/:id/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messageId = parseInt(req.params.messageId);
      const userId = getCurrentUserId(req);
      
      if (isNaN(conversationId) || isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid conversation or message ID" });
      }
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await storage.deleteMessage(messageId, conversationId);
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ 
        error: "Failed to delete message",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cluster routes
  app.get("/api/clusters", async (req, res) => {
    try {
      const { limit = 50, offset = 0, region, industry } = req.query;
      
      let clusters;
      if (region) {
        clusters = await storage.getClustersByRegion(region as string);
      } else if (industry) {
        clusters = await storage.getClustersByIndustry(industry as string);
      } else {
        clusters = await storage.getClusters(Number(limit), Number(offset));
      }
      
      res.json(clusters);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      res.status(500).json({ error: "Failed to fetch clusters" });
    }
  });

  app.get("/api/clusters/:id", async (req, res) => {
    try {
      const clusterId = parseInt(req.params.id);
      const cluster = await storage.getCluster(clusterId);
      
      if (!cluster) {
        return res.status(404).json({ error: "Cluster not found" });
      }
      
      res.json(cluster);
    } catch (error) {
      console.error("Error fetching cluster:", error);
      res.status(500).json({ error: "Failed to fetch cluster" });
    }
  });

  app.post("/api/clusters", isAuthenticated, async (req, res) => {
    try {
      const clusterData = insertClusterSchema.parse(req.body);
      const cluster = await storage.createCluster(clusterData);
      res.status(201).json(cluster);
    } catch (error) {
      console.error("Error creating cluster:", error);
      res.status(500).json({ error: "Failed to create cluster" });
    }
  });

  app.get("/api/clusters/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      const clusters = await storage.searchClusters(query);
      res.json(clusters);
    } catch (error) {
      console.error("Error searching clusters:", error);
      res.status(500).json({ error: "Failed to search clusters" });
    }
  });

  // Report routes
  app.get("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const reports = await storage.getReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const reportData = insertReportSchema.parse({
        ...req.body,
        userId,
        status: 'pending'
      });
      
      const report = await storage.createReport(reportData);
      
      // Trigger report generation in background
      generateClusterReport(report).catch(error => {
        console.error("Error generating report:", error);
      });
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/reports/:id", isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      const report = await storage.getReport(reportId, userId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const templateData = insertReportTemplateSchema.parse(req.body);
      const template = await storage.createReportTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // File upload routes
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log('File upload details:', req.file);

      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const filename = req.file.filename || 'unknown';
      // Fix Chinese character encoding in file names
      let originalName = req.file.originalname || req.file.filename || 'unknown';
      try {
        // Handle common encoding issues with Chinese filenames
        if (originalName && typeof originalName === 'string') {
          // First try: decode from latin1 to utf8 (common browser upload encoding)
          const buffer = Buffer.from(originalName, 'latin1');
          const utf8Decoded = buffer.toString('utf8');
          
          // Check if the decoded string contains valid Chinese characters
          if (/[\u4e00-\u9fff]/.test(utf8Decoded)) {
            originalName = utf8Decoded;
          } else {
            // Second try: use iconv for GBK encoding (common in Windows systems)
            try {
              const gbkDecoded = iconv.decode(buffer, 'gbk');
              if (/[\u4e00-\u9fff]/.test(gbkDecoded)) {
                originalName = gbkDecoded;
              }
            } catch (gbkError) {
              // Keep original if all encoding attempts fail
              console.log('GBK decoding failed:', gbkError);
            }
          }
        }
      } catch (error) {
        console.log('File name encoding fix failed, using original:', originalName);
      }
      const filePath = req.file.path;
      const fileSize = req.file.size || 0;
      const mimeType = req.file.mimetype || 'application/octet-stream';

      // Determine file type from mime type
      const getFileType = (mimeType: string): string => {
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
        if (mimeType.includes('csv')) return 'csv';
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint';
        if (mimeType.includes('image')) return 'image';
        if (mimeType.includes('json')) return 'json';
        return 'other';
      };

      // Create upload record
      const uploadData = insertDataUploadSchema.parse({
        userId,
        filename: originalName,
        originalName,
        filePath,
        fileSize,
        mimeType,
        fileType: getFileType(mimeType),
        status: 'processing'
      });

      const upload = await storage.createDataUpload(uploadData);

      // Process file in background
      FileProcessor.processFile(filePath, upload.id)
        .then(async (result) => {
          await storage.updateDataUploadContent(upload.id, {
            extractedText: result.extractedText,
            metadata: result.metadata,
            summary: result.summary,
            status: 'completed'
          });
        })
        .catch(async (error) => {
          console.error("File processing error:", error);
          await storage.updateDataUploadStatus(upload.id, 'failed');
        });

      res.status(201).json(upload);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/uploads", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const uploads = await storage.getDataUploads(userId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ error: "Failed to fetch uploads" });
    }
  });

  app.get("/api/uploads/:id", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      const upload = await storage.getDataUpload(uploadId, userId);
      if (!upload) {
        return res.status(404).json({ error: "Upload not found" });
      }
      
      res.json(upload);
    } catch (error) {
      console.error("Error fetching upload:", error);
      res.status(500).json({ error: "Failed to fetch upload" });
    }
  });

  app.delete("/api/uploads/:id", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      await storage.deleteDataUpload(uploadId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting upload:", error);
      res.status(500).json({ error: "Failed to delete upload" });
    }
  });

  app.get("/api/uploads/search/:query", isAuthenticated, async (req, res) => {
    try {
      const query = req.params.query;
      const userId = getCurrentUserId(req);
      
      const uploads = await storage.searchDataUploads(userId, query);
      res.json(uploads);
    } catch (error) {
      console.error("Error searching uploads:", error);
      res.status(500).json({ error: "Failed to search uploads" });
    }
  });

  // Planning API routes
  app.get("/api/planning/templates", async (req, res) => {
    try {
      const templates = await storage.getPlanningTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching planning templates:", error);
      res.status(500).json({ error: "Failed to fetch planning templates" });
    }
  });

  app.get("/api/planning/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const projects = await storage.getPlanningProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching planning projects:", error);
      res.status(500).json({ error: "Failed to fetch planning projects" });
    }
  });

  app.post("/api/planning/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      const { title, region, planType, templateId, enableWebSearch, referenceFiles, localFilePath } = req.body;
      
      const projectData = {
        userId,
        title,
        region,
        planType,
        templateId: templateId ? parseInt(templateId) : null,
        enableWebSearch: Boolean(enableWebSearch),
        referenceFiles: referenceFiles || [],
        localFilePath: localFilePath || null,
        status: 'draft',
        progress: 0
      };

      const project = await storage.createPlanningProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating planning project:", error);
      res.status(500).json({ error: "Failed to create planning project" });
    }
  });

  app.post("/api/planning/projects/:id/generate", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      // Start generation process in background
      storage.generatePlanningContent(projectId, userId).catch(error => {
        console.error("Planning generation error:", error);
      });
      
      res.json({ success: true, message: "Planning generation started" });
    } catch (error) {
      console.error("Error starting planning generation:", error);
      res.status(500).json({ error: "Failed to start planning generation" });
    }
  });

  app.get("/api/planning/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const userId = getCurrentUserId(req);
      
      const project = await storage.getPlanningProject(projectId, userId);
      if (!project) {
        return res.status(404).json({ error: "Planning project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching planning project:", error);
      res.status(500).json({ error: "Failed to fetch planning project" });
    }
  });

  app.get("/api/planning/projects/:id/download/:format", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const format = req.params.format; // 'word' or 'pdf'
      const userId = getCurrentUserId(req);
      
      const project = await storage.getPlanningProject(projectId, userId);
      if (!project || project.status !== 'completed') {
        return res.status(404).json({ error: "Planning project not found or not completed" });
      }

      const filePath = format === 'word' ? project.wordDocPath : project.pdfDocPath;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileName = `${project.title}_${project.planType}.${format === 'word' ? 'docx' : 'pdf'}`;
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader('Content-Type', format === 'word' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
      
      const fileBuffer = fs.readFileSync(filePath);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading planning document:", error);
      res.status(500).json({ error: "Failed to download document" });
    }
  });

  // Five Year Planning Analysis API endpoint
  app.post("/api/planning/analyze", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      
      const { query, templateId, referenceFiles = [] } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "分析查询不能为空" });
      }

      // Build context for the AI analysis
      let contextInfo = "";
      
      // Add template context if provided
      if (templateId) {
        try {
          const template = await storage.getPlanningTemplate(templateId);
          if (template) {
            contextInfo += `\n使用模板：${template.name}\n`;
            contextInfo += `模板描述：${template.description}\n`;
            if (template.sections && Array.isArray(template.sections)) {
              contextInfo += `模板章节：${template.sections.map((s: any) => s.title).join('、')}\n`;
            }
          }
        } catch (error) {
          console.log("Template fetch error:", error);
        }
      }
      
      // Add reference files context
      if (referenceFiles.length > 0) {
        contextInfo += `\n参考文件：\n`;
        for (const fileId of referenceFiles) {
          try {
            const upload = await storage.getDataUpload(parseInt(fileId), userId);
            if (upload && upload.extractedText) {
              contextInfo += `文件：${upload.originalName}\n`;
              contextInfo += `摘要：${upload.summary || '无摘要'}\n`;
              // Include partial content for context
              const content = upload.extractedText.slice(0, 1000);
              contextInfo += `内容摘录：${content}${upload.extractedText.length > 1000 ? '...' : ''}\n\n`;
            }
          } catch (error) {
            console.log("Reference file error:", error);
          }
        }
      }

      // Create specialized prompt for five year planning
      const planningPrompt = `你是一个专业的五年规划分析专家。请基于以下查询和上下文，提供专业的五年规划分析建议：

用户查询：${query}

上下文信息：${contextInfo}

请从以下维度进行分析：
1. 现状分析 - 基于提供的资料分析当前发展状况
2. 问题识别 - 指出存在的主要问题和挑战
3. 目标设定 - 提出符合实际的发展目标
4. 路径规划 - 给出具体的实施路径和措施
5. 政策建议 - 提供相关的政策支撑建议

请确保回答：
- 专业且具有可操作性
- 结合实际情况和资料内容
- 体现五年规划的系统性和前瞻性
- 使用中文回答`;

      // Create a simple chat response using OpenAI directly
      const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { 
            role: 'system', 
            content: '你是一个专业的五年规划分析专家，擅长产业发展规划、经济分析和政策建议。请用中文回答。' 
          },
          { 
            role: 'user', 
            content: planningPrompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = {
        content: completion.choices[0]?.message?.content || "分析失败，请重试",
        metadata: undefined
      };

      // Return the analysis result
      res.json({
        step: "planning-idea",
        substep: "analysis-complete",
        content: aiResponse.content,
        metadata: aiResponse.metadata,
        contextUsed: {
          templateId,
          referenceFilesCount: referenceFiles.length,
          hasContext: contextInfo.length > 0
        }
      });

    } catch (error) {
      console.error("Planning analysis error:", error);
      res.status(500).json({ 
        error: "分析失败，请稍后再试", 
        details: error.message 
      });
    }
  });

  // Initialize QAnything service
  const qanythingService = createQAnythingService();

  // QAnything document upload endpoint
  app.post("/api/qanything/upload", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!qanythingService) {
        return res.status(503).json({ 
          error: "QAnything服务未配置。请设置QANYTHING_BASE_URL、QANYTHING_APP_KEY和QANYTHING_APP_SECRET环境变量。" 
        });
      }

      const filePath = req.file.path;
      let originalName = req.file.originalname;

      // Handle Chinese filename encoding
      try {
        const buffer = Buffer.from(originalName, 'latin1');
        const decoded = buffer.toString('utf8');
        if (/[\u4e00-\u9fff]/.test(decoded)) {
          originalName = decoded;
        }
      } catch (error) {
        // Use original name if decoding fails
      }

      // Upload to QAnything
      const qanythingResult = await qanythingService.uploadDocument(filePath, originalName);
      
      // Create database record
      const uploadData = insertDataUploadSchema.parse({
        userId,
        filename: req.file.filename,
        originalName,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileType: FileProcessor.getFileType(req.file.mimetype) || 'unknown',
        status: 'processing',
        qanythingFileId: qanythingResult.data.fileId,
        qanythingStatus: 'processing'
      });

      const upload = await storage.createDataUpload(uploadData);

      // Start background processing for file content and QAnything status
      Promise.all([
        // Traditional file processing
        FileProcessor.processFile(filePath, upload.id)
          .then(async (result) => {
            await storage.updateDataUploadContent(upload.id, {
              extractedText: result.extractedText,
              metadata: result.metadata,
              summary: result.summary,
              status: 'completed'
            });
          })
          .catch(async (error) => {
            console.error("File processing error:", error);
            await storage.updateDataUploadStatus(upload.id, 'failed');
          }),
        
        // QAnything status monitoring
        qanythingService.waitForFileReady(qanythingResult.data.fileId)
          .then(async () => {
            await storage.updateDataUpload(upload.id, {
              qanythingStatus: 'ready'
            });
          })
          .catch(async (error) => {
            console.error("QAnything processing error:", error);
            await storage.updateDataUpload(upload.id, {
              qanythingStatus: 'failed',
              qanythingError: error.message
            });
          })
      ]);

      res.status(201).json({
        ...upload,
        qanythingFileId: qanythingResult.data.fileId
      });

    } catch (error) {
      console.error("QAnything upload error:", error);
      res.status(500).json({ error: `QAnything文档上传失败: ${error.message}` });
    }
  });

  // QAnything file status check endpoint
  app.get("/api/qanything/files/:fileId/status", isAuthenticated, async (req, res) => {
    try {
      const { fileId } = req.params;
      const userId = getCurrentUserId(req);

      if (!qanythingService) {
        return res.status(503).json({ 
          error: "QAnything服务未配置" 
        });
      }

      // Get file info from QAnything
      const fileInfo = await qanythingService.getFileInfo(fileId);
      
      // Update database status if needed
      const uploads = await storage.getDataUploads(userId);
      const upload = uploads.find(u => u.qanythingFileId === fileId);
      
      if (upload && upload.qanythingStatus !== fileInfo.data.status) {
        await storage.updateDataUpload(upload.id, {
          qanythingStatus: fileInfo.data.status
        });
      }

      res.json({
        fileId,
        status: fileInfo.data.status,
        progress: fileInfo.data.progress || 0
      });

    } catch (error) {
      console.error("QAnything status check error:", error);
      res.status(500).json({ error: `获取文件状态失败: ${error.message}` });
    }
  });

  // Enhanced chat endpoint with QAnything integration
  app.post("/api/qanything/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, conversationId, fileId } = req.body;
      const userId = getCurrentUserId(req);

      if (!message) {
        return res.status(400).json({ error: "消息内容不能为空" });
      }

      if (!qanythingService) {
        return res.status(503).json({ 
          error: "QAnything服务未配置" 
        });
      }

      await ensureUserExists(userId);

      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId, userId);
        if (!conversation) {
          return res.status(404).json({ error: "对话不存在" });
        }
      } else {
        const conversationData = insertConversationSchema.parse({
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        });
        conversation = await storage.createConversation(conversationData);
      }

      // Save user message
      const userMessageData = insertMessageSchema.parse({
        conversationId: conversation.id,
        role: 'user',
        content: message
      });
      await storage.createMessage(userMessageData);

      let aiResponse = "";
      const toolsUsed: any[] = [];

      try {
        if (fileId) {
          // Verify file exists and is ready
          const uploads = await storage.getDataUploads(userId);
          const upload = uploads.find(u => u.qanythingFileId === fileId);
          
          if (!upload) {
            throw new Error("指定的文档不存在");
          }

          if (upload.qanythingStatus !== 'ready') {
            throw new Error("文档还在处理中，请稍后再试");
          }

          // Use QAnything for document-based chat
          const qanythingResponse = await qanythingService.chatWithDocument(message, fileId);
          aiResponse = qanythingResponse.data.answer;
          
          // Add references if available
          if (qanythingResponse.data.references && qanythingResponse.data.references.length > 0) {
            aiResponse += "\n\n**参考来源：**\n";
            qanythingResponse.data.references.forEach((ref, index) => {
              aiResponse += `${index + 1}. ${ref.content}\n`;
            });
          }

          toolsUsed.push({
            name: 'qanything_document_qa',
            input: message,
            output: {
              document: upload.originalName,
              fileId: fileId,
              references: qanythingResponse.data.references?.length || 0
            }
          });

        } else {
          throw new Error("未指定文档ID，将使用普通对话模式");
        }

      } catch (qanythingError) {
        console.log("QAnything failed, falling back to regular chat:", qanythingError.message);
        
        // Fallback to regular AI chat
        try {
          const messages = await storage.getMessages(conversation.id);
          const chatMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));

          const aiChatResponse = await chatWithAI(chatMessages);
          aiResponse = aiChatResponse.content;

          if (aiChatResponse.metadata) {
            toolsUsed.push({
              name: 'ai_analysis',
              input: message,
              output: aiChatResponse.metadata
            });
          }

          // Add fallback notice
          if (fileId) {
            aiResponse = "⚠️ 文档问答服务暂时不可用，为您提供基于通用知识的回答：\n\n" + aiResponse;
          }

        } catch (fallbackError) {
          console.error("Both QAnything and fallback chat failed:", fallbackError);
          aiResponse = generateEnhancedFallbackResponse(message, toolsUsed);
        }
      }

      // Save AI response
      const aiMessageData = insertMessageSchema.parse({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });
      await storage.createMessage(aiMessageData);

      res.json({
        userMessage: userMessageData,
        aiMessage: aiMessageData,
        toolsUsed,
        conversation
      });

    } catch (error) {
      console.error("QAnything chat error:", error);
      res.status(500).json({ error: `智能问答失败: ${error.message}` });
    }
  });

  // Get user's QAnything-enabled documents
  app.get("/api/qanything/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = getCurrentUserId(req);
      await ensureUserExists(userId);
      
      const uploads = await storage.getDataUploads(userId);
      const qanythingDocs = uploads.filter(upload => 
        upload.qanythingFileId && 
        upload.qanythingStatus === 'ready'
      );

      res.json(qanythingDocs.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        fileId: doc.qanythingFileId,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.qanythingStatus,
        createdAt: doc.createdAt,
        summary: doc.summary
      })));

    } catch (error) {
      console.error("Error fetching QAnything documents:", error);
      res.status(500).json({ error: "获取文档列表失败" });
    }
  });

  // Agent API for advanced functionality (chart and report generation)
  app.post("/api/agent/execute", isAuthenticated, async (req, res) => {
    try {
      const { userInput, sessionId = "default", user_input } = req.body;
      const input = userInput || user_input;
      
      if (!input) {
        return res.status(400).json({ error: "User input is required" });
      }

      // Try FastAPI backend first for advanced agent capabilities
      try {
        console.log(`Attempting FastAPI agent execution: ${input}`);
        const fastApiResponse = await fetch('http://localhost:8000/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_input: input,
            session_id: sessionId
          }),
          timeout: 30000
        });
        
        if (fastApiResponse.ok) {
          const fastApiResult = await fastApiResponse.json();
          console.log(`FastAPI Agent executed successfully for: ${input}`);
          
          // Ensure compatibility with frontend expectations
          if (fastApiResult.success) {
            return res.json({
              success: true,
              result: fastApiResult.result,
              type: fastApiResult.type || "analysis",
              sessionId: sessionId,
              timestamp: new Date().toISOString(),
              backend: "fastapi"
            });
          }
        }
      } catch (fastApiError) {
        console.log("FastAPI backend not available, using Node.js agent fallback:", fastApiError.message);
      }

      // Fallback to Node.js agent implementation
      console.log(`Using Node.js agent executor for: ${input}`);
      const result = await agentExecutor.execute(input, sessionId);
      
      res.json({
        success: true,
        result,
        sessionId,
        timestamp: new Date().toISOString(),
        backend: "nodejs"
      });
    } catch (error) {
      console.error("Agent execution error:", error);
      res.status(500).json({ 
        error: "Agent execution failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const server = createServer(app);
  // Test chat endpoint to verify AI functionality
  app.post("/api/test-chat", async (req, res) => {
    try {
      const { message, enableWebSearch = false } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Test AI response directly
      const testMessages = [{ role: 'user' as const, content: message }];
      const aiResponse = await chatWithAI(testMessages, 'zh', enableWebSearch);
      
      res.json({
        success: true,
        userMessage: message,
        aiResponse: aiResponse.content,
        metadata: aiResponse.metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Test chat error:", error);
      res.status(500).json({ 
        error: "AI chat test failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // FastAPI integration proxy routes
  app.post("/api/fastapi/*", async (req, res) => {
    try {
      const fastApiUrl = `http://localhost:8000${req.path.replace('/api/fastapi', '/api')}`;
      const response = await fetch(fastApiUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("FastAPI proxy error:", error);
      res.status(503).json({ 
        error: "FastAPI service unavailable", 
        details: "Please ensure FastAPI backend is running on port 8000" 
      });
    }
  });

  app.get("/api/fastapi/*", async (req, res) => {
    try {
      const fastApiUrl = `http://localhost:8000${req.path.replace('/api/fastapi', '/api')}`;
      const response = await fetch(fastApiUrl, {
        method: 'GET',
        headers: req.headers
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("FastAPI proxy error:", error);
      res.status(503).json({ 
        error: "FastAPI service unavailable", 
        details: "Please ensure FastAPI backend is running on port 8000" 
      });
    }
  });

  return server;
}