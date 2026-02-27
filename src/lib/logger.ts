type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  userId?: string;
  path?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const base = {
      time: entry.timestamp,
      level: entry.level.toUpperCase(),
      msg: entry.message,
      ...entry.context,
    };
    return JSON.stringify(base);
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (this.isDevelopment) {
      const coloredMessage = this.getColoredMessage(level, message);
      console.log(coloredMessage, context ? JSON.stringify(context, null, 2) : '');
    } else {
      console.log(this.formatLog(entry));
    }
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    const colors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    };
    const reset = '\x1b[0m';
    return `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`;
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: this.isDevelopment ? error.stack : undefined,
          },
        }
      : context;
    this.log('error', message, errorContext);
  }

  logUserAction(userId: string, action: string, details?: LogContext) {
    this.info(`User Action: ${action}`, {
      ...details,
      userId,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  logApiCall(path: string, method: string, statusCode: number, duration: number) {
    this.info(`API Call: ${method} ${path}`, {
      path,
      method,
      statusCode,
      durationMs: duration,
    });
  }
}

export const logger = new Logger();

export function createContextLogger(context: LogContext) {
  return {
    debug: (message: string, ctx?: LogContext) => logger.debug(message, { ...context, ...ctx }),
    info: (message: string, ctx?: LogContext) => logger.info(message, { ...context, ...ctx }),
    warn: (message: string, ctx?: LogContext) => logger.warn(message, { ...context, ...ctx }),
    error: (message: string, error?: Error, ctx?: LogContext) => logger.error(message, error, { ...context, ...ctx }),
  };
}
