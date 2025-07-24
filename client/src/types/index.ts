// Re-export shared types
export type {
  User,
  UpsertUser,
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  Cluster,
  InsertCluster,
  Report,
  InsertReport,
  ReportTemplate,
  InsertReportTemplate,
  DataUpload,
  InsertDataUpload
} from "@shared/schema";

// Client-specific types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchFilters {
  contentType: {
    all: boolean;
    reports: boolean;
    news: boolean;
    policies: boolean;
    companies: boolean;
  };
  region: {
    yangtze: boolean;
    pearl: boolean;
    beijing: boolean;
  };
  industry: {
    biotech: boolean;
    electronics: boolean;
    ai: boolean;
  };
}

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  description: string;
  source: string;
  date: string;
  pages: string;
  downloads: string;
  tags: string[];
  rating: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  generatedReports: number;
  apiCalls: number;
  dailyRequests: number;
  activeClusters: number;
  reportsGenerated: number;
}

export interface ChartData {
  radarData?: Array<{
    subject: string;
    value: number;
    fullMark: number;
  }>;
  trendData?: Array<{
    name: string;
    value: number;
  }>;
  barData?: Array<{
    name: string;
    value: number;
  }>;
  pieData?: Array<{
    name: string;
    value: number;
  }>;
  areaData?: Array<{
    name: string;
    value: number;
  }>;
}

export interface ClusterMetrics {
  totalScore?: number;
  innovationScore?: number;
  policyScore?: number;
  talentScore?: number;
  scaleScore?: number;
  infrastructureScore?: number;
  marketScore?: number;
}

export interface AnalysisMetadata {
  chartData?: ChartData;
  metrics?: ClusterMetrics;
  analysis?: any;
  recommendations?: string[];
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  adminOnly?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "admin" | "researcher" | "manager" | "government";
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  key: string;
  label: string;
  value: string;
  description: string;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar: string;
}

export interface PromptExample {
  title: string;
  description: string;
  category?: string;
}

export interface TemplateCategory {
  value: string;
  label: string;
}

export interface ReportTemplateItem {
  id: number;
  name: string;
  category: string;
  description: string;
  tags: string[];
  usageCount: number;
  rating: number;
  lastUpdated: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  metadata?: AnalysisMetadata;
  timestamp: string;
}

export interface ConversationListItem {
  id: number;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  messageCount?: number;
}

export interface FileUploadStatus {
  id: number;
  filename: string;
  originalName: string;
  status: "processing" | "completed" | "failed";
  progress?: number;
  error?: string;
}

export interface ErrorState {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface LoadingState {
  isLoading: boolean;
  text?: string;
}

// Language and internationalization
export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface LocalizedContent {
  zh: string;
  en: string;
}

// Theme and UI
export type Theme = "light" | "dark" | "system";

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  language: string;
}

// API Error types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error") {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  public fields: Record<string, string[]>;
  
  constructor(message = "Validation error", fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types for analytics
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
}

// Websocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
