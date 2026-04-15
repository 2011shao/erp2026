import api from '../api';

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
}

// 获取角色列表
export const getRoles = async (): Promise<Role[]> => {
  try {
    const response = await api.get('/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// 获取单个角色
export const getRole = async (id: string): Promise<Role> => {
  try {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};

// 创建角色
export const createRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
  try {
    const response = await api.post('/roles', roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

// 更新角色
export const updateRole = async (id: string, roleData: Partial<Role>): Promise<Role> => {
  try {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

// 删除角色
export const deleteRole = async (id: string): Promise<void> => {
  try {
    await api.delete(`/roles/${id}`);
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};

// 获取角色权限
export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  try {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleId}:`, error);
    throw error;
  }
};

// 更新角色权限
export const updateRolePermissions = async (roleId: string, permissionIds: string[]): Promise<Role> => {
  try {
    const response = await api.put(`/roles/${roleId}/permissions`, { permissionIds });
    return response.data;
  } catch (error) {
    console.error(`Error updating permissions for role ${roleId}:`, error);
    throw error;
  }
};