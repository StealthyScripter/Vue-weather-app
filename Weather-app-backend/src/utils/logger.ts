import fs from 'fs';
import path from 'path';
import config from '../config';

// Define the LogLevel enum directly in this file to avoid import issues
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Define the ILogger interface directly
export interface ILogger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export class FileLogger implements ILogger {
  private readonly logLevel: LogLevel;
  private readonly logDirectory: string;
  private readonly maxFileSize: number; // in bytes
  private currentLogFile: string;
  
  constructor(
    logDirectory: string = config.logDirectory,
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
  
  public debug(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      this.writeLog('DEBUG', message, meta);
    }
  }
  
  public info(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.INFO) {
      this.writeLog('INFO', message, meta);
    }
  }
  
  public warn(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.WARN) {
      this.writeLog('WARN', message, meta);
    }
  }
  
  public error(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.ERROR) {
      this.writeLog('ERROR', message, meta);
    }
  }
  
  private writeLog(level: string, message: string, meta?: unknown): void {
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
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        
        if (stats.size >= this.maxFileSize) {
          // Time to rotate
          this.currentLogFile = this.getLogFileName();
        }
      }
    } catch (error) {
      // File likely doesn't exist yet, which is fine
      console.error('Error checking log file size:', error);
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

export class ConsoleLogger implements ILogger {
  private readonly logLevel: LogLevel;
  
  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }
  
  public debug(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    }
  }
  
  public info(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, meta || '');
    }
  }
  
  public warn(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  }
  
  public error(message: string, meta?: unknown): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, meta || '');
    }
  }
}

export class CompositeLogger implements ILogger {
  private loggers: ILogger[];
  
  constructor(loggers: ILogger[] = []) {
    this.loggers = loggers;
  }
  
  public addLogger(logger: ILogger): void {
    this.loggers.push(logger);
  }
  
  public debug(message: string, meta?: unknown): void {
    this.loggers.forEach(logger => logger.debug(message, meta));
  }
  
  public info(message: string, meta?: unknown): void {
    this.loggers.forEach(logger => logger.info(message, meta));
  }
  
  public warn(message: string, meta?: unknown): void {
    this.loggers.forEach(logger => logger.warn(message, meta));
  }
  
  public error(message: string, meta?: unknown): void {
    this.loggers.forEach(logger => logger.error(message, meta));
  }
}

// Get the appropriate log level from config
const getLogLevelFromString = (level: string): LogLevel => {
  switch (level.toLowerCase()) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};

// Create and export default logger instance
const logLevel = getLogLevelFromString(config.logLevel);
const logger = new CompositeLogger([
  new ConsoleLogger(logLevel),
  new FileLogger(config.logDirectory, logLevel)
]);

export default logger;