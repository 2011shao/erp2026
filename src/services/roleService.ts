import axios from 'axios';

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

const API_BASE_URL = '/api';

// 获取角色列表
export const getRoles = async (): Promise<Role[]> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// 获取单个角色
export const getRole = async (id: string): Promise<Role> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/roles/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};

// 创建角色
export const createRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.post(`${API_BASE_URL}/roles`, roleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

// 更新角色
export const updateRole = async (id: string, roleData: Partial<Role>): Promise<Role> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(`${API_BASE_URL}/roles/${id}`, roleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

// 删除角色
export const deleteRole = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    await axios.delete(`${API_BASE_URL}/roles/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};

// 获取角色权限
export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.get(`${API_BASE_URL}/roles/${roleId}/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleId}:`, error);
    throw error;
  }
};

// 更新角色权限
export const updateRolePermissions = async (roleId: string, permissionIds: string[]): Promise<Role> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await axios.put(`${API_BASE_URL}/roles/${roleId}/permissions`, 
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
    console.error(`Error updating permissions for role ${roleId}:`, error);
    throw error;
  }
};