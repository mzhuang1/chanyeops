import {
  users,
  conversations,
  messages,
  clusters,
  reportTemplates,
  reports,
  dataUploads,
  systemSettings,
  planningTemplates,
  planningProjects,
  planningFileReferences,
  localResources,
  planningModuleTemplates,
  analysisRecords,
  type User,
  type UpsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Cluster,
  type InsertCluster,
  type ReportTemplate,
  type InsertReportTemplate,
  type Report,
  type InsertReport,
  type DataUpload,
  type InsertDataUpload,
  type PlanningTemplate,
  type InsertPlanningTemplate,
  type PlanningProject,
  type InsertPlanningProject,
  type PlanningFileReference,
  type InsertPlanningFileReference,
  type LocalResource,
  type InsertLocalResource,
  type PlanningModuleTemplate,
  type InsertPlanningModuleTemplate,
  type AnalysisRecord,
  type InsertAnalysisRecord,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number, userId: string): Promise<Conversation | undefined>;
  updateConversation(id: number, userId: string, updates: Partial<Conversation>): Promise<Conversation>;
  deleteConversation(id: number, userId: string): Promise<void>;
  
  // Message operations
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(messageId: number, conversationId: number): Promise<void>;
  
  // Cluster operations
  getClusters(limit?: number, offset?: number): Promise<Cluster[]>;
  getCluster(id: number): Promise<Cluster | undefined>;
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  searchClusters(query: string): Promise<Cluster[]>;
  getClustersByRegion(region: string): Promise<Cluster[]>;
  getClustersByIndustry(industry: string): Promise<Cluster[]>;
  
  // Report operations
  getReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number, userId: string): Promise<Report | undefined>;
  updateReportStatus(id: number, status: string, filePath?: string): Promise<void>;
  
  // Template operations
  getReportTemplates(): Promise<ReportTemplate[]>;
  getReportTemplate(id: number): Promise<ReportTemplate | undefined>;
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  
  // Data upload operations
  createDataUpload(upload: InsertDataUpload): Promise<DataUpload>;
  getDataUploads(userId: string): Promise<DataUpload[]>;
  getDataUpload(id: number, userId: string): Promise<DataUpload | undefined>;
  updateDataUploadStatus(id: number, status: string): Promise<void>;
  updateDataUploadContent(id: number, updates: Partial<DataUpload>): Promise<void>;
  updateDataUpload(id: number, updates: Partial<DataUpload>): Promise<void>;
  searchDataUploads(userId: string, query: string): Promise<DataUpload[]>;
  deleteDataUpload(id: number, userId: string): Promise<void>;
  
  // System settings
  getSystemSetting(key: string): Promise<any>;
  setSystemSetting(key: string, value: any): Promise<void>;
  
  // Planning operations
  getPlanningTemplates(): Promise<PlanningTemplate[]>;
  getPlanningTemplate(id: number): Promise<PlanningTemplate | undefined>;
  createPlanningTemplate(template: InsertPlanningTemplate): Promise<PlanningTemplate>;
  
  getPlanningProjects(userId: string): Promise<PlanningProject[]>;
  getPlanningProject(id: number, userId: string): Promise<PlanningProject | undefined>;
  createPlanningProject(project: InsertPlanningProject): Promise<PlanningProject>;
  updatePlanningProject(id: number, updates: Partial<PlanningProject>): Promise<void>;
  generatePlanningContent(projectId: number, userId: string): Promise<void>;
  
  // Local resource operations
  getLocalResources(category?: string): Promise<LocalResource[]>;
  getLocalResource(id: number): Promise<LocalResource | undefined>;
  createLocalResource(resource: InsertLocalResource): Promise<LocalResource>;
  searchLocalResources(query: string, tags?: string[]): Promise<LocalResource[]>;
  
  // Planning module template operations
  getPlanningModuleTemplates(module?: string): Promise<PlanningModuleTemplate[]>;
  getPlanningModuleTemplate(id: number): Promise<PlanningModuleTemplate | undefined>;
  getPlanningModuleTemplateByCode(templateCode: string): Promise<PlanningModuleTemplate | undefined>;
  createPlanningModuleTemplate(template: InsertPlanningModuleTemplate): Promise<PlanningModuleTemplate>;
  
  // Analysis record operations
  getAnalysisRecords(userId: string, module?: string): Promise<AnalysisRecord[]>;
  createAnalysisRecord(record: InsertAnalysisRecord): Promise<AnalysisRecord>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: number, userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return conversation;
  }

  async updateConversation(id: number, userId: string, updates: Partial<Conversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();
    return updated;
  }

  async deleteConversation(id: number, userId: string): Promise<void> {
    // First, delete all messages in the conversation
    await db
      .delete(messages)
      .where(eq(messages.conversationId, id));
    
    // Then delete the conversation itself
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  }

  // Message operations
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async deleteMessage(messageId: number, conversationId: number): Promise<void> {
    await db
      .delete(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)));
  }

  // Cluster operations
  async getClusters(limit = 50, offset = 0): Promise<Cluster[]> {
    return await db
      .select()
      .from(clusters)
      .orderBy(desc(clusters.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  async getCluster(id: number): Promise<Cluster | undefined> {
    const [cluster] = await db
      .select()
      .from(clusters)
      .where(eq(clusters.id, id));
    return cluster;
  }

  async createCluster(cluster: InsertCluster): Promise<Cluster> {
    const [newCluster] = await db
      .insert(clusters)
      .values(cluster)
      .returning();
    return newCluster;
  }

  async searchClusters(query: string): Promise<Cluster[]> {
    return await db
      .select()
      .from(clusters)
      .where(
        or(
          like(clusters.name, `%${query}%`),
          like(clusters.region, `%${query}%`),
          like(clusters.industry, `%${query}%`),
          like(clusters.description, `%${query}%`)
        )
      )
      .orderBy(desc(clusters.updatedAt));
  }

  async getClustersByRegion(region: string): Promise<Cluster[]> {
    return await db
      .select()
      .from(clusters)
      .where(eq(clusters.region, region))
      .orderBy(desc(clusters.updatedAt));
  }

  async getClustersByIndustry(industry: string): Promise<Cluster[]> {
    return await db
      .select()
      .from(clusters)
      .where(eq(clusters.industry, industry))
      .orderBy(desc(clusters.updatedAt));
  }

  // Report operations
  async getReports(userId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReport(id: number, userId: string): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.userId, userId)));
    return report;
  }

  async updateReportStatus(id: number, status: string, filePath?: string): Promise<void> {
    const updates: any = { status };
    if (filePath) updates.filePath = filePath;
    
    await db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, id));
  }

  // Template operations
  async getReportTemplates(): Promise<ReportTemplate[]> {
    return await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.isActive, true))
      .orderBy(reportTemplates.name);
  }

  async getReportTemplate(id: number): Promise<ReportTemplate | undefined> {
    const [template] = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.id, id));
    return template;
  }

  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const [newTemplate] = await db
      .insert(reportTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // Data upload operations
  async createDataUpload(upload: InsertDataUpload): Promise<DataUpload> {
    const [newUpload] = await db
      .insert(dataUploads)
      .values(upload)
      .returning();
    return newUpload;
  }

  async getDataUploads(userId: string): Promise<DataUpload[]> {
    return await db
      .select()
      .from(dataUploads)
      .where(eq(dataUploads.userId, userId))
      .orderBy(desc(dataUploads.createdAt));
  }

  async getDataUpload(id: number, userId: string): Promise<DataUpload | undefined> {
    const [upload] = await db
      .select()
      .from(dataUploads)
      .where(and(eq(dataUploads.id, id), eq(dataUploads.userId, userId)));
    return upload;
  }

  async updateDataUploadStatus(id: number, status: string): Promise<void> {
    await db
      .update(dataUploads)
      .set({ status, updatedAt: new Date() })
      .where(eq(dataUploads.id, id));
  }

  async updateDataUploadContent(id: number, updates: Partial<DataUpload>): Promise<void> {
    await db
      .update(dataUploads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataUploads.id, id));
  }

  async updateDataUpload(id: number, updates: Partial<DataUpload>): Promise<void> {
    await db
      .update(dataUploads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataUploads.id, id));
  }

  async searchDataUploads(userId: string, query: string): Promise<DataUpload[]> {
    return await db
      .select()
      .from(dataUploads)
      .where(
        and(
          eq(dataUploads.userId, userId),
          or(
            like(dataUploads.originalName, `%${query}%`),
            like(dataUploads.summary, `%${query}%`),
            like(dataUploads.extractedText, `%${query}%`)
          )
        )
      )
      .orderBy(desc(dataUploads.createdAt));
  }

  async deleteDataUpload(id: number, userId: string): Promise<void> {
    await db
      .delete(dataUploads)
      .where(and(eq(dataUploads.id, id), eq(dataUploads.userId, userId)));
  }

  // System settings
  async getSystemSetting(key: string): Promise<any> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting?.value;
  }

  async setSystemSetting(key: string, value: any): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // Planning operations
  async getPlanningTemplates(): Promise<PlanningTemplate[]> {
    return await db.select().from(planningTemplates).orderBy(desc(planningTemplates.createdAt));
  }

  async getPlanningTemplate(id: number): Promise<PlanningTemplate | undefined> {
    const result = await db.select().from(planningTemplates).where(eq(planningTemplates.id, id));
    return result[0];
  }

  async createPlanningTemplate(template: InsertPlanningTemplate): Promise<PlanningTemplate> {
    const result = await db.insert(planningTemplates).values(template).returning();
    return result[0];
  }

  async getPlanningProjects(userId: string): Promise<PlanningProject[]> {
    return await db.select().from(planningProjects)
      .where(eq(planningProjects.userId, userId))
      .orderBy(desc(planningProjects.createdAt));
  }

  async getPlanningProject(id: number, userId: string): Promise<PlanningProject | undefined> {
    const result = await db.select().from(planningProjects)
      .where(and(eq(planningProjects.id, id), eq(planningProjects.userId, userId)));
    return result[0];
  }

  async createPlanningProject(project: InsertPlanningProject): Promise<PlanningProject> {
    const result = await db.insert(planningProjects).values(project).returning();
    return result[0];
  }

  async updatePlanningProject(id: number, updates: Partial<PlanningProject>): Promise<void> {
    await db.update(planningProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(planningProjects.id, id));
  }

  async generatePlanningContent(projectId: number, userId: string): Promise<void> {
    await this.updatePlanningProject(projectId, {
      status: 'generating',
      progress: 0
    });

    try {
      const project = await this.getPlanningProject(projectId, userId);
      if (!project) {
        throw new Error('Planning project not found');
      }

      // Simulate content generation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.updatePlanningProject(projectId, {
        progress: 50
      });

      const generatedContent = `# ${project.title}\n\n这是一个自动生成的${project.planType}发展规划草案。\n\n## 第一章 发展基础\n\n${project.region}在过去五年中取得了显著发展成就...\n\n## 第二章 发展目标\n\n未来五年，${project.region}将致力于实现高质量发展...`;

      await this.updatePlanningProject(projectId, {
        status: 'completed',
        progress: 100,
        generatedContent,
        sections: [
          {
            title: '发展基础',
            content: `${project.region}在过去五年中取得了显著发展成就...`,
            wordCount: 120,
            sources: []
          },
          {
            title: '发展目标',
            content: `未来五年，${project.region}将致力于实现高质量发展...`,
            wordCount: 150,
            sources: []
          }
        ],
        metadata: {
          totalWords: 270,
          generatedAt: new Date(),
          sources: []
        }
      });

    } catch (error) {
      await this.updatePlanningProject(projectId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  // Local resource operations
  async getLocalResources(category?: string): Promise<LocalResource[]> {
    const query = db.select().from(localResources);
    if (category) {
      return query.where(eq(localResources.category, category));
    }
    return query.orderBy(desc(localResources.createdAt));
  }

  async getLocalResource(id: number): Promise<LocalResource | undefined> {
    const [resource] = await db.select().from(localResources).where(eq(localResources.id, id));
    return resource;
  }

  async createLocalResource(resource: InsertLocalResource): Promise<LocalResource> {
    const [newResource] = await db.insert(localResources).values(resource).returning();
    return newResource;
  }

  async searchLocalResources(query: string, tags?: string[]): Promise<LocalResource[]> {
    let searchQuery = db.select().from(localResources);
    
    const searchConditions = [
      like(localResources.name, `%${query}%`),
      like(localResources.description, `%${query}%`),
      like(localResources.extractedContent, `%${query}%`)
    ];

    if (tags && tags.length > 0) {
      // Use jsonb operator to search in tags array
      searchConditions.push(sql`${localResources.tags} @> ${JSON.stringify(tags)}`);
    }

    return searchQuery.where(or(...searchConditions)).orderBy(desc(localResources.updatedAt));
  }

  // Planning module template operations
  async getPlanningModuleTemplates(module?: string): Promise<PlanningModuleTemplate[]> {
    if (module) {
      return db.select().from(planningModuleTemplates)
        .where(and(eq(planningModuleTemplates.module, module), eq(planningModuleTemplates.isActive, true)))
        .orderBy(planningModuleTemplates.templateCode);
    }
    return db.select().from(planningModuleTemplates)
      .where(eq(planningModuleTemplates.isActive, true))
      .orderBy(planningModuleTemplates.module, planningModuleTemplates.templateCode);
  }

  async getPlanningModuleTemplate(id: number): Promise<PlanningModuleTemplate | undefined> {
    const [template] = await db.select().from(planningModuleTemplates).where(eq(planningModuleTemplates.id, id));
    return template;
  }

  async getPlanningModuleTemplateByCode(templateCode: string): Promise<PlanningModuleTemplate | undefined> {
    const [template] = await db.select().from(planningModuleTemplates).where(eq(planningModuleTemplates.templateCode, templateCode));
    return template;
  }

  async createPlanningModuleTemplate(template: InsertPlanningModuleTemplate): Promise<PlanningModuleTemplate> {
    const [newTemplate] = await db.insert(planningModuleTemplates).values(template).returning();
    return newTemplate;
  }

  // Analysis record operations
  async getAnalysisRecords(userId: string, module?: string): Promise<AnalysisRecord[]> {
    if (module) {
      return db.select().from(analysisRecords)
        .where(and(eq(analysisRecords.userId, userId), eq(analysisRecords.module, module)))
        .orderBy(desc(analysisRecords.createdAt));
    }
    return db.select().from(analysisRecords)
      .where(eq(analysisRecords.userId, userId))
      .orderBy(desc(analysisRecords.createdAt));
  }

  async createAnalysisRecord(record: InsertAnalysisRecord): Promise<AnalysisRecord> {
    const [newRecord] = await db.insert(analysisRecords).values(record).returning();
    return newRecord;
  }
}

export const storage = new DatabaseStorage();
