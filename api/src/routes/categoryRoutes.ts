import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取分类列表（树形结构）
router.get('/', authenticate, async (req, res, next) => {
  // 处理 /categories 路由
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

// 获取分类树形结构（与 / 相同，为了兼容前端）
router.get('/tree', authenticate, async (req, res, next) => {
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

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ApiError(400, 'Cannot delete category with products');
    }

    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ApiError(400, 'Cannot delete category with subcategories');
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

// 导出分类为CSV
router.get('/export', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { name: true }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // 生成 CSV 格式
    const headers = ['分类名称', '编码', '上级分类', '排序', '状态', '创建时间'];
    const rows = categories.map(category => [
      category.name,
      category.code,
      category.parent?.name || '',
      category.sortOrder,
      category.isActive ? '启用' : '禁用',
      category.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=categories-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// 导入分类
router.post('/import', authenticate, async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      throw new ApiError(400, 'Categories array is required');
    }

    const importedCategories = [];
    const errors = [];

    // 先创建所有顶级分类，再创建子分类
    const topLevelCategories = categories.filter(cat => !cat.parentName);
    const subCategories = categories.filter(cat => cat.parentName);

    // 创建顶级分类
    for (const categoryData of topLevelCategories) {
      try {
        const { name, code, sortOrder, isActive } = categoryData;

        if (!name || !code) {
          errors.push({ category: categoryData, error: 'Name and code are required' });
          continue;
        }

        // 检查分类编码是否已存在
        const existingCategory = await prisma.category.findUnique({ where: { code } });
        if (existingCategory) {
          // 更新现有分类
          const updatedCategory = await prisma.category.update({
            where: { code },
            data: {
              name,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true
            }
          });
          importedCategories.push({ ...updatedCategory, status: 'updated' });
        } else {
          // 创建新分类
          const newCategory = await prisma.category.create({
            data: {
              name,
              code,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true
            }
          });
          importedCategories.push({ ...newCategory, status: 'created' });
        }
      } catch (error) {
        errors.push({ category: categoryData, error: (error as Error).message });
      }
    }

    // 创建子分类
    for (const categoryData of subCategories) {
      try {
        const { name, code, parentName, sortOrder, isActive } = categoryData;

        if (!name || !code || !parentName) {
          errors.push({ category: categoryData, error: 'Name, code and parentName are required' });
          continue;
        }

        // 查找父分类
        const parentCategory = await prisma.category.findFirst({ where: { name: parentName } });
        if (!parentCategory) {
          errors.push({ category: categoryData, error: `Parent category ${parentName} not found` });
          continue;
        }

        // 检查分类编码是否已存在
        const existingCategory = await prisma.category.findUnique({ where: { code } });
        if (existingCategory) {
          // 更新现有分类
          const updatedCategory = await prisma.category.update({
            where: { code },
            data: {
              name,
              parentId: parentCategory.id,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true
            }
          });
          importedCategories.push({ ...updatedCategory, status: 'updated' });
        } else {
          // 创建新分类
          const newCategory = await prisma.category.create({
            data: {
              name,
              code,
              parentId: parentCategory.id,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true
            }
          });
          importedCategories.push({ ...newCategory, status: 'created' });
        }
      } catch (error) {
        errors.push({ category: categoryData, error: (error as Error).message });
      }
    }

    res.json({
      success: true,
      data: {
        imported: importedCategories.length,
        failed: errors.length,
        importedCategories,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
