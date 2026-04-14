import { defineStore } from 'pinia'

interface ShopState {
  currentShop: {
    id: string
    name: string
    address: string
    phone: string
  }
  shops: Array<{
    id: string
    name: string
    address: string
    phone: string
  }>
}

export const useShopStore = defineStore('shop', {
  state: (): ShopState => ({
    currentShop: uni.getStorageSync('currentShop') || {
      id: '',
      name: '',
      address: '',
      phone: ''
    },
    shops: []
  }),
  
  getters: {
    getCurrentShop: (state) => state.currentShop,
    getShops: (state) => state.shops
  },
  
  actions: {
    setCurrentShop(shop: any) {
      this.currentShop = shop
      uni.setStorageSync('currentShop', shop)
    },
    
    setShops(shops: any[]) {
      this.shops = shops
    },
    
    addShop(shop: any) {
      this.shops.push(shop)
    },
    
    updateShop(shop: any) {
      const index = this.shops.findIndex(s => s.id === shop.id)
      if (index !== -1) {
        this.shops[index] = shop
      }
    },
    
    deleteShop(shopId: string) {
      this.shops = this.shops.filter(s => s.id !== shopId)
    }
  }
})