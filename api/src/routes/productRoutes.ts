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
    const category = req.query.category as string;
    const shopId = req.query.shopId as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (shopId) where.shopId = shopId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { shop: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
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

router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = products.map((p) => p.category);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { shop: { select: { id: true, name: true } } },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, category, brand, model, price, costPrice, stock, shopId } = req.body;

    if (!name || !category || !price || !costPrice || stock === undefined || !shopId) {
      throw new ApiError(400, 'Missing required fields');
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        brand: brand || '',
        model: model || '',
        price,
        costPrice,
        stock,
        shopId,
      },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch', authenticate, async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      throw new ApiError(400, 'Products array is required');
    }

    const createdProducts = await Promise.all(
      products.map((product: any) =>
        prisma.product.create({
          data: product,
        })
      )
    );

    res.json({
      success: true,
      data: createdProducts,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, brand, model, price, costPrice, stock, shopId } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        brand,
        model,
        price,
        costPrice,
        stock,
        shopId,
      },
    });

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/batch', authenticate, async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      throw new ApiError(400, 'Updates array is required');
    }

    const updatedProducts = await Promise.all(
      updates.map((update: any) =>
        prisma.product.update({
          where: { id: update.id },
          data: update.data,
        })
      )
    );

    res.json({
      success: true,
      data: updatedProducts,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/batch', authenticate, async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      throw new ApiError(400, 'Ids array is required');
    }

    await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({
      success: true,
      message: 'Products deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
