import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

// 生成随机串号
const generateSerialNumber = (brand: string, model: string, index: number): string => {
  const brandCode = brand.substring(0, 2).toUpperCase();
  const modelCode = model.substring(0, 3).toUpperCase();
  const date = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  const sequence = String(index).padStart(4, '0');
  return `${brandCode}${modelCode}${date}${sequence}`;
};

// 解析手动输入的串号
const parseSerialNumbers = (input: string): string[] => {
  return input
    .split(/[,;\s]+/)
    .map(sn => sn.trim())
    .filter(sn => sn.length > 0);
};

export const getStockInOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, supplierId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user?.shopId) {
      where.shopId = req.user.shopId;
    }
    if (status) {
      where.status = status;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [orders, total] = await Promise.all([
      prisma.stockInOrder.findMany({
        where,
        skip: skip,
        take: Number(limit),
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          operator: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockInOrder.count({ where })
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStockInOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.stockInOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        operator: {
          select: {
            id: true,
            username: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                model: true,
                brand: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            serialNumbers: {
              select: {
                id: true,
                serialNumber: true,
                status: true
              }
            }
          }
        },
        logs: {
          include: {
            operator: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new ApiError(404, 'Stock in order not found');
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const createStockInOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { supplierId, warehouseId, items, notes } = req.body;

    if (!items || items.length === 0) {
      throw new ApiError(400, 'At least one item is required');
    }

    // 确保用户已认证
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // 确保 shopId 存在且有效
    let shopId = req.user.shopId;
    if (!shopId) {
      // 尝试获取第一个可用的店铺
      const defaultShop = await prisma.shop.findFirst();
      if (!defaultShop) {
        throw new ApiError(400, 'No shop available. Please create a shop first.');
      }
      shopId = defaultShop.id;
    }

    const order = await prisma.stockInOrder.create({
      data: {
        shopId: shopId,
        supplierId,
        warehouseId,
        operatorId: req.user.id,
        notes,
        totalItems: items.length,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            serialNumberType: item.serialNumberType
          }))
        },
        logs: {
          create: {
            oldStatus: 'pending',
            newStatus: 'pending',
            reason: 'Order created',
            operatorId: req.user.id
          }
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                model: true,
                brand: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const addSerialNumbers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, itemId, serialNumbers, quantity } = req.body;

    const order = await prisma.stockInOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { id: itemId }
        }
      }
    });

    if (!order) {
      throw new ApiError(404, 'Stock in order not found');
    }

    if (order.status !== 'pending') {
      throw new ApiError(400, 'Cannot add serial numbers to non-pending order');
    }

    const item = order.items[0];
    if (!item) {
      throw new ApiError(404, 'Order item not found');
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        brand: {
          select: {
            name: true
          }
        }
      }
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    let serialNumberList: string[] = [];

    if (item.serialNumberType === 'manual') {
      // 手动输入串号
      serialNumberList = parseSerialNumbers(serialNumbers);
    } else if (item.serialNumberType === 'auto') {
      // 自动生成串号
      for (let i = 1; i <= quantity; i++) {
        serialNumberList.push(generateSerialNumber(product.brand?.name || 'UN', product.model, i));
      }
    }

    // 检查串号唯一性
    for (const sn of serialNumberList) {
      const existingSN = await prisma.serialNumber.findUnique({
        where: { serialNumber: sn }
      });
      if (existingSN) {
        throw new ApiError(400, `Serial number ${sn} already exists`);
      }
    }

    // 创建串号
    const createdSerialNumbers = await prisma.serialNumber.createMany({
      data: serialNumberList.map(sn => ({
        serialNumber: sn,
        productId: item.productId,
        shopId: order.shopId,
        status: 'in_stock',
        stockInOrderId: orderId,
        stockInOrderItemId: itemId
      }))
    });

    res.json({
      success: true,
      data: {
        serialNumbers: serialNumberList,
        count: createdSerialNumbers.count
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmStockInOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.stockInOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            serialNumbers: true
          }
        }
      }
    });

    if (!order) {
      throw new ApiError(404, 'Stock in order not found');
    }

    if (order.status !== 'pending') {
      throw new ApiError(400, 'Order is not in pending status');
    }

    // 检查所有项目是否都有串号
    for (const item of order.items) {
      if (item.serialNumbers.length === 0) {
        throw new ApiError(400, `Item ${item.id} has no serial numbers`);
      }
    }

    // 更新订单状态
    const updatedOrder = await prisma.stockInOrder.update({
      where: { id },
      data: {
        status: 'completed',
        logs: {
          create: {
            oldStatus: 'pending',
            newStatus: 'completed',
            reason: 'Order confirmed',
            operatorId: req.user!.id
          }
        }
      },
      include: {
        items: {
          include: {
            serialNumbers: {
              select: {
                id: true,
                serialNumber: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const cancelStockInOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.stockInOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Stock in order not found');
    }

    if (order.status !== 'pending') {
      throw new ApiError(400, 'Only pending orders can be cancelled');
    }

    // 更新订单状态
    const updatedOrder = await prisma.stockInOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        logs: {
          create: {
            oldStatus: 'pending',
            newStatus: 'cancelled',
            reason: reason || 'Order cancelled',
            operatorId: req.user!.id
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStockInOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.stockInOrder.findUnique({
      where: { id }
    });

    if (!order) {
      throw new ApiError(404, 'Stock in order not found');
    }

    if (order.status === 'completed') {
      throw new ApiError(400, 'Cannot delete completed order');
    }

    // 删除相关串号
    await prisma.serialNumber.deleteMany({
      where: { stockInOrderId: id }
    });

    // 删除订单
    await prisma.stockInOrder.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Stock in order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { supplierId, brandId, model, search } = req.query;

    const where: any = {};
    if (brandId) {
      where.brandId = brandId;
    }
    if (model) {
      where.model = { contains: model as string };
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { model: { contains: search as string } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
