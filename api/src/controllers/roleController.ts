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
        permissions: true,
      },
    });

    res.json({ success: true, data: roles });
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
        permissions: true,
      },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    res.json({ success: true, data: role });
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
        permissions: true,
      },
    });

    res.json({ success: true, data: updatedRole });
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