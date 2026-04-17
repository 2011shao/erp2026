import prisma from '../src/lib/prisma';

async function migrateLegacyData() {
  try {
    console.log('开始执行数据迁移...');

    // 1. 获取所有产品
    const products = await prisma.product.findMany();
    console.log(`找到 ${products.length} 个产品`);

    // 2. 提取唯一的品牌名称
    const uniqueBrands = new Set<string>();
    products.forEach(product => {
      if (product.brand && product.brand.trim()) {
        uniqueBrands.add(product.brand.trim());
      }
    });

    // 3. 提取唯一的分类名称
    const uniqueCategories = new Set<string>();
    products.forEach(product => {
      if (product.category && product.category.trim()) {
        uniqueCategories.add(product.category.trim());
      }
    });

    console.log(`找到 ${uniqueBrands.size} 个唯一品牌`);
    console.log(`找到 ${uniqueCategories.size} 个唯一分类`);

    // 4. 创建品牌记录
    const brandMap = new Map<string, string>();
    for (const brandName of uniqueBrands) {
      // 检查品牌是否已存在
      const existingBrand = await prisma.brand.findFirst({
        where: { name: brandName }
      });

      let brandId: string;
      if (existingBrand) {
        brandId = existingBrand.id;
        console.log(`品牌 ${brandName} 已存在，使用现有ID: ${brandId}`);
      } else {
        // 创建新品牌
        const newBrand = await prisma.brand.create({
          data: {
            name: brandName,
            code: brandName.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: 0,
            isActive: true
          }
        });
        brandId = newBrand.id;
        console.log(`创建新品牌 ${brandName}，ID: ${brandId}`);
      }
      brandMap.set(brandName, brandId);
    }

    // 5. 创建分类记录
    const categoryMap = new Map<string, string>();
    for (const categoryName of uniqueCategories) {
      // 检查分类是否已存在
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryName }
      });

      let categoryId: string;
      if (existingCategory) {
        categoryId = existingCategory.id;
        console.log(`分类 ${categoryName} 已存在，使用现有ID: ${categoryId}`);
      } else {
        // 创建新分类
        const newCategory = await prisma.category.create({
          data: {
            name: categoryName,
            code: categoryName.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: 0,
            isActive: true
          }
        });
        categoryId = newCategory.id;
        console.log(`创建新分类 ${categoryName}，ID: ${categoryId}`);
      }
      categoryMap.set(categoryName, categoryId);
    }

    // 6. 更新产品的品牌和分类关联
    let updatedProducts = 0;
    for (const product of products) {
      const updateData: any = {};

      if (product.brand && product.brand.trim()) {
        const brandId = brandMap.get(product.brand.trim());
        if (brandId) {
          updateData.brandId = brandId;
        }
      }

      if (product.category && product.category.trim()) {
        const categoryId = categoryMap.get(product.category.trim());
        if (categoryId) {
          updateData.categoryId = categoryId;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: updateData
        });
        updatedProducts++;
      }
    }

    console.log(`更新了 ${updatedProducts} 个产品的品牌和分类关联`);
    console.log('数据迁移完成！');

  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLegacyData();
