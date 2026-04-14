// 验证工具类
export const validateUtils = {
  // 验证手机号
  isPhone: (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },
  
  // 验证邮箱
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  // 验证密码强度（至少8位，包含字母和数字）
  isStrongPassword: (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    return passwordRegex.test(password)
  },
  
  // 验证身份证号
  isIdCard: (idCard: string): boolean => {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    return idCardRegex.test(idCard)
  },
  
  // 验证是否为空
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) {
      return true
    }
    if (typeof value === 'string') {
      return value.trim() === ''
    }
    if (Array.isArray(value)) {
      return value.length === 0
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0
    }
    return false
  },
  
  // 验证数字
  isNumber: (value: any): boolean => {
    return !isNaN(Number(value))
  },
  
  // 验证正整数
  isPositiveInteger: (value: any): boolean => {
    const num = Number(value)
    return Number.isInteger(num) && num > 0
  },
  
  // 验证金额（最多两位小数）
  isAmount: (value: string): boolean => {
    const amountRegex = /^\d+(\.\d{1,2})?$/
    return amountRegex.test(value)
  },
  
  // 验证字符串长度
  isLength: (value: string, min: number, max: number): boolean => {
    const length = value.trim().length
    return length >= min && length <= max
  }
}