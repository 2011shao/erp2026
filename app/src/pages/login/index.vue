<template>
  <view class="login-container">
    <view class="login-form">
      <view class="logo">
        <text class="logo-text">多店铺ERP系统</text>
      </view>
      <view class="form-item">
        <input v-model="form.username" type="text" placeholder="请输入用户名" />
        <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
      </view>
      <view class="form-item">
        <input v-model="form.password" type="password" placeholder="请输入密码" />
        <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
      </view>
      <button class="login-btn" @click="login" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../store/user'
import { request } from '../../api/request'

const form = ref({
  username: '',
  password: ''
})

const errors = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const userStore = useUserStore()

const validateForm = () => {
  let isValid = true
  
  if (!form.value.username) {
    errors.value.username = '请输入用户名'
    isValid = false
  } else {
    errors.value.username = ''
  }
  
  if (!form.value.password) {
    errors.value.password = '请输入密码'
    isValid = false
  } else {
    errors.value.password = ''
  }
  
  return isValid
}

const login = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const response = await uniCloud.callFunction({
      name: 'login',
      data: {
        username: form.value.username,
        password: form.value.password
      }
    })
    
    if (response.result.code === 0) {
      userStore.login(response.result.data.token, response.result.data.userInfo)
      uni.switchTab({ url: '/pages/dashboard/index' })
    } else {
      uni.showToast({
        title: response.result.message || '登录失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
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

.error-text {
  color: #ff3b30;
  font-size: 20rpx;
  margin-top: 8rpx;
  display: block;
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

.login-btn:disabled {
  background-color: #c7c7cc;
}
</style>