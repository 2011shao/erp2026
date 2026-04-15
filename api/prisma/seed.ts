import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ 创建管理员用户:', adminUser.username);

  // 创建示例店铺
  const shop1 = await prisma.shop.upsert({
    where: { id: 'shop-beijing' },
    update: {},
    create: {
      id: 'shop-beijing',
      name: '北京旗舰店',
      address: '北京市朝阳区建国路88号',
      phone: '010-88888888',
      managerId: adminUser.id,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { id: 'shop-shanghai' },
    update: {},
    create: {
      id: 'shop-shanghai',
      name: '上海分店',
      address: '上海市浦东新区陆家嘴',
      phone: '021-66666666',
      managerId: adminUser.id,
    },
  });

  const shop3 = await prisma.shop.upsert({
    where: { id: 'shop-guangzhou' },
    update: {},
    create: {
      id: 'shop-guangzhou',
      name: '广州分店',
      address: '广州市天河区珠江新城',
      phone: '020-99999999',
      managerId: adminUser.id,
    },
  });

  console.log('✅ 创建示例店铺');

  // 创建示例商品
  const products = [
    {
      id: 'prod-iphone15',
      name: 'iPhone 15',
      category: '手机',
      brand: 'Apple',
      model: 'A2650',
      price: 5999,
      costPrice: 5000,
      stock: 50,
      shopId: shop1.id,
    },
    {
      id: 'prod-macbook',
      name: 'MacBook Pro',
      category: '电脑',
      brand: 'Apple',
      model: 'M3',
      price: 12999,
      costPrice: 10000,
      stock: 20,
      shopId: shop1.id,
    },
    {
      id: 'prod-ipad',
      name: 'iPad Pro',
      category: '平板',
      brand: 'Apple',
      model: 'M2',
      price: 8999,
      costPrice: 7000,
      stock: 30,
      shopId: shop2.id,
    },
    {
      id: 'prod-airpods',
      name: 'AirPods Pro',
      category: '耳机',
      brand: 'Apple',
      model: '2nd Gen',
      price: 1999,
      costPrice: 1500,
      stock: 100,
      shopId: shop3.id,
    },
    {
      id: 'prod-huawei',
      name: '华为 Mate 60 Pro',
      category: '手机',
      brand: '华为',
      model: 'Mate 60',
      price: 6999,
      costPrice: 5800,
      stock: 40,
      shopId: shop1.id,
    },
    {
      id: 'prod-xiaomi',
      name: '小米 14 Pro',
      category: '手机',
      brand: '小米',
      model: '14 Pro',
      price: 4999,
      costPrice: 4200,
      stock: 60,
      shopId: shop2.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log('✅ 创建示例商品');

  // 创建示例财务记录
  const financialRecords = [
    {
      shopId: shop1.id,
      amount: 5999,
      type: 'income',
      category: '销售',
      description: 'iPhone 15 销售',
    },
    {
      shopId: shop1.id,
      amount: 12999,
      type: 'income',
      category: '销售',
      description: 'MacBook Pro 销售',
    },
    {
      shopId: shop1.id,
      amount: 1000,
      type: 'expense',
      category: '采购',
      description: '办公用品采购',
    },
    {
      shopId: shop2.id,
      amount: 8999,
      type: 'income',
      category: '销售',
      description: 'iPad Pro 销售',
    },
    {
      shopId: shop3.id,
      amount: 500,
      type: 'expense',
      category: '租金',
      description: '店铺租金',
    },
  ];

  for (const record of financialRecords) {
    await prisma.financialRecord.create({
      data: record,
    });
  }

  console.log('✅ 创建示例财务记录');

  // 创建示例库存变动记录
  const inventoryLogs = [
    {
      productId: 'prod-iphone15',
      quantity: 10,
      type: 'in',
      reason: '采购入库',
      shopId: shop1.id,
    },
    {
      productId: 'prod-iphone15',
      quantity: 5,
      type: 'out',
      reason: '销售出库',
      shopId: shop1.id,
    },
    {
      productId: 'prod-macbook',
      quantity: 3,
      type: 'in',
      reason: '采购入库',
      shopId: shop1.id,
    },
  ];

  for (const log of inventoryLogs) {
    await prisma.inventoryLog.create({
      data: log,
    });
  }

  console.log('✅ 创建示例库存变动记录');

  console.log('\n🎉 数据库初始化完成！');
  console.log('\n📝 登录信息:');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
