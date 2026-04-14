import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || {}
  },
  mutations: {
    setToken(state, token) {
      state.token = token
      uni.setStorageSync('token', token)
    },
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo
      uni.setStorageSync('userInfo', userInfo)
    },
    logout(state) {
      state.token = ''
      state.userInfo = {}
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  },
  getters: {
    getToken: state => state.token,
    getUserInfo: state => state.userInfo,
    getIsLoggedIn: state => !!state.token
  }
})

Vue.prototype.$store = store

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')