import api from '../api';

interface LogEntry {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
}

interface SystemLogEntry {
  id?: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export class LogService {
  // 记录用户操作日志
  static async logUserAction(
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const ip = await this.getClientIP();
      const userAgent = navigator.userAgent;

      const logEntry: LogEntry = {
        userId,
        action,
        resource,
        resourceId,
        details,
        ip,
        userAgent,
      };

      // 发送日志到后端
      await api.post('/logs/user', logEntry);
    } catch (error) {
      console.error('Error logging user action:', error);
      // 日志记录失败不应影响主流程
    }
  }

  // 记录系统日志
  static async logSystemEvent(
    level: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: SystemLogEntry = {
        level,
        message,
        details,
      };

      // 发送日志到后端
      await api.post('/logs/system', logEntry);
    } catch (error) {
      console.error('Error logging system event:', error);
      // 日志记录失败不应影响主流程
    }
  }

  // 获取客户端IP
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // 获取用户操作日志
  static async getUserLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return api.get('/logs/user', { params });
  }

  // 获取系统日志
  static async getSystemLogs(params?: {
    page?: number;
    limit?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return api.get('/logs/system', { params });
  }
}

// 日志记录装饰器
export function LogAction(action: string, resource: string) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // 执行原始方法
        const result = await originalMethod.apply(this, args);

        // 提取资源ID（如果有）
        let resourceId: string | undefined;
        if (args.length > 0 && typeof args[0] === 'string') {
          resourceId = args[0];
        }

        // 记录操作
        await LogService.logUserAction(action, resource, resourceId, {
          args: args.slice(0, 3), // 只记录前3个参数，避免过大
        });

        return result;
      } catch (error) {
        // 记录错误
        await LogService.logUserAction(`${action}_error`, resource, undefined, {
          error: (error as Error).message,
          args: args.slice(0, 3),
        });
        throw error;
      }
    };
  };
}
