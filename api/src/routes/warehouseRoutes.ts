import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 获取仓库列表
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: true
        }
      }),
      prisma.warehouse.count()
    ]);

    res.json({
      success: true,
      data: warehouses,
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

// 获取仓库详情
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        shop: true
      }
    });

    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
});

// 创建仓库
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, code, address, contactName, contactPhone, shopId, status } = req.body;

    if (!name || !code || !address || !shopId) {
      throw new ApiError(400, 'Name, code, address, and shopId are required');
    }

    const existingWarehouse = await prisma.warehouse.findUnique({ where: { code } });
    if (existingWarehouse) {
      throw new ApiError(400, 'Warehouse code already exists');
    }

    const newWarehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        contactName,
        contactPhone,
        shopId,
        status: status || 'active'
      },
      include: {
        shop: true
      }
    });

    res.json({
      success: true,
      data: newWarehouse
    });
  } catch (error) {
    next(error);
  }
});

// 更新仓库
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, address, contactName, contactPhone, status } = req.body;

    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    if (code && code !== warehouse.code) {
      const existingWarehouse = await prisma.warehouse.findUnique({ where: { code } });
      if (existingWarehouse) {
        throw new ApiError(400, 'Warehouse code already exists');
      }
    }

    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name,
        code,
        address,
        contactName,
        contactPhone,
        status
      },
      include: {
        shop: true
      }
    });

    res.json({
      success: true,
      data: updatedWarehouse
    });
  } catch (error) {
    next(error);
  }
});

// 删除仓库
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new ApiError(404, 'Warehouse not found');
    }

    // 检查仓库是否有商品或串号
    const productCount = await prisma.product.count({ where: { warehouseId: id } });
    const serialNumberCount = await prisma.serialNumber.count({ where: { warehouseId: id } });

    if (productCount > 0 || serialNumberCount > 0) {
      throw new ApiError(400, 'Cannot delete warehouse with products or serial numbers');
    }

    await prisma.warehouse.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 获取仓库的商品
router.get('/:id/products', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { warehouseId: id },
        include: {
          warehouse: true,
          shop: true
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where: { warehouseId: id } })
    ]);

    res.json({
      success: true,
      data: products,
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

// 获取仓库的串号
router.get('/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [serialNumbers, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where: { warehouseId: id },
        include: {
          product: true,
          warehouse: true
        },
        skip,
        take: limit
      }),
      prisma.serialNumber.count({ where: { warehouseId: id } })
    ]);

    res.json({
      success: true,
      data: serialNumbers,
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

export default router;