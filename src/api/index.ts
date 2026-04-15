import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDataCacheStore, generateCacheKey } from '../store/dataCacheStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = localStorage.getItem('token');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        const errorMessage = error.response?.data?.error || error.message || 'Request failed';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  // 生成缓存键
  private generateCacheKey(url: string, params?: any): string {
    const path = url.replace(/^\//, '');
    return generateCacheKey(path, params);
  }

  // 清除相关缓存
  private clearCacheByPattern(pattern: string) {
    const { cache } = useDataCacheStore.getState();
    Object.keys(cache).forEach(key => {
      if (key.startsWith(pattern)) {
        useDataCacheStore.getState().clearCache(key);
      }
    });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // 生成缓存键
    const cacheKey = this.generateCacheKey(url, config?.params);
    
    // 尝试从缓存获取
    const cachedData = useDataCacheStore.getState().getCache(cacheKey);
    if (cachedData) {
      return cachedData as ApiResponse<T>;
    }
    
    // 发起请求
    const response = await this.client.get(url, config);
    
    // 缓存响应数据
    useDataCacheStore.getState().setCache(cacheKey, response.data);
    
    return response.data as ApiResponse<T>;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // 清除相关缓存
    const path = url.replace(/^\//, '');
    this.clearCacheByPattern(path.split('/')[0]);
    
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // 清除相关缓存
    const path = url.replace(/^\//, '');
    this.clearCacheByPattern(path.split('/')[0]);
    
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // 清除相关缓存
    const path = url.replace(/^\//, '');
    this.clearCacheByPattern(path.split('/')[0]);
    
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // 清除相关缓存
    const path = url.replace(/^\//, '');
    this.clearCacheByPattern(path.split('/')[0]);
    
    return this.client.delete(url, config);
  }
}

const api = new ApiClient();

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  shopId?: string | null;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    salesOrders: number;
    users: number;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  costPrice: number;
  stock: number;
  shopId: string;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

export interface InventoryLog {
  id: string;
  productId: string;
  quantity: number;
  type: 'in' | 'out';
  reason: string;
  shopId: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
  };
}

export interface SalesOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
  };
}

export interface SalesOrder {
  id: string;
  shopId: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    name: string;
  };
  items?: SalesOrderItem[];
}

export interface FinancialRecord {
  id: string;
  shopId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

export const authApi = {
  login: async (data: LoginRequest) => api.post<LoginResponse>('/users/login', data),
  register: async (data: Partial<User> & { password: string }) => 
    api.post<User>('/users/register', data),
  getMe: async () => api.get<User>('/users/me'),
  logout: () => api.clearToken(),
};

export const userApi = {
  getAll: (params?: { page?: number; limit?: number }) => 
    api.get<User[]>('/users', { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User> & { password: string }) => 
    api.post<User>('/users', data),
  update: (id: string, data: Partial<User> & { password?: string }) => 
    api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const shopApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get<Shop[]>('/shops', { params }),
  getAllSimple: () => api.get<Pick<Shop, 'id' | 'name'>[]>('/shops/all'),
  getById: (id: string) => api.get<Shop>(`/shops/${id}`),
  getStatistics: (id: string) => api.get(`/shops/${id}/statistics`),
  create: (data: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | '_count'>) => 
    api.post<Shop>('/shops', data),
  update: (id: string, data: Partial<Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | '_count'>>) => 
    api.put<Shop>(`/shops/${id}`, data),
  delete: (id: string) => api.delete(`/shops/${id}`),
};

export const productApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    category?: string; 
    shopId?: string 
  }) => api.get<Product[]>('/products', { params }),
  getCategories: () => api.get<string[]>('/products/categories'),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shop'>) => 
    api.post<Product>('/products', data),
  createBatch: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shop'>[]) => 
    api.post<Product[]>('/products/batch', { products }),
  update: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'shop'>>) => 
    api.put<Product>(`/products/${id}`, data),
  updateBatch: (updates: { id: string; data: Partial<Product> }[]) => 
    api.put<Product[]>('/products/batch', { updates }),
  delete: (id: string) => api.delete(`/products/${id}`),
  deleteBatch: (ids: string[]) => 
    api.delete('/products/batch', { data: { ids } }),
};

export const inventoryApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    shopId?: string; 
    lowStock?: boolean 
  }) => api.get<Product[]>('/inventory', { params }),
  getAlerts: (params?: { shopId?: string }) => 
    api.get<Product[]>('/inventory/alerts', { params }),
  getLogs: (params?: { 
    page?: number; 
    limit?: number; 
    productId?: string; 
    shopId?: string 
  }) => api.get<InventoryLog[]>('/inventory/logs', { params }),
  adjust: (data: { 
    productId: string; 
    quantity: number; 
    type: 'in' | 'out'; 
    reason: string; 
    shopId: string 
  }) => api.post('/inventory/adjust', data),
  stocktake: (data: { 
    items: { productId: string; actualStock: number }[]; 
    shopId: string 
  }) => api.post('/inventory/stocktake', data),
};

export const salesApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    shopId?: string; 
    status?: string 
  }) => api.get<SalesOrder[]>('/sales', { params }),
  getStatistics: (params?: { shopId?: string }) => 
    api.get('/sales/statistics', { params }),
  getById: (id: string) => api.get<SalesOrder>(`/sales/${id}`),
  create: (data: { 
    shopId: string; 
    items: { productId: string; quantity: number; price: number }[]; 
    status?: string 
  }) => api.post<SalesOrder>('/sales', data),
  update: (id: string, data: { status?: string }) => 
    api.put<SalesOrder>(`/sales/${id}`, data),
  updateStatus: (id: string, status: string) => 
    api.patch<SalesOrder>(`/sales/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/sales/${id}`),
};

export const financialApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    shopId?: string; 
    type?: string; 
    category?: string 
  }) => api.get<FinancialRecord[]>('/financial', { params }),
  getSummary: (params?: { shopId?: string }) => 
    api.get('/financial/summary', { params }),
  getReports: (params?: { shopId?: string }) => 
    api.get('/financial/reports', { params }),
  getById: (id: string) => api.get<FinancialRecord>(`/financial/${id}`),
  create: (data: Omit<FinancialRecord, 'id' | 'createdAt' | 'shop'>) => 
    api.post<FinancialRecord>('/financial', data),
  update: (id: string, data: Partial<Omit<FinancialRecord, 'id' | 'createdAt' | 'shop'>>) => 
    api.put<FinancialRecord>(`/financial/${id}`, data),
  delete: (id: string) => api.delete(`/financial/${id}`),
};

export const reportApi = {
  getSalesTrend: (params?: { shopId?: string }) => 
    api.get('/reports/sales-trend', { params }),
  getInventoryStatus: (params?: { shopId?: string }) => 
    api.get('/reports/inventory-status', { params }),
  getFinancialAnalysis: (params?: { shopId?: string }) => 
    api.get('/reports/financial-analysis', { params }),
  getShopComparison: () => api.get('/reports/shop-comparison'),
  getOverview: () => api.get('/reports/overview'),
};

export default api;
