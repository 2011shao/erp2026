import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: string
  username: string
  role: string
  shopId: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(uni.getStorageSync('token') || '')
  const userInfo = ref<UserInfo>(uni.getStorageSync('userInfo') || {
    id: '',
    username: '',
    role: '',
    shopId: ''
  })
  const isLoggedIn = ref<boolean>(!!uni.getStorageSync('token'))

  const getToken = computed(() => token.value)
  const getUserInfo = computed(() => userInfo.value)
  const getIsLoggedIn = computed(() => isLoggedIn.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  const setUserInfo = (newUserInfo: UserInfo) => {
    userInfo.value = newUserInfo
    uni.setStorageSync('userInfo', newUserInfo)
  }

  const login = (newToken: string, newUserInfo: UserInfo) => {
    setToken(newToken)
    setUserInfo(newUserInfo)
    isLoggedIn.value = true
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {
      id: '',
      username: '',
      role: '',
      shopId: ''
    }
    isLoggedIn.value = false
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    getToken,
    getUserInfo,
    getIsLoggedIn,
    setToken,
    setUserInfo,
    login,
    logout
  }
})