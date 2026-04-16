import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      (process.env.JWT_SECRET || 'your-secret-key-change-in-production') as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      (process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production') as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          shopId: user.shopId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { username, password, role, shopId } = req.body;

    if (!username || !password) {
      throw new ApiError(400, 'Username and password are required');
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
      throw new ApiError(409, 'Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'user',
        shopId,
      },
      select: {
        id: true,
        username: true,
        role: true,
        shopId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          role: true,
          shopId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        shopId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, role, shopId, password } = req.body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (shopId !== undefined) updateData.shopId = shopId;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        shopId: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// 用户角色管理API
router.get('/:id/roles', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user.userRoles.map(ur => ur.role),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/roles', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    if (!roleIds || !Array.isArray(roleIds)) {
      throw new ApiError(400, 'Role IDs must be provided as an array');
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // 检查所有角色是否存在
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
      },
    });

    if (roles.length !== roleIds.length) {
      throw new ApiError(400, 'Some roles do not exist');
    }

    // 先删除现有的角色分配
    await prisma.userRole.deleteMany({
      where: {
        userId: id,
      },
    });

    // 重新分配角色
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId: id,
          roleId,
        })),
      });
    }

    // 获取更新后的用户及其角色
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/roles/:roleId', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id, roleId } = req.params;

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError(404, 'Role not found');
    }

    // 检查角色分配是否存在
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new ApiError(404, 'Role not assigned to this user');
    }

    // 删除角色分配
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: id,
          roleId,
        },
      },
    });

    // 获取更新后的用户及其角色
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
