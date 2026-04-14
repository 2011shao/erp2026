<template>
  <view class="input-container">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input
      :class="['custom-input', { error: error }]"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
    <text v-if="error" class="error-message">{{ errorMessage }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (e: any) => {
  emit('update:modelValue', e.detail.value)
}
</script>

<style scoped>
.input-container {
  margin-bottom: 20rpx;
}

.input-label {
  display: block;
  font-size: 24rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.custom-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 5rpx;
  font-size: 28rpx;
  transition: all 0.3s;
}

.custom-input:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 2rpx rgba(0, 122, 255, 0.1);
}

.custom-input:disabled {
  background-color: #f5f5f5;
  color: #999;
}

.custom-input.error {
  border-color: #ff3b30;
}

.error-message {
  font-size: 20rpx;
  color: #ff3b30;
  margin-top: 10rpx;
}
</style>