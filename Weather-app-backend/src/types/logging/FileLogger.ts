// types/logging/FileLogger.ts
import { ILogger } from './ILogger';
import fs from 'fs';
import path from 'path';

export class FileLogger implements ILogger {
  private readonly logLevel: LogLevel;
  private readonly logDirectory: string;
  private readonly maxFileSize: number; // in bytes
  private currentLogFile: string;
  
  constructor(
    logDirectory: string,
    logLevel: LogLevel = LogLevel.INFO,
    maxFileSize: number = 10 * 1024 * 1024 // 10MB default
  ) {
    this.logLevel = logLevel;
    this.logDirectory = logDirectory;
    this.maxFileSize = maxFileSize;
    this.currentLogFile = this.getLogFileName();
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }
  
  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.writeLog('DEBUG', message, meta);
    }
  }
  
  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.writeLog('INFO', message, meta);
    }
  }
  
  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.writeLog('WARN', message, meta);
    }
  }
  
  public error(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.writeLog('ERROR', message, meta);
    }
  }
  
  private writeLog(level: string, message: string, meta?: Record<string, unknown>): void {
    // Check if rotation is needed
    this.rotateLogIfNeeded();
    
    const timestamp = new Date().toISOString();
    let logEntry = `${timestamp} [${level}] ${message}`;
    
    if (meta) {
      logEntry += ` ${JSON.stringify(meta)}`;
    }
    
    logEntry += '\n';
    
    // Append to log file
    fs.appendFileSync(this.currentLogFile, logEntry);
  }
  
  private rotateLogIfNeeded(): void {
    try {
      const stats = fs.statSync(this.currentLogFile);
      
      if (stats.size >= this.maxFileSize) {
        // Time to rotate
        this.currentLogFile = this.getLogFileName();
      }
    } catch (error) {
      // File likely doesn't exist yet, which is fine
    }
  }
  
  private getLogFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString()
      .split('T')[1]
      .replace(/:/g, '-')
      .split('.')[0];
      
    return path.join(
      this.logDirectory,
      `app-${dateStr}-${timeStr}.log`
    );
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}