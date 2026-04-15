/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 处理API错误
   * @param error 错误对象
   * @returns 标准化的错误信息
   */
  static handleApiError(error: any): ErrorInfo {
    if (!error) {
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: '未知错误',
      };
    }

    // 网络错误
    if (!error.response) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: '网络连接失败，请检查网络设置',
        details: error.message,
      };
    }

    const { status, data } = error.response;

    // 认证错误
    if (status === 401) {
      return {
        type: ErrorType.AUTH_ERROR,
        message: '登录已过期，请重新登录',
        statusCode: status,
      };
    }

    // 验证错误
    if (status === 400) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message: data.error || '请求参数错误',
        details: data.details,
        statusCode: status,
      };
    }

    // 服务器错误
    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: '服务器内部错误，请稍后重试',
        statusCode: status,
      };
    }

    // 其他错误
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: data.error || '操作失败，请稍后重试',
      details: data,
      statusCode: status,
    };
  }

  /**
   * 显示错误消息
   * @param error 错误信息或错误对象
   */
  static showError(error: ErrorInfo | any): void {
    let errorInfo: ErrorInfo;

    if (typeof error === 'string') {
      errorInfo = {
        type: ErrorType.UNKNOWN_ERROR,
        message: error,
      };
    } else if ('type' in error && 'message' in error) {
      errorInfo = error;
    } else {
      errorInfo = this.handleApiError(error);
    }

    // 这里可以根据错误类型显示不同的错误消息
    // 例如使用 Ant Design 的 message 组件
    console.error('Error:', errorInfo);
  }

  /**
   * 处理边界情况
   * @param data 数据
   * @param defaultValue 默认值
   * @returns 处理后的数据
   */
  static handleEdgeCase<T>(data: T | null | undefined, defaultValue: T): T {
    if (data === null || data === undefined) {
      return defaultValue;
    }

    // 处理空数组
    if (Array.isArray(data) && data.length === 0) {
      return defaultValue;
    }

    // 处理空对象
    if (typeof data === 'object' && Object.keys(data).length === 0) {
      return defaultValue;
    }

    return data;
  }

  /**
   * 安全地获取嵌套对象属性
   * @param obj 对象
   * @param path 属性路径
   * @param defaultValue 默认值
   * @returns 属性值或默认值
   */
  static safeGet<T>(obj: any, path: string, defaultValue: T): T {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }

    return result === undefined ? defaultValue : result;
  }
}
