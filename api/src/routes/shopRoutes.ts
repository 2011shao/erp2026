import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { products: true, salesOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shop.count({ where }),
    ]);

    // 获取所有相关的用户信息来补充 manager 字段
    const managerIds = shops.map(shop => shop.managerId);
    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, username: true }
    });
    
    const managerMap = new Map(managers.map(m => [m.id, m.username]));
    
    // 添加 manager 字段到每个 shop
    const shopsWithManager = shops.map(shop => ({
      ...shop,
      manager: managerMap.get(shop.managerId) || '未知'
    }));

    res.json({
      success: true,
      data: shopsWithManager,
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

router.get('/all', authenticate, async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: shops,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, salesOrders: true, users: true },
        },
      },
    });

    if (!shop) {
      throw new ApiError(404, 'Shop not found');
    }

    res.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/statistics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [products, salesOrders, financialRecords] = await Promise.all([
      prisma.product.count({ where: { shopId: id } }),
      prisma.salesOrder.findMany({
        where: { shopId: id },
        include: { items: true },
      }),
      prisma.financialRecord.findMany({ where: { shopId: id } }),
    ]);

    const totalSales = salesOrders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);
    const totalIncome = financialRecords
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const totalExpense = financialRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    res.json({
      success: true,
      data: {
        products,
        orders: salesOrders.length,
        totalSales,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { name, address, phone, managerId } = req.body;

    if (!name || !address || !phone || !managerId) {
      throw new ApiError(400, 'Name, address, phone, and managerId are required');
    }

    const shop = await prisma.shop.create({
      data: {
        name,
        address,
        phone,
        managerId,
      },
    });

    res.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, managerId } = req.body;

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        managerId,
      },
    });

    res.json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.shop.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Shop deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
