import fs from "fs";
import path from "path";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logFile?: string;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logFile = process.env.LOG_FILE;

    // Ensure log directory exists
    if (this.logFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || "INFO";
    switch (level) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private formatLogEntry(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // Console output
    console.log(logString);

    // File output
    if (this.logFile) {
      fs.appendFileSync(this.logFile, logString + "\n");
    }
  }

  error(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.writeLog(this.formatLogEntry("ERROR", message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.WARN) {
      this.writeLog(this.formatLogEntry("WARN", message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.INFO) {
      this.writeLog(this.formatLogEntry("INFO", message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.writeLog(this.formatLogEntry("DEBUG", message, meta));
    }
  }

  // HTTP request logging
  logRequest(req: any, res: any, duration: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.url}`, logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    error?: Error
  ): void {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
      ...(error && { error: error.message }),
    };

    if (error) {
      this.error(
        `Database operation failed: ${operation} on ${table}`,
        logData
      );
    } else {
      this.debug(`Database operation: ${operation} on ${table}`, logData);
    }
  }

  // Security event logging
  logSecurityEvent(event: string, details: any): void {
    this.warn(`Security event: ${event}`, details);
  }
}

export const logger = new Logger();
