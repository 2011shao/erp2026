<template>
  <view class="login-container">
    <view class="login-form">
      <view class="logo">
        <text class="logo-text">多店铺ERP系统</text>
      </view>
      <view class="form-item">
        <input v-model="form.username" type="text" placeholder="请输入用户名" />
      </view>
      <view class="form-item">
        <input v-model="form.password" type="password" placeholder="请输入密码" />
      </view>
      <button class="login-btn" @click="login">登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  username: '',
  password: ''
})

const login = () => {
  // 登录逻辑
  console.log('Login form:', form.value)
  // 模拟登录成功，跳转到首页
  uni.switchTab({ url: '/pages/dashboard/index' })
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  width: 90%;
  max-width: 400px;
  background-color: white;
  padding: 30rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.logo {
  text-align: center;
  margin-bottom: 40rpx;
}

.logo-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #007aff;
}

.form-item {
  margin-bottom: 30rpx;
}

input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 5rpx;
  font-size: 28rpx;
}

.login-btn {
  width: 100%;
  height: 80rpx;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 5rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>