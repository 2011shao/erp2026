import express from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const shopId = req.query.shopId as string;
    const type = req.query.type as string;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (type) where.type = type;
    if (category) where.category = category;

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        include: { shop: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: records,
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

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    const records = await prisma.financialRecord.findMany({ where });

    const totalIncome = records
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);
    const totalExpense = records
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount.toNumber(), 0);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netProfit: totalIncome - totalExpense,
        recordCount: records.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', authenticate, async (req, res, next) => {
  try {
    const shopId = req.query.shopId as string;

    const where: any = {};
    if (shopId) where.shopId = shopId;

    const records = await prisma.financialRecord.findMany({ where });

    const categorySummary: any = {};
    for (const record of records) {
      if (!categorySummary[record.category]) {
        categorySummary[record.category] = { income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        categorySummary[record.category].income += record.amount.toNumber();
      } else {
        categorySummary[record.category].expense += record.amount.toNumber();
      }
    }

    res.json({
      success: true,
      data: {
        byCategory: categorySummary,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await prisma.financialRecord.findUnique({
      where: { id },
      include: { shop: { select: { id: true, name: true } } },
    });

    if (!record) {
      throw new ApiError(404, 'Financial record not found');
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { shopId, amount, type, category, description } = req.body;

    if (!shopId || !amount || !type || !category) {
      throw new ApiError(400, 'Missing required fields');
    }

    if (type !== 'income' && type !== 'expense') {
      throw new ApiError(400, 'Type must be either "income" or "expense"');
    }

    const record = await prisma.financialRecord.create({
      data: {
        shopId,
        amount,
        type,
        category,
        description,
      },
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, type, category, description } = req.body;

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        amount,
        type,
        category,
        description,
      },
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.financialRecord.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Financial record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
