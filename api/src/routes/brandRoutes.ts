import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取品牌列表
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where: {
          isActive: true
        },
        skip,
        take: limit,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.brand.count({
        where: {
          isActive: true
        }
      })
    ]);

    res.json({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取所有品牌（无分页）
router.get('/all', authenticate, async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({
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
      data: brands
    });
  } catch (error) {
    next(error);
  }
});

// 获取品牌详情
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    next(error);
  }
});

// 创建品牌
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, code, logo, sortOrder, isActive } = req.body;

    if (!name || !code) {
      throw new ApiError(400, 'Name and code are required');
    }

    const existingBrand = await prisma.brand.findUnique({ where: { code } });
    if (existingBrand) {
      throw new ApiError(400, 'Brand code already exists');
    }

    const newBrand = await prisma.brand.create({
      data: {
        name,
        code,
        logo,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json({
      success: true,
      data: newBrand
    });
  } catch (error) {
    next(error);
  }
});

// 更新品牌
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, logo, sortOrder, isActive } = req.body;

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    if (code && code !== brand.code) {
      const existingBrand = await prisma.brand.findUnique({ where: { code } });
      if (existingBrand) {
        throw new ApiError(400, 'Brand code already exists');
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        code,
        logo,
        sortOrder,
        isActive
      }
    });

    res.json({
      success: true,
      data: updatedBrand
    });
  } catch (error) {
    next(error);
  }
});

// 删除品牌
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new ApiError(404, 'Brand not found');
    }

    const productCount = await prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new ApiError(400, 'Cannot delete brand with products');
    }

    await prisma.brand.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
