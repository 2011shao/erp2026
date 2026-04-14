<template>
  <button 
    :class="['custom-button', type, size, { disabled }]" 
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'medium'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.custom-button {
  border: none;
  border-radius: 5rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.custom-button:active {
  transform: scale(0.98);
}

/* 类型样式 */
.primary {
  background-color: #007aff;
  color: white;
}

.secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1rpx solid #e0e0e0;
}

.danger {
  background-color: #ff3b30;
  color: white;
}

.success {
  background-color: #34c759;
  color: white;
}

/* 尺寸样式 */
.small {
  padding: 10rpx 20rpx;
  font-size: 24rpx;
}

.medium {
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

.large {
  padding: 30rpx 60rpx;
  font-size: 32rpx;
}

/* 禁用状态 */
.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>