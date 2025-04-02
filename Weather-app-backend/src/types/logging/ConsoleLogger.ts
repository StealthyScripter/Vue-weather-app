// types/logging/ConsoleLogger.ts
import { ILogger } from './ILogger';

export class ConsoleLogger implements ILogger {
  private readonly logLevel: LogLevel;
  
  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }
  
  public debug(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }
  
  public info(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }
  
  public warn(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }
  
  public error(message: string, meta?: Record<string, unknown>): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, meta || '');
    }
  }
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}