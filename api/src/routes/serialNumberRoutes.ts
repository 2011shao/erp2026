import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// 获取串号列表
router.get('/serial-numbers', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, productId, shopId } = req.query;

    const where: any = {};
    if (search) {
      where.serialNumber = { contains: search as string };
    }
    if (status) {
      where.status = status as string;
    }
    if (productId) {
      where.productId = productId as string;
    }
    if (shopId) {
      where.shopId = shopId as string;
    }

    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        product: true,
        shop: true,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.serialNumber.count({ where });

    res.json({
      success: true,
      data: serialNumbers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 获取串号详情
router.get('/serial-numbers/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id },
      include: {
        product: true,
        shop: true,
        logs: {
          include: { operator: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!serialNumber) {
      throw new ApiError(404, '串号不存在');
    }

    res.json({
      success: true,
      data: serialNumber,
    });
  } catch (error) {
    next(error);
  }
});

// 创建串号
router.post('/serial-numbers', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumber, productId, shopId } = req.body;

    if (!serialNumber || !productId || !shopId) {
      throw new ApiError(400, '串号、商品ID和店铺ID不能为空');
    }

    // 检查串号是否已存在
    const existingSerialNumber = await prisma.serialNumber.findUnique({
      where: { serialNumber },
    });

    if (existingSerialNumber) {
      throw new ApiError(400, '串号已存在');
    }

    const newSerialNumber = await prisma.serialNumber.create({
      data: {
        serialNumber,
        productId,
        shopId,
        status: 'in_stock',
      },
      include: {
        product: true,
        shop: true,
      },
    });

    // 创建操作日志
    await prisma.serialNumberLog.create({
      data: {
        serialNumberId: newSerialNumber.id,
        oldStatus: 'none',
        newStatus: 'in_stock',
        reason: '新增串号',
        operatorId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      data: newSerialNumber,
    });
  } catch (error) {
    next(error);
  }
});

// 批量导入串号
router.post('/serial-numbers/import', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { serialNumbers, productId, shopId } = req.body;

    if (!Array.isArray(serialNumbers) || !productId || !shopId) {
      throw new ApiError(400, '请提供串号数组、商品ID和店铺ID');
    }

    const importedSerialNumbers = [];
    const errors = [];

    for (const serialNumber of serialNumbers) {
      try {
        // 检查串号是否已存在
        const existingSerialNumber = await prisma.serialNumber.findUnique({
          where: { serialNumber },
        });

        if (existingSerialNumber) {
          errors.push({ serialNumber, error: '串号已存在' });
          continue;
        }

        const newSerialNumber = await prisma.serialNumber.create({
          data: {
            serialNumber,
            productId,
            shopId,
            status: 'in_stock',
          },
        });

        // 创建操作日志
        await prisma.serialNumberLog.create({
          data: {
            serialNumberId: newSerialNumber.id,
            oldStatus: 'none',
            newStatus: 'in_stock',
            reason: '批量导入',
            operatorId: req.user.id,
          },
        });

        importedSerialNumbers.push(newSerialNumber);
      } catch (error) {
        errors.push({ serialNumber, error: '导入失败' });
      }
    }

    res.json({
      success: true,
      data: {
        imported: importedSerialNumbers.length,
        failed: errors.length,
        importedSerialNumbers,
        errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 更新串号状态
router.patch('/serial-numbers/:id/status', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      throw new ApiError(400, '状态和原因不能为空');
    }

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id },
    });

    if (!serialNumber) {
      throw new ApiError(404, '串号不存在');
    }

    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id },
      data: { status },
      include: {
        product: true,
        shop: true,
      },
    });

    // 创建操作日志
    await prisma.serialNumberLog.create({
      data: {
        serialNumberId: id,
        oldStatus: serialNumber.status,
        newStatus: status,
        reason,
        operatorId: req.user.id,
      },
    });

    res.json({
      success: true,
      data: updatedSerialNumber,
    });
  } catch (error) {
    next(error);
  }
});

// 删除串号
router.delete('/serial-numbers/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id },
    });

    if (!serialNumber) {
      throw new ApiError(404, '串号不存在');
    }

    await prisma.serialNumber.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '串号删除成功',
    });
  } catch (error) {
    next(error);
  }
});

// 导出串号
router.get('/serial-numbers/export', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, productId, shopId } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (productId) {
      where.productId = productId as string;
    }
    if (shopId) {
      where.shopId = shopId as string;
    }

    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        product: true,
        shop: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 生成 CSV 格式
    const headers = ['串号', '商品名称', '品牌', '型号', '状态', '店铺', '创建时间'];
    const rows = serialNumbers.map(sn => [
      sn.serialNumber,
      sn.product.name,
      sn.product.brand,
      sn.product.model,
      sn.status,
      sn.shop.name,
      sn.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=serial-numbers-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// 获取串号库存预警
router.get('/serial-numbers/alerts', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { shopId } = req.query;

    const where: any = {
      status: 'in_stock'
    };
    if (shopId) {
      where.shopId = shopId as string;
    }

    // 获取所有库存中的串号
    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        product: true,
        shop: true,
      },
    });

    // 计算每个商品的库存数量
    const productStockMap = new Map<string, number>();
    serialNumbers.forEach(sn => {
      const key = sn.productId;
      productStockMap.set(key, (productStockMap.get(key) || 0) + 1);
    });

    // 生成预警信息
    const alerts = [];
    for (const [productId, stock] of productStockMap.entries()) {
      const product = serialNumbers.find(sn => sn.productId === productId)?.product;
      if (product) {
        let alertLevel: string | null = null;
        let alertMessage: string | null = null;

        // 根据库存数量设置预警级别
        if (stock <= 5) {
          alertLevel = 'high';
          alertMessage = `商品 ${product.name} 库存不足，当前库存: ${stock}`;
        } else if (stock <= 10) {
          alertLevel = 'medium';
          alertMessage = `商品 ${product.name} 库存偏低，当前库存: ${stock}`;
        } else if (stock <= 20) {
          alertLevel = 'low';
          alertMessage = `商品 ${product.name} 库存正常，当前库存: ${stock}`;
        }

        if (alertLevel) {
          alerts.push({
            productId,
            productName: product.name,
            brand: product.brand,
            model: product.model,
            stock,
            alertLevel,
            alertMessage,
            shopId: serialNumbers.find(sn => sn.productId === productId)?.shopId,
            shopName: serialNumbers.find(sn => sn.productId === productId)?.shop.name,
          });

          // 更新串号的预警信息
          await prisma.serialNumber.updateMany({
            where: { productId, status: 'in_stock' },
            data: {
              alertLevel,
              alertMessage,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

// 清除串号预警
router.patch('/serial-numbers/:id/clear-alert', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id },
    });

    if (!serialNumber) {
      throw new ApiError(404, '串号不存在');
    }

    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id },
      data: {
        alertLevel: null,
        alertMessage: null,
      },
      include: {
        product: true,
        shop: true,
      },
    });

    res.json({
      success: true,
      data: updatedSerialNumber,
    });
  } catch (error) {
    next(error);
  }
});

export default router;