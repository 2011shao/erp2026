import { request } from '../request'

interface LoginParams {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  userInfo: {
    id: string
    username: string
    role: string
    shopId: string
  }
}

export const userApi = {
  // 登录
  login: (params: LoginParams) => {
    return request.post<LoginResponse>('/api/user/login', params)
  },
  
  // 登出
  logout: () => {
    return request.post('/api/user/logout')
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request.get('/api/user/info')
  },
  
  // 修改密码
  changePassword: (params: { oldPassword: string; newPassword: string }) => {
    return request.post('/api/user/change-password', params)
  }
}