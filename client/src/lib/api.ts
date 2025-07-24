import { apiRequest } from "./queryClient";
import type {
  Conversation,
  InsertConversation,
  Message,
  InsertMessage,
  Cluster,
  InsertCluster,
  Report,
  InsertReport,
  ReportTemplate,
  DataUpload,
  User
} from "@shared/schema";

// Auth API
export const authApi = {
  getUser: async (): Promise<User> => {
    const response = await apiRequest("GET", "/api/auth/user");
    return response.json();
  },
  
  logout: () => {
    window.location.href = "/api/logout";
  },
  
  login: () => {
    window.location.href = "/api/login";
  }
};

// Conversation API
export const conversationApi = {
  getAll: async (): Promise<Conversation[]> => {
    const response = await apiRequest("GET", "/api/conversations");
    return response.json();
  },
  
  getById: async (id: number): Promise<Conversation> => {
    const response = await apiRequest("GET", `/api/conversations/${id}`);
    return response.json();
  },
  
  create: async (data: InsertConversation): Promise<Conversation> => {
    const response = await apiRequest("POST", "/api/conversations", data);
    return response.json();
  },
  
  delete: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/conversations/${id}`);
  }
};

// Message API
export const messageApi = {
  getByConversationId: async (conversationId: number): Promise<Message[]> => {
    const response = await apiRequest("GET", `/api/conversations/${conversationId}/messages`);
    return response.json();
  },
  
  create: async (conversationId: number, content: string): Promise<{ userMessage: Message; aiMessage: Message }> => {
    const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content });
    return response.json();
  }
};

// Cluster API
export const clusterApi = {
  getAll: async (limit?: number, offset?: number): Promise<Cluster[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    
    const response = await apiRequest("GET", `/api/clusters?${params}`);
    return response.json();
  },
  
  getById: async (id: number): Promise<Cluster> => {
    const response = await apiRequest("GET", `/api/clusters/${id}`);
    return response.json();
  },
  
  search: async (query: string): Promise<Cluster[]> => {
    const response = await apiRequest("GET", `/api/clusters/search?q=${encodeURIComponent(query)}`);
    return response.json();
  },
  
  create: async (data: InsertCluster): Promise<Cluster> => {
    const response = await apiRequest("POST", "/api/clusters", data);
    return response.json();
  },
  
  analyze: async (id: number): Promise<any> => {
    const response = await apiRequest("POST", `/api/clusters/${id}/analyze`);
    return response.json();
  }
};

// Report API
export const reportApi = {
  getAll: async (): Promise<Report[]> => {
    const response = await apiRequest("GET", "/api/reports");
    return response.json();
  },
  
  getById: async (id: number): Promise<Report> => {
    const response = await apiRequest("GET", `/api/reports/${id}`);
    return response.json();
  },
  
  create: async (data: InsertReport): Promise<Report> => {
    const response = await apiRequest("POST", "/api/reports", data);
    return response.json();
  }
};

// Template API
export const templateApi = {
  getAll: async (): Promise<ReportTemplate[]> => {
    const response = await apiRequest("GET", "/api/templates");
    return response.json();
  },
  
  getById: async (id: number): Promise<ReportTemplate> => {
    const response = await apiRequest("GET", `/api/templates/${id}`);
    return response.json();
  },
  
  create: async (data: any): Promise<ReportTemplate> => {
    const response = await apiRequest("POST", "/api/templates", data);
    return response.json();
  }
};

// Upload API
export const uploadApi = {
  uploadFile: async (file: File): Promise<DataUpload> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`${response.status}: ${text}`);
    }
    
    return response.json();
  },
  
  getAll: async (): Promise<DataUpload[]> => {
    const response = await apiRequest("GET", "/api/uploads");
    return response.json();
  }
};

// System Settings API (Admin only)
export const systemApi = {
  getSetting: async (key: string): Promise<{ key: string; value: any }> => {
    const response = await apiRequest("GET", `/api/settings/${key}`);
    return response.json();
  },
  
  setSetting: async (key: string, value: any): Promise<void> => {
    await apiRequest("POST", `/api/settings/${key}`, { value });
  }
};

// Analytics API (for dashboard data)
export const analyticsApi = {
  getDashboardStats: async (): Promise<{
    dailyRequests: number;
    activeClusters: number;
    reportsGenerated: number;
    totalUsers: number;
    activeUsers: number;
    apiCalls: number;
  }> => {
    // This would be a real API endpoint in production
    // For now, return mock data structure
    return {
      dailyRequests: 1247,
      activeClusters: 89,
      reportsGenerated: 356,
      totalUsers: 1247,
      activeUsers: 892,
      apiCalls: 28900
    };
  }
};

// Export all APIs
export const api = {
  auth: authApi,
  conversations: conversationApi,
  messages: messageApi,
  clusters: clusterApi,
  reports: reportApi,
  templates: templateApi,
  uploads: uploadApi,
  system: systemApi,
  analytics: analyticsApi
};

export default api;
