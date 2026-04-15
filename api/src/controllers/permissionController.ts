import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';

export const getPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: {
        code: 'asc',
      },
    });

    res.json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const getPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new ApiError(404, 'Permission not found');
    }

    res.json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, description, type } = req.body;

    if (!code || !name || !type) {
      throw new ApiError(400, 'Code, name, and type are required');
    }

    // 检查权限编码是否已存在
    const existingPermission = await prisma.permission.findUnique({
      where: { code },
    });

    if (existingPermission) {
      throw new ApiError(400, 'Permission with this code already exists');
    }

    const permission = await prisma.permission.create({
      data: {
        code,
        name,
        description,
        type,
      },
    });

    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    next(error);
  }
};

export const updatePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { code, name, description, type } = req.body;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new ApiError(404, 'Permission not found');
    }

    if (code && code !== permission.code) {
      // 检查新的权限编码是否已存在
      const existingPermission = await prisma.permission.findUnique({
        where: { code },
      });

      if (existingPermission) {
        throw new ApiError(400, 'Permission with this code already exists');
      }
    }

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        code: code || permission.code,
        name: name || permission.name,
        description: description !== undefined ? description : permission.description,
        type: type || permission.type,
      },
    });

    res.json({ success: true, data: updatedPermission });
  } catch (error) {
    next(error);
  }
};

export const deletePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new ApiError(404, 'Permission not found');
    }

    // 检查是否有角色使用此权限
    const rolesWithPermission = await prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (rolesWithPermission > 0) {
      throw new ApiError(400, 'Cannot delete permission that is assigned to roles');
    }

    await prisma.permission.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const assignPermissions = async (req: Request, res: Response, next: NextFunction) => {
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

export const removePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, permissionId } = req.params;

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // 检查权限是否存在
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new ApiError(404, 'Permission not found');
    }

    // 检查权限分配是否存在
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId,
        },
      },
    });

    if (!rolePermission) {
      throw new ApiError(404, 'Permission not assigned to this role');
    }

    // 删除权限分配
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: id,
          permissionId,
        },
      },
    });

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