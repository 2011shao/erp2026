import { defineStore } from 'pinia'

interface UserState {
  token: string
  userInfo: {
    id: string
    username: string
    role: string
    shopId: string
  }
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || {
      id: '',
      username: '',
      role: '',
      shopId: ''
    },
    isLoggedIn: !!uni.getStorageSync('token')
  }),
  
  getters: {
    getToken: (state) => state.token,
    getUserInfo: (state) => state.userInfo,
    getIsLoggedIn: (state) => state.isLoggedIn
  },
  
  actions: {
    setToken(token: string) {
      this.token = token
      uni.setStorageSync('token', token)
    },
    
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
      uni.setStorageSync('userInfo', userInfo)
    },
    
    login(token: string, userInfo: any) {
      this.setToken(token)
      this.setUserInfo(userInfo)
      this.isLoggedIn = true
    },
    
    logout() {
      this.token = ''
      this.userInfo = {
        id: '',
        username: '',
        role: '',
        shopId: ''
      }
      this.isLoggedIn = false
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  }
})