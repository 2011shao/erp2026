/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 批量处理API请求
 * @param requests 请求函数数组
 * @returns 所有请求的结果
 */
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>
): Promise<T[]> {
  try {
    const results = await Promise.all(requests);
    return results;
  } catch (error) {
    console.error('Batch request failed:', error);
    throw error;
  }
}

/**
 * 带重试机制的API请求
 * @param request 请求函数
 * @param retries 重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 请求结果
 */
export async function retryRequest<T>(
  request: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(request, retries - 1, delay * 2);
    }
    throw error;
  }
}
