import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDataCacheStore, generateCacheKey } from '../store/dataCacheStore';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

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

    this.token = localStorage.getItem('accessToken');
    console.log('API client initialized with token:', this.token);
    this.setupInterceptors();
  }

  // 重新从localStorage加载token
  reloadToken() {
    this.token = localStorage.getItem('accessToken');
    console.log('Token reloaded:', this.token);
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        console.log('Request config:', config);
        console.log('Current token:', this.token);
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
          console.log('Added token to request header');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log('Response:', response);
        return response;
      },
      (error) => {
        console.log('Error response:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Request failed';
        
        // 检测token失效错误
        if (errorMessage.includes('invalid session token') || errorMessage.includes('Token expired') || errorMessage.includes('Unauthorized')) {
          // 清除token
          this.clearToken();
          // 跳转到登录页面
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
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
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
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

export interface SerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  status: string;
  shopId: string;
  product?: {
    name: string;
    brand: string;
    model: string;
  };
  shop?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  logs?: any[];
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

export interface CommissionRule {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  minAmount?: number;
  maxAmount?: number;
  productCategory?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
  updatedAt: string;
}

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
  print: (id: string) => api.post(`/sales/${id}/print`),
  return: (id: string, data: { items: { productId: string; quantity: number; price: number; serialNumbers?: string[] }[]; reason: string }) => 
    api.post(`/sales/${id}/return`, data),
  exchange: (id: string, data: { returnItems: { productId: string; quantity: number; price: number; serialNumbers?: string[] }[]; exchangeItems: { productId: string; quantity: number; price: number; serialNumbers?: string[] }[]; reason: string }) => 
    api.post(`/sales/${id}/exchange`, data),
  getCommissionRules: () => api.get<CommissionRule[]>('/sales/commission-rules'),
  createCommissionRule: (data: { name: string; type: 'fixed' | 'percentage'; value: number; minAmount?: number; maxAmount?: number; productCategory?: string; status: 'active' | 'inactive' }) => 
    api.post<CommissionRule>('/sales/commission-rules', data),
  getCommissionRule: (id: string) => api.get<CommissionRule>(`/sales/commission-rules/${id}`),
  updateCommissionRule: (id: string, data: { name?: string; type?: 'fixed' | 'percentage'; value?: number; minAmount?: number; maxAmount?: number; productCategory?: string; status?: 'active' | 'inactive' }) => 
    api.put<CommissionRule>(`/sales/commission-rules/${id}`, data),
  deleteCommissionRule: (id: string) => api.delete(`/sales/commission-rules/${id}`),
  calculateCommission: (id: string, data: { userId?: string }) => 
    api.post(`/sales/${id}/calculate-commission`, data),
  getGrossProfitReport: (params?: { startDate?: string; endDate?: string; shopId?: string; productCategory?: string }) => 
    api.get('/sales/reports/gross-profit', { params }),
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

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  serialNumbers?: SerialNumber[];
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  supplierId: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const serialNumberApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    productId?: string; 
    shopId?: string 
  }) => api.get<SerialNumber[]>('/serial-numbers', { params }),
  getById: (id: string) => api.get<SerialNumber>(`/serial-numbers/${id}`),
  create: (data: { 
    serialNumber: string; 
    productId: string; 
    shopId: string; 
    status?: string 
  }) => api.post<SerialNumber>('/serial-numbers', data),
  update: (id: string, data: { 
    status?: string; 
    productId?: string; 
    shopId?: string 
  }) => api.put<SerialNumber>(`/serial-numbers/${id}`, data),
  updateStatus: (id: string, data: { status: string; reason: string }) => 
    api.patch<SerialNumber>(`/serial-numbers/${id}/status`, data),
  delete: (id: string) => api.delete(`/serial-numbers/${id}`),
  import: (data: { 
    serialNumbers: string[]; 
    productId: string; 
    shopId: string 
  }) => api.post('/serial-numbers/import', data),
  export: (params?: { 
    status?: string; 
    productId?: string; 
    shopId?: string 
  }) => api.get('/serial-numbers/export', { params }),
  getAlerts: (params?: { shopId?: string }) => api.get('/serial-numbers/alerts', { params }),
  clearAlert: (id: string) => api.patch(`/serial-numbers/${id}/clear-alert`),
};

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export const purchaseApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    shopId?: string; 
    status?: string 
  }) => api.get<PurchaseOrder[]>('/purchases', { params }),
  getById: (id: string) => api.get<PurchaseOrder>(`/purchases/${id}`),
  create: (data: { 
    shopId: string; 
    supplierId: string; 
    items: { productId: string; quantity: number; price: number; serialNumbers?: string[] }[]; 
    status?: string 
  }) => api.post<PurchaseOrder>('/purchases', data),
  update: (id: string, data: { status?: string }) => 
    api.put<PurchaseOrder>(`/purchases/${id}`, data),
  delete: (id: string) => api.delete(`/purchases/${id}`),
  bindSerialNumbers: (id: string, data: { itemId: string; serialNumbers: string[] }) => 
    api.post(`/purchases/${id}/serial-numbers`, data),
  unbindSerialNumber: (id: string, serialNumberId: string) => 
    api.delete(`/purchases/${id}/serial-numbers/${serialNumberId}`),
  getSerialNumbers: (id: string) => api.get<SerialNumber[]>(`/purchases/${id}/serial-numbers`),
  getSuppliers: () => api.get<Supplier[]>('/suppliers'),
};

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  contactName: string;
  contactPhone: string;
  status: 'active' | 'inactive';
  shopId: string;
  createdAt: string;
  updatedAt: string;
  shop?: {
    id: string;
    name: string;
  };
}

export const warehouseApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    shopId?: string; 
    status?: string 
  }) => api.get<Warehouse[]>('/warehouses', { params }),
  getById: (id: string) => api.get<Warehouse>(`/warehouses/${id}`),
  create: (data: { 
    name: string; 
    code: string; 
    address: string; 
    contactName: string; 
    contactPhone: string; 
    shopId: string; 
    status?: 'active' | 'inactive' 
  }) => api.post<Warehouse>('/warehouses', data),
  update: (id: string, data: { 
    name?: string; 
    code?: string; 
    address?: string; 
    contactName?: string; 
    contactPhone?: string; 
    status?: 'active' | 'inactive' 
  }) => api.put<Warehouse>(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
  getProducts: (id: string, params?: { 
    page?: number; 
    limit?: number 
  }) => api.get<Product[]>(`/warehouses/${id}/products`, { params }),
  getSerialNumbers: (id: string, params?: { 
    page?: number; 
    limit?: number 
  }) => api.get<SerialNumber[]>(`/warehouses/${id}/serial-numbers`, { params }),
};

export interface TransferOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    model: string;
  };
  serialNumbers?: SerialNumber[];
}

export interface TransferOrder {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  shopId: string;
  operatorId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  reason: string;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  fromWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  toWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  operator?: {
    id: string;
    username: string;
  };
  items: TransferOrderItem[];
  logs?: any[];
}

export const transferApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    fromWarehouseId?: string; 
    toWarehouseId?: string; 
    search?: string 
  }) => api.get<TransferOrder[]>('/transfers', { params }),
  getById: (id: string) => api.get<TransferOrder>(`/transfers/${id}`),
  create: (data: { 
    fromWarehouseId: string; 
    toWarehouseId: string; 
    reason: string; 
    items: { productId: string; quantity: number }[] 
  }) => api.post<TransferOrder>('/transfers', data),
  updateStatus: (id: string, data: { status: string; reason?: string }) => 
    api.put(`/transfers/${id}/status`, data),
  delete: (id: string) => api.delete(`/transfers/${id}`),
  addSerialNumbers: (id: string, data: { itemId: string; serialNumberIds: string[] }) => 
    api.post(`/transfers/${id}/serial-numbers`, data),
  removeSerialNumber: (id: string, serialNumberId: string) => 
    api.delete(`/transfers/${id}/serial-numbers/${serialNumberId}`),
  getSerialNumbers: (id: string) => api.get<SerialNumber[]>(`/transfers/${id}/serial-numbers`),
};

export interface StocktakeItem {
  id: string;
  stocktakeId: string;
  productId: string;
  expectedStock: number;
  actualStock: number;
  variance: number;
  unitPrice: number;
  varianceValue: number;
  notes?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    brand: string;
    model: string;
    price: number;
  };
  serialNumbers?: SerialNumber[];
}

export interface Stocktake {
  id: string;
  shopId: string;
  warehouseId: string;
  operatorId: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  totalItems: number;
  variance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  shop?: {
    id: string;
    name: string;
  };
  operator?: {
    id: string;
    username: string;
  };
  items: StocktakeItem[];
  logs?: any[];
}

export const stocktakeApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    warehouseId?: string; 
    shopId?: string; 
    search?: string 
  }) => api.get<Stocktake[]>('/stocktakes', { params }),
  getById: (id: string) => api.get<Stocktake>(`/stocktakes/${id}`),
  create: (data: { 
    warehouseId: string; 
    notes?: string 
  }) => api.post<Stocktake>('/stocktakes', data),
  updateItem: (id: string, itemId: string, data: { actualStock: number; notes?: string }) => 
    api.put(`/stocktakes/${id}/items/${itemId}`, data),
  addSerialNumbers: (id: string, itemId: string, data: { serialNumberIds: string[] }) => 
    api.post(`/stocktakes/${id}/items/${itemId}/serial-numbers`, data),
  removeSerialNumber: (id: string, itemId: string, serialNumberId: string) => 
    api.delete(`/stocktakes/${id}/items/${itemId}/serial-numbers/${serialNumberId}`),
  complete: (id: string, data: { reason?: string }) => 
    api.put(`/stocktakes/${id}/complete`, data),
  cancel: (id: string, data: { reason?: string }) => 
    api.put(`/stocktakes/${id}/cancel`, data),
  delete: (id: string) => api.delete(`/stocktakes/${id}`),
};

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Permission[];
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  products?: any[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  logo?: string;
  products?: any[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const roleApi = {
  getRoles: () => api.get<Role[]>('/roles'),
  getRole: (id: string) => api.get<Role>(`/roles/${id}`),
  createRole: (data: { name: string; description: string }) => api.post<Role>('/roles', data),
  updateRole: (id: string, data: { name?: string; description?: string }) => api.put<Role>(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  getPermissions: () => api.get<Permission[]>('/permissions'),
  getRolePermissions: (roleId: string) => api.get<string[]>(`/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId: string, permissionIds: string[]) => api.put(`/roles/${roleId}/permissions`, { permissionIds }),
};

export const permissionApi = {
  getPermissions: () => api.get<Permission[]>('/permissions'),
  getPermission: (id: string) => api.get<Permission>(`/permissions/${id}`),
  createPermission: (data: { name: string; code: string; parentId?: string | null }) => api.post<Permission>('/permissions', data),
  updatePermission: (id: string, data: { name?: string; code?: string; parentId?: string | null }) => api.put<Permission>(`/permissions/${id}`, data),
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),
};

export const categoryApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    isActive?: boolean 
  }) => api.get<Category[]>('/categories', { params }),
  getTree: () => api.get<Category[]>('/categories/tree'),
  getById: (id: string) => api.get<Category>(`/categories/${id}`),
  getChildren: (parentId: string) => api.get<Category[]>(`/categories/${parentId}/children`),
  create: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'parent' | 'children' | 'products'>) => 
    api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'parent' | 'children' | 'products'>>) => 
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  export: () => api.get('/categories/export'),
  import: (data: { categories: any[] }) => api.post('/categories/import', data),
};

export const brandApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    isActive?: boolean 
  }) => api.get<Brand[]>('/brands', { params }),
  getById: (id: string) => api.get<Brand>(`/brands/${id}`),
  create: (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'products'>) => 
    api.post<Brand>('/brands', data),
  update: (id: string, data: Partial<Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'products'>>) => 
    api.put<Brand>(`/brands/${id}`, data),
  delete: (id: string) => api.delete(`/brands/${id}`),
  export: () => api.get('/brands/export'),
  import: (data: { brands: any[] }) => api.post('/brands/import', data),
};

export default api;
