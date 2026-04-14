// 加密工具类
export const cryptoUtils = {
  // 简单的MD5加密（模拟实现）
  md5: (str: string): string => {
    // 这里使用一个简单的哈希函数模拟MD5
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  },
  
  // 生成随机字符串
  generateRandomString: (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },
  
  // 生成订单号
  generateOrderNo: (): string => {
    const timestamp = Date.now().toString()
    const random = cryptoUtils.generateRandomString(6)
    return `ORD${timestamp}${random}`
  },
  
  // 生成采购单号
  generatePurchaseNo: (): string => {
    const timestamp = Date.now().toString()
    const random = cryptoUtils.generateRandomString(6)
    return `PUR${timestamp}${random}`
  },
  
  // 生成唯一ID
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}