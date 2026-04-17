import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取分类列表（树形结构）
router.get('/', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      include: {
        children: {
          where: {
            isActive: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const rootCategories = categories.filter(cat => !cat.parentId);

    res.json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    next(error);
  }
});

// 获取所有分类（扁平结构）
router.get('/all', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// 获取分类详情
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: {
            isActive: true
          }
        },
        parent: true
      }
    });

    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// 创建分类
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, code, parentId, sortOrder, isActive } = req.body;

    if (!name || !code) {
      throw new ApiError(400, 'Name and code are required');
    }

    const existingCategory = await prisma.category.findUnique({ where: { code } });
    if (existingCategory) {
      throw new ApiError(400, 'Category code already exists');
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parentCategory) {
        throw new ApiError(404, 'Parent category not found');
      }
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        code,
        parentId,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        children: true,
        parent: true
      }
    });

    res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    next(error);
  }
});

// 更新分类
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, parentId, sortOrder, isActive } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    if (code && code !== category.code) {
      const existingCategory = await prisma.category.findUnique({ where: { code } });
      if (existingCategory) {
        throw new ApiError(400, 'Category code already exists');
      }
    }

    if (parentId && parentId !== category.parentId) {
      const parentCategory = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parentCategory) {
        throw new ApiError(404, 'Parent category not found');
      }
    }

    if (parentId === id) {
      throw new ApiError(400, 'Cannot set category as its own parent');
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        code,
        parentId,
        sortOrder,
        isActive
      },
      include: {
        children: true,
        parent: true
      }
    });

    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
});

// 删除分类
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ApiError(400, 'Cannot delete category with child categories');
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ApiError(400, 'Cannot delete category with products');
    }

    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
