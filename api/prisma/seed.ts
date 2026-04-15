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

  // 创建权限数据
  const permissions = [
    // 菜单权限
    { code: 'dashboard.view', name: '查看首页', type: 'menu', description: '允许访问首页' },
    { code: 'shop.manage', name: '店铺管理', type: 'menu', description: '允许访问店铺管理菜单' },
    { code: 'product.manage', name: '商品管理', type: 'menu', description: '允许访问商品管理菜单' },
    { code: 'inventory.manage', name: '库存管理', type: 'menu', description: '允许访问库存管理菜单' },
    { code: 'sales.manage', name: '销售管理', type: 'menu', description: '允许访问销售管理菜单' },
    { code: 'financial.manage', name: '财务管理', type: 'menu', description: '允许访问财务管理菜单' },
    { code: 'report.manage', name: '报表管理', type: 'menu', description: '允许访问报表管理菜单' },
    { code: 'user.manage', name: '用户管理', type: 'menu', description: '允许访问用户管理菜单' },
    { code: 'role.manage', name: '角色管理', type: 'menu', description: '允许访问角色管理菜单' },
    
    // 操作权限
    { code: 'shop.view', name: '查看店铺', type: 'action', description: '允许查看店铺列表' },
    { code: 'shop.create', name: '创建店铺', type: 'action', description: '允许创建店铺' },
    { code: 'shop.edit', name: '编辑店铺', type: 'action', description: '允许编辑店铺' },
    { code: 'shop.delete', name: '删除店铺', type: 'action', description: '允许删除店铺' },
    { code: 'product.view', name: '查看商品', type: 'action', description: '允许查看商品列表' },
    { code: 'product.create', name: '创建商品', type: 'action', description: '允许创建商品' },
    { code: 'product.edit', name: '编辑商品', type: 'action', description: '允许编辑商品' },
    { code: 'product.delete', name: '删除商品', type: 'action', description: '允许删除商品' },
    { code: 'inventory.view', name: '查看库存', type: 'action', description: '允许查看库存列表' },
    { code: 'inventory.adjust', name: '调整库存', type: 'action', description: '允许调整库存' },
    { code: 'sales.view', name: '查看销售', type: 'action', description: '允许查看销售订单' },
    { code: 'sales.create', name: '创建销售', type: 'action', description: '允许创建销售订单' },
    { code: 'sales.edit', name: '编辑销售', type: 'action', description: '允许编辑销售订单' },
    { code: 'financial.view', name: '查看财务', type: 'action', description: '允许查看财务记录' },
    { code: 'financial.create', name: '创建财务', type: 'action', description: '允许创建财务记录' },
    { code: 'financial.delete', name: '删除财务', type: 'action', description: '允许删除财务记录' },
    { code: 'report.view', name: '查看报表', type: 'action', description: '允许查看报表' },
    { code: 'user.view', name: '查看用户', type: 'action', description: '允许查看用户列表' },
    { code: 'user.create', name: '创建用户', type: 'action', description: '允许创建用户' },
    { code: 'user.edit', name: '编辑用户', type: 'action', description: '允许编辑用户' },
    { code: 'user.delete', name: '删除用户', type: 'action', description: '允许删除用户' },
    { code: 'role.view', name: '查看角色', type: 'action', description: '允许查看角色列表' },
    { code: 'role.create', name: '创建角色', type: 'action', description: '允许创建角色' },
    { code: 'role.edit', name: '编辑角色', type: 'action', description: '允许编辑角色' },
    { code: 'role.delete', name: '删除角色', type: 'action', description: '允许删除角色' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    });
  }

  console.log('✅ 创建权限数据');

  // 创建角色数据
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '超级管理员，拥有所有权限',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: '店长，拥有本店铺的所有权限',
      isSystem: true,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: {
      name: 'staff',
      description: '员工，拥有基础操作权限',
      isSystem: true,
    },
  });

  console.log('✅ 创建角色数据');

  // 为管理员角色分配所有权限
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 为店长角色分配基础权限
  const managerPermissions = allPermissions.filter(p => 
    p.code.includes('view') || 
    p.code.includes('create') || 
    p.code.includes('edit') ||
    p.code.includes('manage')
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 为员工角色分配基础查看权限
  const staffPermissions = allPermissions.filter(p => 
    p.code.includes('view') || 
    p.code.includes('manage') ||
    p.code.includes('create')
  );
  for (const permission of staffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: staffRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: staffRole.id,
        permissionId: permission.id,
      },
    });
  }

  // 为管理员用户分配admin角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ 分配角色权限');

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
