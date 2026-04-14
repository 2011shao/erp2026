<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { initRouteGuard } from './utils/routeGuard'

onMounted(() => {
  console.log('App mounted')
  initRouteGuard()
})

// 全局导航守卫
uni.addInterceptor('navigateTo', {
  invoke(e) {
    const token = uni.getStorageSync('token')
    const whiteList = ['/pages/login/index']
    if (!whiteList.includes(e.url) && !token) {
      uni.redirectTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }
})

uni.addInterceptor('switchTab', {
  invoke(e) {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.redirectTo({ url: '/pages/login/index' })
      return false
    }
    return true
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>