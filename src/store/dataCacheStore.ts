import { create } from 'zustand';

interface CacheItem {
  data: any;
  timestamp: number;
  expires: number;
}

interface DataCacheState {
  cache: Record<string, CacheItem>;
  setCache: (key: string, data: any, expires?: number) => void;
  getCache: (key: string) => any | null;
  clearCache: (key?: string) => void;
  clearAllCache: () => void;
}

const DEFAULT_EXPIRY = 5 * 60 * 1000; // 默认缓存5分钟

export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  cache: {},

  setCache: (key: string, data: any, expires = DEFAULT_EXPIRY) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          timestamp: Date.now(),
          expires,
        },
      },
    }));
  },

  getCache: (key: string) => {
    const { cache } = get();
    const item = cache[key];
    
    if (!item) {
      return null;
    }
    
    const now = Date.now();
    if (now - item.timestamp > item.expires) {
      // 缓存已过期，清除并返回null
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    
    return item.data;
  },

  clearCache: (key?: string) => {
    if (key) {
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
    } else {
      set({ cache: {} });
    }
  },

  clearAllCache: () => {
    set({ cache: {} });
  },
}));

// 缓存键生成函数
export const generateCacheKey = (prefix: string, params: Record<string, any> = {}) => {
  const paramsString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `${prefix}${paramsString ? `?${paramsString}` : ''}`;
};
