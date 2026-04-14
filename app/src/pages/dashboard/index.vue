<template>
  <view class="dashboard-container">
    <view class="header">
      <text class="header-title">首页</text>
      <button class="refresh-btn" @click="fetchDashboardData" :disabled="loading">
        <text class="refresh-icon">🔄</text>
      </button>
    </view>
    <view class="stats-container" v-if="!loading">
      <view class="stat-item">
        <text class="stat-value">{{ stats.sales }}</text>
        <text class="stat-label">今日销售</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.inventory }}</text>
        <text class="stat-label">库存总量</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.orders }}</text>
        <text class="stat-label">今日订单</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ stats.shops }}</text>
        <text class="stat-label">店铺数量</text>
      </view>
    </view>
    <view class="loading-container" v-else>
      <text class="loading-text">加载中...</text>
    </view>
    <view class="menu-container">
      <view class="menu-item" @click="navigateTo('/pages/shop-management/index')">
        <view class="menu-icon">🏪</view>
        <text class="menu-text">店铺管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/inventory/index')">
        <view class="menu-icon">📦</view>
        <text class="menu-text">库存管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/sales/index')">
        <view class="menu-icon">💰</view>
        <text class="menu-text">销售管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/purchase/index')">
        <view class="menu-icon">🛒</view>
        <text class="menu-text">采购管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/supplier/index')">
        <view class="menu-icon">🤝</view>
        <text class="menu-text">供应商管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/customer/index')">
        <view class="menu-icon">👥</view>
        <text class="menu-text">客户管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/finance/index')">
        <view class="menu-icon">💳</view>
        <text class="menu-text">财务管理</text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/reports/index')">
        <view class="menu-icon">📊</view>
        <text class="menu-text">报表分析</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = ref({
  sales: '¥0',
  inventory: '0',
  orders: '0',
  shops: '0'
})

const loading = ref(false)

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

const fetchDashboardData = async () => {
  loading.value = true
  
  try {
    // 模拟API调用获取仪表盘数据
    // 实际项目中应调用真实的云函数
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟数据
    stats.value = {
      sales: '¥12,345',
      inventory: '1,234',
      orders: '56',
      shops: '3'
    }
  } catch (error) {
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.refresh-btn {
  background: none;
  border: none;
  padding: 10rpx;
}

.refresh-icon {
  font-size: 28rpx;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.stat-item {
  background-color: white;
  padding: 30rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #007aff;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  margin-bottom: 40rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.menu-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.menu-item {
  background-color: white;
  padding: 30rpx 10rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  text-align: center;
}

.menu-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.menu-text {
  font-size: 24rpx;
  color: #333;
}
</style>