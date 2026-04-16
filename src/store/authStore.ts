import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api';
import api from '../api';

// 初始化时重新加载token
api.reloadToken();

interface User {
  id: string;
  username: string;
  role: string;
  shopId?: string | null;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
}

interface AuthState {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setPermissions: (permissions: string[]) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Login request:', { username, password });
          const response = await authApi.login({ username, password });
          console.log('Login response:', response);
          
          const { accessToken, user } = response.data.data;

          // 存储token到localStorage和api客户端
          api.setToken(accessToken);

          // 获取用户权限
          try {
            const permissionsResponse = await fetch('/api/permissions', {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });

            if (permissionsResponse.ok) {
              const permissionsData = await permissionsResponse.json();
              const userPermissions = permissionsData.data
                .filter((perm: Permission) => perm.type === 'menu')
                .map((perm: Permission) => perm.code);
              set({ permissions: userPermissions });
            } else {
              console.error('Failed to get permissions:', permissionsResponse.status);
              // 即使权限获取失败，也允许登录，使用默认权限
              set({ permissions: ['dashboard.view', 'shop.manage', 'product.manage', 'inventory.manage', 'sales.manage', 'financial.manage', 'report.manage', 'user.manage', 'system.manage', 'role.manage', 'permission.manage'] });
            }
          } catch (error) {
            console.error('Error fetching permissions:', error);
            // 即使权限获取失败，也允许登录，使用默认权限
            set({ permissions: ['dashboard.view', 'shop.manage', 'product.manage', 'inventory.manage', 'sales.manage', 'financial.manage', 'report.manage', 'user.manage', 'system.manage', 'role.manage', 'permission.manage'] });
          }

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          console.error('Login error:', error);
          set({ error: error.message || 'Invalid credentials', isLoading: false });
          throw error; // 抛出异常，让handleLogin函数捕获
        }
      },

      logout: () => {
        api.clearToken();
        set({ user: null, isAuthenticated: false, permissions: [] });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setPermissions: (permissions: string[]) => {
        set({ permissions });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state?.isAuthenticated) {
            // 状态恢复时重新加载token
            api.reloadToken();
            console.log('Token reloaded after state hydration');
          }
        };
      },
    }
  )
);

// 权限检查钩子
export const usePermission = (permission: string) => {
  const permissions = useAuthStore((state) => state.permissions);
  return permissions.includes(permission);
};

// 菜单权限过滤函数
export const filterMenuByPermission = (menu: any[]) => {
  const { permissions, isAuthenticated } = useAuthStore.getState();
  
  // 如果用户未登录，返回空菜单
  if (!isAuthenticated) {
    return [];
  }
  
  // 如果用户已登录但没有权限，返回空菜单
  if (permissions.length === 0) {
    return [];
  }
  
  return menu.filter((item) => {
    if (item.permission) {
      return permissions.includes(item.permission);
    }
    if (item.children) {
      const filteredChildren = filterMenuByPermission(item.children);
      item.children = filteredChildren;
      return filteredChildren.length > 0;
    }
    return true;
  });
};