import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesOrder.count()
    ]);

    res.json({
      success: true,
      data: orders,
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

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { shopId, items, status } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'ShopId and items array are required');
    }

    let totalAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for product ${product.name}`);
      }
      totalAmount += item.price * item.quantity;
    }

    const newOrder = await prisma.salesOrder.create({
      data: {
        shopId,
        totalAmount,
        status: status || 'pending'
      }
    });

    for (const item of items) {
      const orderItem = await prisma.salesOrderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      });

      // 处理串号绑定
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          const serialNumber = await prisma.serialNumber.findUnique({
            where: { id: serialNumberId }
          });
          
          if (!serialNumber) {
            throw new ApiError(404, `Serial number ${serialNumberId} not found`);
          }
          
          if (serialNumber.status !== 'in_stock') {
            throw new ApiError(400, `Serial number ${serialNumber.serialNumber} is not in stock`);
          }
          
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'sold',
              salesOrderId: newOrder.id,
              salesOrderItemId: orderItem.id
            }
          });
          
          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: 'in_stock',
              newStatus: 'sold',
              reason: 'Sale',
              operatorId: req.user.id
            }
          });
        }
      }

      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });

      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'out',
          reason: 'Sale',
          shopId
        }
      });
    }

    res.json({
      success: true,
      data: newOrder
    });
  } catch (error) {
    next(error);
  }
});

// 绑定串号到销售订单
router.post('/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemId, serialNumbers } = req.body;

    if (!itemId || !serialNumbers || !Array.isArray(serialNumbers)) {
      throw new ApiError(400, 'ItemId and serialNumbers array are required');
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const orderItem = await prisma.salesOrderItem.findUnique({
      where: { id: itemId }
    });

    if (!orderItem || orderItem.orderId !== id) {
      throw new ApiError(404, 'Order item not found');
    }

    const boundSerialNumbers = [];

    for (const serialNumberId of serialNumbers) {
      const serialNumber = await prisma.serialNumber.findUnique({
        where: { id: serialNumberId }
      });
      
      if (!serialNumber) {
        throw new ApiError(404, `Serial number ${serialNumberId} not found`);
      }
      
      if (serialNumber.status !== 'in_stock') {
        throw new ApiError(400, `Serial number ${serialNumber.serialNumber} is not in stock`);
      }
      
      const updatedSerialNumber = await prisma.serialNumber.update({
        where: { id: serialNumberId },
        data: {
          status: 'sold',
          salesOrderId: id,
          salesOrderItemId: itemId
        }
      });
      
      await prisma.serialNumberLog.create({
        data: {
          serialNumberId: serialNumberId,
          oldStatus: 'in_stock',
          newStatus: 'sold',
          reason: 'Sale',
          operatorId: req.user.id
        }
      });

      boundSerialNumbers.push(updatedSerialNumber);
    }

    res.json({
      success: true,
      data: boundSerialNumbers
    });
  } catch (error) {
    next(error);
  }
});

// 解除串号与销售订单的绑定
router.delete('/:id/serial-numbers/:serialNumberId', authenticate, async (req, res, next) => {
  try {
    const { id, serialNumberId } = req.params;

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { id: serialNumberId }
    });

    if (!serialNumber) {
      throw new ApiError(404, 'Serial number not found');
    }

    if (serialNumber.salesOrderId !== id) {
      throw new ApiError(400, 'Serial number is not bound to this order');
    }

    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: {
        status: 'in_stock',
        salesOrderId: null,
        salesOrderItemId: null
      }
    });

    await prisma.serialNumberLog.create({
      data: {
        serialNumberId: serialNumberId,
        oldStatus: 'sold',
        newStatus: 'in_stock',
        reason: 'Cancel sale',
        operatorId: req.user.id
      }
    });

    res.json({
      success: true,
      data: updatedSerialNumber
    });
  } catch (error) {
    next(error);
  }
});

// 获取销售订单的串号
router.get('/:id/serial-numbers', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const serialNumbers = await prisma.serialNumber.findMany({
      where: { salesOrderId: id },
      include: {
        product: true,
        salesOrderItem: true
      }
    });

    res.json({
      success: true,
      data: serialNumbers
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.salesOrder.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.salesOrder.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 打印销售订单
router.post('/:id/print', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // 生成打印数据
    const printData = {
      orderId: order.id,
      shopId: order.shopId,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      items: order.items,
      printTime: new Date().toISOString()
    };

    // 这里可以添加实际的打印逻辑，例如调用打印服务
    // 目前只是返回打印数据

    res.json({
      success: true,
      data: printData,
      message: 'Print job created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 退货
router.post('/:id/return', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, reason } = req.body;

    if (!items || !Array.isArray(items)) {
      throw new ApiError(400, 'Items array is required');
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status !== 'completed') {
      throw new ApiError(400, 'Only completed orders can be returned');
    }

    // 处理退货逻辑
    for (const item of items) {
      // 1. 更新商品库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });

      // 2. 更新串号状态
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'returned',
              salesOrderId: null,
              salesOrderItemId: null
            }
          });

          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: 'sold',
              newStatus: 'returned',
              reason: `Return: ${reason}`,
              operatorId: req.user.id
            }
          });
        }
      }

      // 3. 创建库存日志
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'in',
          reason: `Return: ${reason}`,
          shopId: order.shopId
        }
      });
    }

    // 4. 创建财务记录（退款）
    const totalRefund = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await prisma.financialRecord.create({
      data: {
        shopId: order.shopId,
        amount: totalRefund,
        type: 'expense',
        category: 'Return',
        description: `Return for order ${id}: ${reason}`
      }
    });

    res.json({
      success: true,
      message: 'Return processed successfully',
      data: {
        orderId: id,
        refundAmount: totalRefund,
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

// 换货
router.post('/:id/exchange', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { returnItems, exchangeItems, reason } = req.body;

    if (!returnItems || !Array.isArray(returnItems) || !exchangeItems || !Array.isArray(exchangeItems)) {
      throw new ApiError(400, 'Return items and exchange items arrays are required');
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status !== 'completed') {
      throw new ApiError(400, 'Only completed orders can be exchanged');
    }

    // 处理退货部分
    for (const item of returnItems) {
      // 1. 更新商品库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });

      // 2. 更新串号状态
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'returned',
              salesOrderId: null,
              salesOrderItemId: null
            }
          });

          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: 'sold',
              newStatus: 'returned',
              reason: `Exchange: ${reason}`,
              operatorId: req.user.id
            }
          });
        }
      }

      // 3. 创建库存日志
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'in',
          reason: `Exchange return: ${reason}`,
          shopId: order.shopId
        }
      });
    }

    // 处理换货部分
    for (const item of exchangeItems) {
      // 1. 更新商品库存
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });

      // 2. 更新串号状态
      if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
        for (const serialNumberId of item.serialNumbers) {
          await prisma.serialNumber.update({
            where: { id: serialNumberId },
            data: {
              status: 'sold',
              salesOrderId: id
            }
          });

          await prisma.serialNumberLog.create({
            data: {
              serialNumberId: serialNumberId,
              oldStatus: 'in_stock',
              newStatus: 'sold',
              reason: `Exchange: ${reason}`,
              operatorId: req.user.id
            }
          });
        }
      }

      // 3. 创建库存日志
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'out',
          reason: `Exchange: ${reason}`,
          shopId: order.shopId
        }
      });
    }

    res.json({
      success: true,
      message: 'Exchange processed successfully',
      data: {
        orderId: id,
        returnItems,
        exchangeItems
      }
    });
  } catch (error) {
    next(error);
  }
});

// 销售提成规则管理
router.get('/commission-rules', authenticate, async (req, res, next) => {
  try {
    const rules = await prisma.commissionRule.findMany();
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
});

router.post('/commission-rules', authenticate, async (req, res, next) => {
  try {
    const { name, type, value, minAmount, maxAmount, productCategory, status } = req.body;

    const newRule = await prisma.commissionRule.create({
      data: {
        name,
        type,
        value,
        minAmount,
        maxAmount,
        productCategory,
        status
      }
    });

    res.json({
      success: true,
      data: newRule,
      message: 'Commission rule created successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/commission-rules/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const rule = await prisma.commissionRule.findUnique({ where: { id } });

    if (!rule) {
      throw new ApiError(404, 'Commission rule not found');
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    next(error);
  }
});

router.put('/commission-rules/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, value, minAmount, maxAmount, productCategory, status } = req.body;

    const updatedRule = await prisma.commissionRule.update({
      where: { id },
      data: {
        name,
        type,
        value,
        minAmount,
        maxAmount,
        productCategory,
        status
      }
    });

    res.json({
      success: true,
      data: updatedRule,
      message: 'Commission rule updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/commission-rules/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.commissionRule.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Commission rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 计算销售提成
router.post('/:id/calculate-commission', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // 获取有效的提成规则
    const rules = await prisma.commissionRule.findMany({ where: { status: 'active' } });

    // 计算提成
    let totalCommission = 0;
    for (const item of order.items) {
      // 查找适用的提成规则
      const applicableRule = rules.find(rule => {
        // 检查商品类别
        if (rule.productCategory && rule.productCategory !== item.product?.category?.name) {
          return false;
        }
        // 检查金额范围
        const itemAmount = item.quantity * item.price;
        if (rule.minAmount && itemAmount < rule.minAmount) {
          return false;
        }
        if (rule.maxAmount && itemAmount > rule.maxAmount) {
          return false;
        }
        return true;
      });

      if (applicableRule) {
        if (applicableRule.type === 'fixed') {
          totalCommission += applicableRule.value * item.quantity;
        } else if (applicableRule.type === 'percentage') {
          totalCommission += (item.quantity * item.price) * (applicableRule.value / 100);
        }
      }
    }

    // 创建提成记录
    const commissionRecord = await prisma.commissionRecord.create({
      data: {
        orderId: id,
        userId: userId || req.user.id,
        amount: totalCommission,
        status: 'pending'
      }
    });

    res.json({
      success: true,
      data: {
        orderId: id,
        commissionAmount: totalCommission,
        commissionRecord
      },
      message: 'Commission calculated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// 毛利分析报表
router.get('/reports/gross-profit', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, shopId, productCategory } = req.query;

    const whereClause: any = {};
    if (shopId) {
      whereClause.shopId = shopId;
    }
    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate as string)
      };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate as string)
      };
    }

    // 获取销售订单
    const orders = await prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 计算毛利
    let totalRevenue = 0;
    let totalCost = 0;
    const categoryData: any = {};

    for (const order of orders) {
      for (const item of order.items) {
        const revenue = item.quantity * item.price;
        const cost = item.quantity * (item.product?.costPrice || 0);
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;

        // 按类别统计
        const category = item.product?.category?.name || '其他';
        if (!categoryData[category]) {
          categoryData[category] = {
            revenue: 0,
            cost: 0,
            profit: 0,
            count: 0
          };
        }
        categoryData[category].revenue += revenue;
        categoryData[category].cost += cost;
        categoryData[category].profit += profit;
        categoryData[category].count += item.quantity;
      }
    }

    const totalProfit = totalRevenue - totalCost;
    const grossProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCost,
        totalProfit,
        grossProfitMargin,
        categoryData: Object.entries(categoryData).map(([category, data]) => ({
          category,
          ...data,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
        }))
      },
      message: 'Gross profit report generated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
