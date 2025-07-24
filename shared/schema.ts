import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("researcher"), // researcher, admin, government, manager
  organization: varchar("organization"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  language: varchar("language").notNull().default("zh"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For storing chart data, analysis results, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Industrial clusters data
export const clusters = pgTable("clusters", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  region: varchar("region").notNull(),
  industry: varchar("industry").notNull(),
  description: text("description"),
  data: jsonb("data"), // Store cluster metrics and analysis data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Report templates
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  template: jsonb("template"), // Template structure and content
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Generated reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: integer("template_id").references(() => reportTemplates.id),
  title: varchar("title").notNull(),
  content: jsonb("content"),
  format: varchar("format").notNull(), // pdf, word, excel
  filePath: varchar("file_path"),
  status: varchar("status").notNull().default("generating"), // generating, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data uploads
export const dataUploads = pgTable("data_uploads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileType: varchar("file_type").notNull(), // excel, csv, json, image, pdf, word, powerpoint
  extractedText: text("extracted_text"), // Extracted content for RAG
  metadata: jsonb("metadata"), // File-specific metadata (sheets, pages, etc.)
  summary: text("summary"), // AI-generated summary
  status: varchar("status").notNull().default("processing"), // processing, completed, failed, analyzing
  analysisResults: jsonb("analysis_results"), // Structured analysis results
  // QAnything integration fields
  qanythingFileId: varchar("qanything_file_id"), // QAnything fileId for document QA
  qanythingStatus: varchar("qanything_status"), // processing, ready, failed
  qanythingError: text("qanything_error"), // Error message if QAnything processing failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Planning templates for five-year plans
export const planningTemplates = pgTable("planning_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // comprehensive, industry, etc.
  sections: jsonb("sections").notNull(), // PlanningSection[]
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Planning projects
export const planningProjects = pgTable("planning_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  region: varchar("region").notNull(),
  planType: varchar("plan_type").notNull(), // 十四五、十五五等
  templateId: integer("template_id").references(() => planningTemplates.id),
  status: varchar("status").notNull().default("draft"), // draft, generating, completed, failed
  enableWebSearch: boolean("enable_web_search").default(false),
  referenceFiles: jsonb("reference_files"), // string[]
  localFilePath: varchar("local_file_path"),
  generatedContent: text("generated_content"),
  sections: jsonb("sections"), // GeneratedSection[]
  metadata: jsonb("metadata"),
  progress: integer("progress").default(0), // 0-100
  errorMessage: text("error_message"),
  wordDocPath: varchar("word_doc_path"),
  pdfDocPath: varchar("pdf_doc_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Planning file references
export const planningFileReferences = pgTable("planning_file_references", {
  id: serial("id").primaryKey(),
  planningProjectId: integer("planning_project_id").references(() => planningProjects.id),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileType: varchar("file_type").notNull(),
  category: varchar("category"), // national_policies, provincial_plans, etc.
  extractedContent: text("extracted_content"),
  processingStatus: varchar("processing_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Local resource database for five-year planning
export const localResources = pgTable("local_resources", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // 五年规划数据库, 产业研究数据库, 企业数据库, 培训课程库, 专家库, 产业理论研究库, 分析记忆库
  subcategory: varchar("subcategory"), // 总体经济情况, 核心工作情况等
  department: varchar("department"), // 市工信局, 市统计局等
  filePath: varchar("file_path").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  description: text("description"),
  tags: jsonb("tags"), // 标签数组，支持跨库检索
  keywords: jsonb("keywords"), // 关键词数组
  extractedContent: text("extracted_content"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Planning templates for different modules
export const planningModuleTemplates = pgTable("planning_module_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  module: varchar("module").notNull(), // 五年规划, 产业测评, 产业研究报告, 产业规划与政策, 产业托管方案, 园区托管方案, 办公文书
  templateCode: varchar("template_code").notNull().unique(), // 模板编号，如模型002
  content: text("content").notNull(),
  structure: jsonb("structure"), // 模板结构化数据
  instructions: text("instructions"), // 使用说明
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analysis records for storing analysis results
export const analysisRecords = pgTable("analysis_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  module: varchar("module").notNull(), // 产业经济, 民生与社会, 城市建设, 总体定位
  analysisType: varchar("analysis_type").notNull(), // 综合实力分析, 国家试验区建设等
  inputFiles: jsonb("input_files"), // 输入文件列表
  templateUsed: varchar("template_used"), // 使用的模板编号
  analysisResult: text("analysis_result"),
  structuredData: jsonb("structured_data"), // 结构化分析结果
  status: varchar("status").default("completed"), // completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertClusterSchema = createInsertSchema(clusters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const insertDataUploadSchema = createInsertSchema(dataUploads).omit({ id: true, createdAt: true });
export const insertPlanningTemplateSchema = createInsertSchema(planningTemplates).omit({ id: true, createdAt: true });
export const insertPlanningProjectSchema = createInsertSchema(planningProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlanningFileReferenceSchema = createInsertSchema(planningFileReferences).omit({ id: true, createdAt: true });
export const insertLocalResourceSchema = createInsertSchema(localResources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlanningModuleTemplateSchema = createInsertSchema(planningModuleTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalysisRecordSchema = createInsertSchema(analysisRecords).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Cluster = typeof clusters.$inferSelect;
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type DataUpload = typeof dataUploads.$inferSelect;
export type InsertDataUpload = z.infer<typeof insertDataUploadSchema>;
export type PlanningTemplate = typeof planningTemplates.$inferSelect;
export type InsertPlanningTemplate = z.infer<typeof insertPlanningTemplateSchema>;
export type PlanningProject = typeof planningProjects.$inferSelect;
export type InsertPlanningProject = z.infer<typeof insertPlanningProjectSchema>;
export type PlanningFileReference = typeof planningFileReferences.$inferSelect;
export type InsertPlanningFileReference = z.infer<typeof insertPlanningFileReferenceSchema>;
export type LocalResource = typeof localResources.$inferSelect;
export type InsertLocalResource = z.infer<typeof insertLocalResourceSchema>;
export type PlanningModuleTemplate = typeof planningModuleTemplates.$inferSelect;
export type InsertPlanningModuleTemplate = z.infer<typeof insertPlanningModuleTemplateSchema>;
export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type InsertAnalysisRecord = z.infer<typeof insertAnalysisRecordSchema>;
