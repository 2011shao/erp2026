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
        permissions: true,
      },
    });

    res.json({ success: true, data: updatedRole });
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
        permissions: true,
      },
    });

    res.json({ success: true, data: updatedRole });
  } catch (error) {
    next(error);
  }
};