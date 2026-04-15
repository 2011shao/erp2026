import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import prisma from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    shopId?: string | null;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, shopId: true },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Not authorized to access this resource');
    }

    next();
  };
};

export const requirePermission = (permission: string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // 获取用户的所有角色
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // 收集用户的所有权限
    const userPermissions = new Set<string>();
    user.userRoles.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => userPermissions.add(rp.permission.code));
    });

    // 检查用户是否有所需权限
    let hasPermission = false;
    if (Array.isArray(permission)) {
      // 检查是否拥有任意一个权限
      hasPermission = permission.some(p => userPermissions.has(p));
    } else {
      // 检查是否拥有指定权限
      hasPermission = userPermissions.has(permission);
    }

    if (!hasPermission) {
      const permissionStr = Array.isArray(permission) ? permission.join(' or ') : permission;
      throw new ApiError(403, `Permission ${permissionStr} is required`);
    }

    next();
  };
};

// 批量权限检查中间件
export const requireAnyPermission = (permissions: string[]) => {
  return requirePermission(permissions);
};

// 数据权限检查中间件
export const requireDataPermission = (resourceType: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // 构建数据权限代码
    const permissionCode = `${resourceType}.${action}`;
    
    // 使用通用权限检查
    const permissionMiddleware = requirePermission(permissionCode);
    await permissionMiddleware(req, res, next);
  };
};
