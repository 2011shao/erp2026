import { useUserStore } from '../store/user'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: any
  loading?: boolean
}

interface ResponseData {
  code: number
  message: string
  data: any
}

export class Request {
  private baseURL: string
  private userStore: ReturnType<typeof useUserStore>

  constructor() {
    this.baseURL = '' // 这里可以设置API基础URL
    this.userStore = useUserStore()
  }

  async request<T = any>(options: RequestOptions): Promise<T> {
    const { url, method = 'GET', data = {}, headers = {}, loading = true } = options

    if (loading) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }

    try {
      const token = this.userStore.getToken
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      }

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }

      const response = await new Promise<ResponseData>((resolve, reject) => {
        uni.request({
          url: this.baseURL + url,
          method,
          data,
          header: requestHeaders,
          success: (res) => {
            resolve(res.data as ResponseData)
          },
          fail: (err) => {
            reject(err)
          }
        })
      })

      if (response.code === 0) {
        return response.data as T
      } else {
        uni.showToast({
          title: response.message || '请求失败',
          icon: 'none'
        })
        throw new Error(response.message || '请求失败')
      }
    } catch (error) {
      uni.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
      throw error
    } finally {
      if (loading) {
        uni.hideLoading()
      }
    }
  }

  get<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
    return this.request<T>({
      url,
      method: 'GET',
      data,
      ...options
    })
  }

  post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  delete<T = any>(url: string, data?: any, options?: Partial<RequestOptions>) {
    return this.request<T>({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }
}

export const request = new Request()