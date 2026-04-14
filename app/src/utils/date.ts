// 日期工具类
export const dateUtils = {
  // 格式化日期为 YYYY-MM-DD
  formatDate: (date: Date | string | number): string => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  // 格式化日期时间为 YYYY-MM-DD HH:mm:ss
  formatDateTime: (date: Date | string | number): string => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },
  
  // 获取今天的日期
  getToday: (): string => {
    return dateUtils.formatDate(new Date())
  },
  
  // 获取昨天的日期
  getYesterday: (): string => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return dateUtils.formatDate(yesterday)
  },
  
  // 获取本周开始日期
  getWeekStart: (): string => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(now.setDate(diff))
    return dateUtils.formatDate(weekStart)
  },
  
  // 获取本周结束日期
  getWeekEnd: (): string => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? 0 : 7 - day)
    const weekEnd = new Date(now.setDate(diff))
    return dateUtils.formatDate(weekEnd)
  },
  
  // 获取本月开始日期
  getMonthStart: (): string => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return dateUtils.formatDate(monthStart)
  },
  
  // 获取本月结束日期
  getMonthEnd: (): string => {
    const now = new Date()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return dateUtils.formatDate(monthEnd)
  },
  
  // 计算两个日期之间的天数差
  getDaysDiff: (startDate: Date | string | number, endDate: Date | string | number): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
}