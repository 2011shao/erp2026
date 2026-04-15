import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/sales-trend', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = { status: 'completed' };
    if (shopId) where.shopId = shopId;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData: any = {};
    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { sales: 0, orders: 0 };
      }
      monthlyData[month].sales += order.totalAmount.toNumber();
      monthlyData[month].orders++;
    }

    const trendData = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
      month,
      sales: data.sales,
      orders: data.orders,
    }));

    res.json({
      success: true,
      data: trendData,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/inventory-status', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    const products = await prisma.product.findMany({
      where,
      include: { shop: { select: { id: true, name: true } } },
    });

    const lowStock = products.filter((p) => p.stock < 10).length;
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + p.price.toNumber() * p.stock, 0);

    const byCategory: any = {};
    for (const product of products) {
      if (!byCategory[product.category]) {
        byCategory[product.category] = { count: 0, stock: 0, value: 0 };
      }
      byCategory[product.category].count++;
      byCategory[product.category].stock += product.stock;
      byCategory[product.category].value += product.price.toNumber() * product.stock;
    }

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStock,
        totalValue,
        lowStock,
        byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/financial-analysis', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    const [financialRecords, salesOrders] = await Promise.all([
      prisma.financialRecord.findMany({ where }),
      prisma.salesOrder.findMany({
        where: { ...where, status: 'completed' },
      }),
    ]);

    const totalIncome = financialRecords
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const totalExpense = financialRecords
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const totalSales = salesOrders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0);

    const byType: any = {};
    for (const record of financialRecords) {
      if (!byType[record.type]) {
        byType[record.type] = 0;
      }
      byType[record.type] += record.amount.toNumber();
    }

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        totalSales,
        netProfit: totalIncome - totalExpense,
        byType,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/shop-comparison', authenticate, async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        _count: {
          select: { products: true, salesOrders: true },
        },
        products: true,
        salesOrders: { where: { status: 'completed' } },
        financialRecords: true,
      },
    });

    const comparisonData = shops.map((shop) => {
      const totalSales = shop.salesOrders.reduce(
        (sum, order) => sum + order.totalAmount.toNumber(),
        0
      );
      const totalIncome = shop.financialRecords
        .filter((r) => r.type === 'income')
        .reduce((sum, r) => sum + r.amount.toNumber(), 0);
      const totalExpense = shop.financialRecords
        .filter((r) => r.type === 'expense')
        .reduce((sum, r) => sum + r.amount.toNumber(), 0);

      return {
        shopId: shop.id,
        shopName: shop.name,
        productCount: shop._count.products,
        orderCount: shop._count.salesOrders,
        totalSales,
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
      };
    });

    res.json({
      success: true,
      data: comparisonData,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const [
      shops,
      products,
      salesOrders,
      financialRecords,
      users,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.product.count(),
      prisma.salesOrder.findMany({ where: { status: 'completed' } }),
      prisma.financialRecord.findMany(),
      prisma.user.count(),
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
        shops,
        products,
        orders: salesOrders.length,
        users,
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

export default router;
