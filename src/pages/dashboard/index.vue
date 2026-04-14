<template>
  <view class="dashboard-container">
    <view class="header">
      <text class="header-title">首页</text>
    </view>
    <view class="stats-container">
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
import { ref } from 'vue'

const stats = ref({
  sales: '¥12,345',
  inventory: '1,234',
  orders: '56',
  shops: '3'
})

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}
</script>

<style scoped>
.dashboard-container {
  padding: 20rpx;
}

.header {
  margin-bottom: 30rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
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