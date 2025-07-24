import crypto from 'crypto';
import fs from 'fs';
import FormData from 'form-data';

export interface QAnythingConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
}

export interface FileUploadResponse {
  code: number;
  msg: string;
  data: {
    fileId: string;
  };
}

export interface FileInfoResponse {
  code: number;
  msg: string;
  data: {
    fileId: string;
    status: 'processing' | 'ready' | 'failed';
    progress?: number;
  };
}

export interface ChatResponse {
  code: number;
  msg: string;
  data: {
    answer: string;
    references?: Array<{
      content: string;
      source: string;
    }>;
  };
}

export class QAnythingService {
  private config: QAnythingConfig;

  constructor(config: QAnythingConfig) {
    this.config = config;
  }

  // 生成签名
  private generateSignature(params: Record<string, any>): string {
    // 按照key排序
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 添加appSecret
    const signString = queryString + this.config.appSecret;
    
    // MD5加密并转大写
    return crypto.createHash('md5').update(signString, 'utf8').digest('hex').toUpperCase();
  }

  // 生成通用请求参数
  private getBaseParams(): Record<string, any> {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    return {
      appKey: this.config.appKey,
      timeStamp: timestamp,
      nonce: nonce
    };
  }

  // 上传文档
  async uploadDocument(filePath: string, originalName: string): Promise<FileUploadResponse> {
    try {
      const baseParams = this.getBaseParams();
      const signature = this.generateSignature(baseParams);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('appKey', baseParams.appKey);
      formData.append('timeStamp', baseParams.timeStamp);
      formData.append('nonce', baseParams.nonce);
      formData.append('sign', signature);

      const response = await fetch(`${this.config.baseUrl}/file/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const result: FileUploadResponse = await response.json();
      
      if (result.code !== 200) {
        throw new Error(`QAnything upload failed: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('QAnything upload error:', error);
      throw new Error(`文档上传到QAnything失败: ${error.message}`);
    }
  }

  // 查询文件状态
  async getFileInfo(fileId: string): Promise<FileInfoResponse> {
    try {
      const baseParams = this.getBaseParams();
      const params = {
        ...baseParams,
        fileId: fileId
      };
      const signature = this.generateSignature(params);

      const queryString = new URLSearchParams({
        ...params,
        sign: signature
      }).toString();

      const response = await fetch(`${this.config.baseUrl}/file/getFileInfo?${queryString}`, {
        method: 'GET'
      });

      const result: FileInfoResponse = await response.json();
      
      if (result.code !== 200) {
        throw new Error(`QAnything file info failed: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('QAnything file info error:', error);
      throw new Error(`获取文件状态失败: ${error.message}`);
    }
  }

  // 等待文件处理完成
  async waitForFileReady(fileId: string, maxRetries: number = 30, retryInterval: number = 2000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const fileInfo = await this.getFileInfo(fileId);
        
        if (fileInfo.data.status === 'ready') {
          return true;
        } else if (fileInfo.data.status === 'failed') {
          throw new Error('文档处理失败');
        }
        
        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } catch (error) {
        console.error(`File status check attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('文档处理超时');
  }

  // 基于文档问答
  async chatWithDocument(question: string, fileId: string): Promise<ChatResponse> {
    try {
      const baseParams = this.getBaseParams();
      const params = {
        ...baseParams,
        question: question,
        fileId: fileId
      };
      const signature = this.generateSignature(params);

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...params,
          sign: signature
        })
      });

      const result: ChatResponse = await response.json();
      
      if (result.code !== 200) {
        throw new Error(`QAnything chat failed: ${result.msg}`);
      }

      return result;
    } catch (error) {
      console.error('QAnything chat error:', error);
      throw new Error(`文档问答失败: ${error.message}`);
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      // 通过获取一个不存在的文件信息来测试API连接
      const baseParams = this.getBaseParams();
      const params = {
        ...baseParams,
        fileId: 'test-connection'
      };
      const signature = this.generateSignature(params);

      const queryString = new URLSearchParams({
        ...params,
        sign: signature
      }).toString();

      const response = await fetch(`${this.config.baseUrl}/file/getFileInfo?${queryString}`, {
        method: 'GET'
      });

      // 只要能收到响应就说明连接正常，不管是否成功
      return response.ok || response.status < 500;
    } catch (error) {
      console.error('QAnything connection test failed:', error);
      return false;
    }
  }
}

// 默认配置（需要环境变量）
export function createQAnythingService(): QAnythingService | null {
  const baseUrl = process.env.QANYTHING_BASE_URL;
  const appKey = process.env.QANYTHING_APP_KEY;
  const appSecret = process.env.QANYTHING_APP_SECRET;

  if (!baseUrl || !appKey || !appSecret) {
    console.warn('QAnything credentials not configured. Set QANYTHING_BASE_URL, QANYTHING_APP_KEY, QANYTHING_APP_SECRET environment variables.');
    return null;
  }

  return new QAnythingService({
    baseUrl,
    appKey,
    appSecret
  });
}