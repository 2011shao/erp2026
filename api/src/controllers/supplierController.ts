import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSuppliers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user?.shopId) {
      where.shopId = req.user.shopId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
        { contactName: { contains: search as string } },
        { phone: { contains: search as string } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      success: true,
      data: suppliers,
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

export const getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      name, code, address, contactPhone, contactEmail, 
      companyName, taxNumber, bankName, bankAccount,
      contactName, status
    } = req.body;

    if (!name || !code) {
      throw new ApiError(400, 'Name and code are required');
    }

    // Check if code already exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { code }
    });

    if (existingSupplier) {
      throw new ApiError(409, 'Supplier code already exists');
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        address,
        phone: contactPhone,
        email: contactEmail,
        companyName,
        taxNumber,
        bankName,
        bankAccount,
        contactName,
        contactPhone,
        contactEmail,
        status: status || 'active',
        shopId: req.user!.shopId || ''
      }
    });

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { 
      name, code, address, contactPhone, contactEmail, 
      companyName, taxNumber, bankName, bankAccount,
      contactName, status
    } = req.body;

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Check if code already exists (excluding current supplier)
    if (code && code !== supplier.code) {
      const existingSupplier = await prisma.supplier.findUnique({
        where: { code }
      });

      if (existingSupplier) {
        throw new ApiError(409, 'Supplier code already exists');
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        code,
        address,
        phone: contactPhone,
        email: contactEmail,
        companyName,
        taxNumber,
        bankName,
        bankAccount,
        contactName,
        contactPhone,
        contactEmail,
        status
      }
    });

    res.json({
      success: true,
      data: updatedSupplier
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new ApiError(404, 'Supplier not found');
    }

    // Check if supplier has associated purchase orders
    const purchaseOrders = await prisma.purchaseOrder.count({
      where: { supplierId: id }
    });

    if (purchaseOrders > 0) {
      throw new ApiError(400, 'Cannot delete supplier with associated purchase orders');
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliersSimple = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.user?.shopId) {
      where.shopId = req.user.shopId;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};
