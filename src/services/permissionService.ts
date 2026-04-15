import api from '../api';

interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// 获取权限列表
export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await api.get('/permissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

// 获取单个权限
export const getPermission = async (id: string): Promise<Permission> => {
  try {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission ${id}:`, error);
    throw error;
  }
};

// 创建权限
export const createPermission = async (permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permission> => {
  try {
    const response = await api.post('/permissions', permissionData);
    return response.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

// 更新权限
export const updatePermission = async (id: string, permissionData: Partial<Permission>): Promise<Permission> => {
  try {
    const response = await api.put(`/permissions/${id}`, permissionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating permission ${id}:`, error);
    throw error;
  }
};

// 删除权限
export const deletePermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/permissions/${id}`);
  } catch (error) {
    console.error(`Error deleting permission ${id}:`, error);
    throw error;
  }
};

// 为角色分配权限
export const assignPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<any> => {
  try {
    const response = await api.post(`/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
  } catch (error) {
    console.error(`Error assigning permissions to role ${roleId}:`, error);
    throw error;
  }
};

// 从角色移除权限
export const removePermissionFromRole = async (roleId: string, permissionId: string): Promise<any> => {
  try {
    const response = await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing permission ${permissionId} from role ${roleId}:`, error);
    throw error;
  }
};