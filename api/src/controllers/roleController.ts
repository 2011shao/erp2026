import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, isSystem } = req.body;

    if (!name) {
      throw new ApiError(400, 'Role name is required');
    }

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ApiError(400, 'Role with this name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        isSystem: isSystem || false,
      },
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // 转换数据格式，将rolePermissions转换为permissions
    const formattedRoles = roles.map(role => ({
      ...role,
      permissions: role.rolePermissions.map(rp => rp.permission),
      rolePermissions: undefined,
    }));

    res.json({ success: true, data: formattedRoles });
  } catch (error) {
    next(error);
  }
};

export const getRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // 转换数据格式，将rolePermissions转换为permissions
    const formattedRole = {
      ...role,
      permissions: role.rolePermissions.map(rp => rp.permission),
      rolePermissions: undefined,
    };

    res.json({ success: true, data: formattedRole });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, isSystem } = req.body;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    if (role.isSystem) {
      throw new ApiError(400, 'Cannot update system roles');
    }

    if (name && name !== role.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        throw new ApiError(400, 'Role with this name already exists');
      }
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        name: name || role.name,
        description: description !== undefined ? description : role.description,
        isSystem: isSystem !== undefined ? isSystem : role.isSystem,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // 转换数据格式，将rolePermissions转换为permissions
    const formattedRole = {
      ...updatedRole,
      permissions: updatedRole.rolePermissions.map(rp => rp.permission),
      rolePermissions: undefined,
    };

    res.json({ success: true, data: formattedRole });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    if (role.isSystem) {
      throw new ApiError(400, 'Cannot delete system roles');
    }

    // 检查是否有用户使用此角色
    const usersWithRole = await prisma.userRole.count({
      where: { roleId: id },
    });

    if (usersWithRole > 0) {
      throw new ApiError(400, 'Cannot delete role that is assigned to users');
    }

    await prisma.role.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // 提取权限列表
    const permissions = role.rolePermissions.map(rp => rp.permission);

    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      throw new ApiError(400, 'Permission IDs must be provided as an array');
    }

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // 检查所有权限是否存在
    const permissions = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ApiError(400, 'Some permissions do not exist');
    }

    // 先删除现有的权限分配
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: id,
      },
    });

    // 重新分配权限
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    // 获取更新后的角色及其权限
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // 转换数据格式，将rolePermissions转换为permissions
    const formattedRole = {
      ...updatedRole!,
      permissions: updatedRole!.rolePermissions.map(rp => rp.permission),
      rolePermissions: undefined,
    };

    res.json({ success: true, data: formattedRole });
  } catch (error) {
    next(error);
  }
};