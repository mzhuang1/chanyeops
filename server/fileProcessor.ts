import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import mimeTypes from 'mime-types';
import XLSX from 'xlsx';
import csv from 'csv-parser';
// PDF parsing temporarily disabled due to dependency issues
import mammoth from 'mammoth';
import sharp from 'sharp';
import * as iconv from 'iconv-lite';
import { storage } from './storage';
import { analyzeFileContent, generateFileSummary } from './openai';

export interface FileProcessingResult {
  extractedText: string;
  metadata: any;
  summary: string;
  analysisResults?: any;
}

export class FileProcessor {
  private static SUPPORTED_TYPES = {
    // Spreadsheets
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
    'application/vnd.ms-excel': 'excel',
    'text/csv': 'csv',
    
    // Documents
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
    'application/msword': 'word',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
    'application/vnd.ms-powerpoint': 'powerpoint',
    
    // Data
    'application/json': 'json',
    'text/plain': 'text',
    
    // Images
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image',
    'image/bmp': 'image',
  };

  static getFileType(mimeType: string): string | null {
    return (this.SUPPORTED_TYPES as Record<string, string>)[mimeType] || null;
  }

  static isSupported(mimeType: string): boolean {
    return mimeType in this.SUPPORTED_TYPES;
  }

  static async processFile(filePath: string, uploadId: number): Promise<FileProcessingResult> {
    const fileBuffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(fileBuffer);
    const mimeType = fileType?.mime || mimeTypes.lookup(filePath) || 'application/octet-stream';
    
    const processorType = this.getFileType(mimeType);
    
    if (!processorType) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Update status to analyzing
    await storage.updateDataUploadStatus(uploadId, 'analyzing');

    let result: FileProcessingResult;

    switch (processorType) {
      case 'excel':
        result = await this.processExcel(fileBuffer);
        break;
      case 'csv':
        result = await this.processCsv(filePath);
        break;
      case 'pdf':
        result = await this.processPdf(fileBuffer);
        break;
      case 'word':
        result = await this.processWord(fileBuffer);
        break;
      case 'powerpoint':
        result = await this.processPowerPoint(fileBuffer);
        break;
      case 'json':
        result = await this.processJson(fileBuffer);
        break;
      case 'text':
        result = await this.processText(fileBuffer);
        break;
      case 'image':
        result = await this.processImage(fileBuffer, filePath);
        break;
      default:
        throw new Error(`No processor available for type: ${processorType}`);
    }

    // Generate AI analysis
    result.analysisResults = await analyzeFileContent(result.extractedText, processorType, result.metadata);

    return result;
  }

  private static async processExcel(buffer: Buffer): Promise<FileProcessingResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = [];
    let extractedText = '';
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      
      sheets.push({
        name: sheetName,
        rowCount: jsonData.length,
        data: jsonData.slice(0, 100) // First 100 rows for analysis
      });
      
      extractedText += `\n=== Sheet: ${sheetName} ===\n${csvData}\n`;
    }

    const summary = await generateFileSummary(extractedText, 'excel');
    
    return {
      extractedText,
      metadata: {
        sheets: sheets.map(s => ({ name: s.name, rowCount: s.rowCount })),
        totalSheets: workbook.SheetNames.length
      },
      summary
    };
  }

  private static async processCsv(filePath: string): Promise<FileProcessingResult> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      let headers: string[] = [];
      let extractedText = '';

      fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (row) => {
          rows.push(row);
          if (rows.length <= 100) { // First 100 rows for text extraction
            extractedText += Object.values(row).join(',') + '\n';
          }
        })
        .on('end', async () => {
          try {
            const summary = await generateFileSummary(extractedText, 'csv');
            resolve({
              extractedText,
              metadata: {
                headers,
                rowCount: rows.length,
                sampleData: rows.slice(0, 10)
              },
              summary
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private static async processPdf(buffer: Buffer): Promise<FileProcessingResult> {
    try {
      // Basic PDF text extraction - extracting readable text from buffer
      const text = buffer.toString('utf8');
      // Simple PDF text extraction by finding text patterns
      const extractedText = text.replace(/[^\x20-\x7E\u4e00-\u9fff]/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim()
                               .substring(0, 5000); // First 5k characters for analysis
      
      const summary = await generateFileSummary(extractedText, 'pdf');
      
      return {
        extractedText: extractedText || 'PDF文件已上传，但文本内容提取受限。建议使用Word格式获得更好的分析效果。',
        metadata: {
          pages: 1, // Estimated
          info: { title: "PDF文档" },
          wordCount: extractedText.split(/\s+/).length,
          fileSize: buffer.length
        },
        summary
      };
    } catch (error) {
      console.error("PDF processing error:", error);
      const fallbackSummary = await generateFileSummary('PDF文件已成功上传，但需要专用PDF处理工具进行完整分析。', 'pdf');
      return {
        extractedText: 'PDF文件已成功上传。由于PDF格式限制，建议上传Word文档以获得更精确的文本分析。',
        metadata: {
          pages: 0,
          info: { title: "PDF文档" },
          wordCount: 0,
          fileSize: buffer.length
        },
        summary: fallbackSummary
      };
    }
  }

  private static async processWord(buffer: Buffer): Promise<FileProcessingResult> {
    const result = await mammoth.extractRawText({ buffer });
    const summary = await generateFileSummary(result.value, 'word');
    
    return {
      extractedText: result.value,
      metadata: {
        wordCount: result.value.split(' ').length,
        characterCount: result.value.length
      },
      summary
    };
  }

  private static async processPowerPoint(buffer: Buffer): Promise<FileProcessingResult> {
    // For PowerPoint, we'll extract text using a basic approach
    // In production, you might want to use a more sophisticated library
    const text = buffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').trim();
    const cleanText = text.replace(/\s+/g, ' ').substring(0, 10000); // First 10k chars
    
    const summary = await generateFileSummary(cleanText, 'powerpoint');
    
    return {
      extractedText: cleanText,
      metadata: {
        fileSize: buffer.length,
        extractedLength: cleanText.length
      },
      summary
    };
  }

  private static async processJson(buffer: Buffer): Promise<FileProcessingResult> {
    const jsonText = buffer.toString('utf8');
    const data = JSON.parse(jsonText);
    const summary = await generateFileSummary(jsonText, 'json');
    
    return {
      extractedText: jsonText,
      metadata: {
        structure: this.analyzeJsonStructure(data),
        size: Object.keys(data).length
      },
      summary
    };
  }

  private static async processText(buffer: Buffer): Promise<FileProcessingResult> {
    // Handle UTF-8 encoding properly for Chinese text
    let text: string;
    try {
      // Try UTF-8 first
      text = iconv.decode(buffer, 'utf8');
      
      // Validate UTF-8 encoding by checking for replacement characters
      if (text.includes('�') || text.includes('\uFFFD')) {
        // Try GBK encoding for Chinese text files
        text = iconv.decode(buffer, 'gbk');
        
        // If GBK also fails, try GB2312
        if (text.includes('�') || text.includes('\uFFFD')) {
          text = iconv.decode(buffer, 'gb2312');
        }
      }
    } catch (error) {
      // Fallback to basic UTF-8
      text = buffer.toString('utf8');
    }
    
    const summary = await generateFileSummary(text, 'text');
    
    return {
      extractedText: text,
      metadata: {
        wordCount: text.split(' ').length,
        lineCount: text.split('\n').length,
        characterCount: text.length
      },
      summary
    };
  }

  private static async processImage(buffer: Buffer, filePath: string): Promise<FileProcessingResult> {
    const metadata = await sharp(buffer).metadata();
    
    // Convert image to base64 for AI analysis
    const base64 = buffer.toString('base64');
    const summary = await generateFileSummary('', 'image', { base64, metadata });
    
    return {
      extractedText: `Image file: ${path.basename(filePath)}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha
      },
      summary
    };
  }

  private static analyzeJsonStructure(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth || obj === null || typeof obj !== 'object') {
      return typeof obj;
    }

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        elementType: obj.length > 0 ? this.analyzeJsonStructure(obj[0], maxDepth, currentDepth + 1) : 'unknown'
      };
    }

    const structure: any = { type: 'object', properties: {} };
    for (const [key, value] of Object.entries(obj)) {
      structure.properties[key] = this.analyzeJsonStructure(value, maxDepth, currentDepth + 1);
    }
    
    return structure;
  }
}