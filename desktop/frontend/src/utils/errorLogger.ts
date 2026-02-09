/**
 * Error logging utility for structured error tracking and debugging
 * Provides centralized error logging with different severity levels
 */

export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  componentStack?: string;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100; // Keep last 100 logs in memory
  private enableConsoleLog: boolean = true;

  /**
   * Log an error with context
   */
  log(
    severity: ErrorSeverity,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      message,
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging
    if (this.enableConsoleLog) {
      this.logToConsole(entry);
    }

    // Save to localStorage for persistence
    this.saveToLocalStorage(entry);

    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    // this.sendToExternalService(entry);
  }

  /**
   * Log to browser console with appropriate level
   */
  private logToConsole(entry: ErrorLogEntry) {
    const prefix = `[${entry.timestamp}] [${entry.severity.toUpperCase()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.severity) {
      case 'debug':
        console.debug(message, entry);
        break;
      case 'info':
        console.info(message, entry);
        break;
      case 'warning':
        console.warn(message, entry);
        break;
      case 'error':
      case 'critical':
        console.error(message, entry);
        if (entry.error) {
          console.error('Error object:', entry.error);
        }
        break;
    }
  }

  /**
   * Save error logs to localStorage
   */
  private saveToLocalStorage(entry: ErrorLogEntry) {
    try {
      const key = 'sqlingo_error_logs';
      const existing = localStorage.getItem(key);
      let logs: ErrorLogEntry[] = existing ? JSON.parse(existing) : [];

      // Add new entry
      logs.push({
        ...entry,
        // Don't store Error object in localStorage (not serializable)
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        } as any : undefined,
      });

      // Keep only last 50 logs in localStorage
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }

      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      // Fail silently if localStorage is unavailable
      console.warn('Failed to save error log to localStorage:', error);
    }
  }

  /**
   * Get all logs from memory
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs from localStorage
   */
  getStoredLogs(): ErrorLogEntry[] {
    try {
      const key = 'sqlingo_error_logs';
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve error logs from localStorage:', error);
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('sqlingo_error_logs');
    } catch (error) {
      console.warn('Failed to clear error logs from localStorage:', error);
    }
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    const allLogs = {
      memoryLogs: this.logs,
      storedLogs: this.getStoredLogs(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(allLogs, null, 2);
  }

  /**
   * Download logs as a file
   */
  downloadLogs() {
    const logsJson = this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqlingo-error-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled: boolean) {
    this.enableConsoleLog = enabled;
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Convenience functions
export const logError = (
  message: string,
  error?: Error,
  context?: Record<string, any>
) => {
  errorLogger.log('error', message, error, context);
};

export const logWarning = (
  message: string,
  context?: Record<string, any>
) => {
  errorLogger.log('warning', message, undefined, context);
};

export const logInfo = (
  message: string,
  context?: Record<string, any>
) => {
  errorLogger.log('info', message, undefined, context);
};

export const logDebug = (
  message: string,
  context?: Record<string, any>
) => {
  errorLogger.log('debug', message, undefined, context);
};

export const logCritical = (
  message: string,
  error?: Error,
  context?: Record<string, any>
) => {
  errorLogger.log('critical', message, error, context);
};

export default errorLogger;
