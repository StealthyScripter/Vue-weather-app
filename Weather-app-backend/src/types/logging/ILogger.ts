// types/logging/ILogger.ts
export interface ILogger {
    /**
     * Logs a debug message
     * @param message Message to log
     * @param meta Additional metadata
     */
    debug(message: string, meta?: Record<string, unknown>): void;
    
    /**
     * Logs an informational message
     * @param message Message to log
     * @param meta Additional metadata
     */
    info(message: string, meta?: Record<string, unknown>): void;
    
    /**
     * Logs a warning message
     * @param message Message to log
     * @param meta Additional metadata
     */
    warn(message: string, meta?: Record<string, unknown>): void;
    
    /**
     * Logs an error message
     * @param message Message to log
     * @param meta Additional metadata
     */
    error(message: string, meta?: Record<string, unknown>): void;
  }