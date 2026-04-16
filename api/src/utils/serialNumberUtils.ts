import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 记录串号状态变更日志
 */
export async function logSerialNumberStatusChange(
  serialNumberId: string,
  oldStatus: string,
  newStatus: string,
  reason: string,
  operatorId: string
): Promise<void> {
  try {
    await prisma.serialNumberLog.create({
      data: {
        serialNumberId,
        oldStatus,
        newStatus,
        reason,
        operatorId
      }
    });
  } catch (error) {
    console.error('Error logging serial number status change:', error);
  }
}

/**
 * 批量更新串号状态
 */
export async function updateSerialNumbersStatus(
  serialNumberIds: string[],
  status: string,
  options?: {
    warehouseId?: string;
    productId?: string;
    salesOrderId?: string;
    salesOrderItemId?: string;
    purchaseOrderId?: string;
    purchaseOrderItemId?: string;
    transferOrderId?: string;
    transferOrderItemId?: string;
    stocktakeId?: string;
    stocktakeItemId?: string;
  }
): Promise<void> {
  try {
    await prisma.serialNumber.updateMany({
      where: {
        id: { in: serialNumberIds }
      },
      data: {
        status,
        ...options
      }
    });
  } catch (error) {
    console.error('Error updating serial numbers status:', error);
    throw error;
  }
}

/**
 * 检查串号是否存在且状态正确
 */
export async function validateSerialNumbers(
  serialNumberIds: string[],
  expectedStatus: string,
  warehouseId?: string,
  productId?: string
): Promise<boolean> {
  try {
    const where: any = {
      id: { in: serialNumberIds },
      status: expectedStatus
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (productId) {
      where.productId = productId;
    }

    const count = await prisma.serialNumber.count({ where });
    return count === serialNumberIds.length;
  } catch (error) {
    console.error('Error validating serial numbers:', error);
    return false;
  }
}
