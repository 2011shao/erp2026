// 验证调拨订单数据
export const validateTransferOrder = (data: any): string | null => {
  // 检查必填字段
  if (!data.fromWarehouseId) {
    return 'Source warehouse is required';
  }

  if (!data.toWarehouseId) {
    return 'Destination warehouse is required';
  }

  if (data.fromWarehouseId === data.toWarehouseId) {
    return 'Source and destination warehouses must be different';
  }

  if (!data.reason) {
    return 'Transfer reason is required';
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return 'Transfer items are required';
  }

  // 检查每个调拨项
  for (const item of data.items) {
    if (!item.productId) {
      return 'Product ID is required for each item';
    }

    if (!item.quantity || item.quantity <= 0) {
      return 'Quantity must be greater than 0 for each item';
    }
  }

  return null;
};

// 验证串号数据
export const validateSerialNumber = (data: any): string | null => {
  if (!data.serialNumber) {
    return 'Serial number is required';
  }

  if (data.serialNumber.length < 10 || data.serialNumber.length > 20) {
    return 'Serial number length must be between 10 and 20 characters';
  }

  if (!data.productId) {
    return 'Product ID is required';
  }

  if (!data.shopId) {
    return 'Shop ID is required';
  }

  return null;
};

// 验证销售订单数据
export const validateSalesOrder = (data: any): string | null => {
  if (!data.shopId) {
    return 'Shop ID is required';
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return 'Order items are required';
  }

  for (const item of data.items) {
    if (!item.productId) {
      return 'Product ID is required for each item';
    }

    if (!item.quantity || item.quantity <= 0) {
      return 'Quantity must be greater than 0 for each item';
    }

    if (!item.price || item.price <= 0) {
      return 'Price must be greater than 0 for each item';
    }
  }

  return null;
};

// 验证采购订单数据
export const validatePurchaseOrder = (data: any): string | null => {
  if (!data.shopId) {
    return 'Shop ID is required';
  }

  if (!data.supplierId) {
    return 'Supplier ID is required';
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return 'Order items are required';
  }

  for (const item of data.items) {
    if (!item.productId) {
      return 'Product ID is required for each item';
    }

    if (!item.quantity || item.quantity <= 0) {
      return 'Quantity must be greater than 0 for each item';
    }

    if (!item.price || item.price <= 0) {
      return 'Price must be greater than 0 for each item';
    }
  }

  return null;
};

// 验证仓库数据
export const validateWarehouse = (data: any): string | null => {
  if (!data.name) {
    return 'Warehouse name is required';
  }

  if (data.name.length < 2 || data.name.length > 50) {
    return 'Warehouse name length must be between 2 and 50 characters';
  }

  if (!data.code) {
    return 'Warehouse code is required';
  }

  if (data.code.length < 2 || data.code.length > 20) {
    return 'Warehouse code length must be between 2 and 20 characters';
  }

  if (!data.address) {
    return 'Warehouse address is required';
  }

  if (data.address.length < 5 || data.address.length > 200) {
    return 'Warehouse address length must be between 5 and 200 characters';
  }

  if (!data.contactName) {
    return 'Contact name is required';
  }

  if (data.contactName.length < 2 || data.contactName.length > 20) {
    return 'Contact name length must be between 2 and 20 characters';
  }

  if (!data.contactPhone) {
    return 'Contact phone is required';
  }

  if (!/^1[3-9]\d{9}$/.test(data.contactPhone)) {
    return 'Invalid phone number format';
  }

  if (!data.shopId) {
    return 'Shop ID is required';
  }

  return null;
};