<template>
  <view class="list-container">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    <view v-else-if="empty" class="empty">
      <text>{{ emptyText }}</text>
    </view>
    <view v-else class="list">
      <view 
        v-for="(item, index) in items" 
        :key="index"
        class="list-item"
        @click="handleItemClick(item, index)"
      >
        <slot name="item" :item="item" :index="index"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface ListItem {
  [key: string]: any
}

defineProps({
  items: {
    type: Array as () => ListItem[],
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  empty: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  }
})

const emit = defineEmits(['itemClick'])

const handleItemClick = (item: ListItem, index: number) => {
  emit('itemClick', item, index)
}
</script>

<style scoped>
.list-container {
  width: 100%;
}

.loading {
  text-align: center;
  padding: 40rpx;
  color: #666;
  font-size: 24rpx;
}

.empty {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
  font-size: 24rpx;
}

.list {
  width: 100%;
}

.list-item {
  width: 100%;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.list-item:active {
  background-color: #f5f5f5;
}
</style>