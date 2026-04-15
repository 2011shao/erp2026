import axios from 'axios';

interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE_URL = '/api';

// 获取权限列表
export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

// 获取单个权限
export const getPermission = async (id: string): Promise<Permission> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/permissions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching permission ${id}:`, error);
    throw error;
  }
};

// 创建权限
export const createPermission = async (permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permission> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_BASE_URL}/permissions`, permissionData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

// 更新权限
export const updatePermission = async (id: string, permissionData: Partial<Permission>): Promise<Permission> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(`${API_BASE_URL}/permissions/${id}`, permissionData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating permission ${id}:`, error);
    throw error;
  }
};

// 删除权限
export const deletePermission = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    await axios.delete(`${API_BASE_URL}/permissions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error(`Error deleting permission ${id}:`, error);
    throw error;
  }
};

// 为角色分配权限
export const assignPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<any> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_BASE_URL}/roles/${roleId}/permissions`, 
      { permissionIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error assigning permissions to role ${roleId}:`, error);
    throw error;
  }
};

// 从角色移除权限
export const removePermissionFromRole = async (roleId: string, permissionId: string): Promise<any> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}/permissions/${permissionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error removing permission ${permissionId} from role ${roleId}:`, error);
    throw error;
  }
};