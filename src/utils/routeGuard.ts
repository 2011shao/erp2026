import { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

// 路由守卫逻辑
export const routeGuard = (to: any, from: any, next: any) => {
  // 获取token
  const token = uni.getStorageSync('token')
  
  // 白名单页面，不需要登录
  const whiteList = ['/pages/login/index']
  
  // 检查是否在白名单中
  if (whiteList.includes(to.path)) {
    next()
    return
  }
  
  // 检查是否有token
  if (token) {
    next()
  } else {
    // 跳转到登录页面
    uni.redirectTo({ url: '/pages/login/index' })
  }
}

// 初始化路由守卫
export const initRouteGuard = () => {
  // 在UniApp中，我们可以通过全局的导航守卫来实现路由控制
  // 由于UniApp的路由机制与Vue Router有所不同，我们需要使用UniApp的生命周期钩子
  // 这里我们在App.vue中实现路由守卫逻辑
  console.log('路由守卫初始化完成')
}