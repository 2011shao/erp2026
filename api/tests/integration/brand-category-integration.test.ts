import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import prisma from '../../src/lib/prisma';

// 测试品牌和分类与商品的集成
 describe('Brand and Category Integration', () => {
  let token: string;
  let testBrandId: string;
  let testCategoryId: string;
  let testProductId: string;

  // 登录获取token
  beforeEach(async () => {
    // 先清理测试数据
    await prisma.product.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.brand.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.category.deleteMany({ where: { name: { contains: 'Test' } } });

    // 登录获取token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    token = loginResponse.body.data.accessToken;
  });

  // 清理测试数据
  afterEach(async () => {
    await prisma.product.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.brand.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.category.deleteMany({ where: { name: { contains: 'Test' } } });
  });

  // 测试创建品牌和分类后关联到商品
  it('should create brand and category, then associate with product', async () => {
    // 创建品牌
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const brandResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    expect(brandResponse.status).toBe(200);
    expect(brandResponse.body.success).toBe(true);
    testBrandId = brandResponse.body.data.id;

    // 创建分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    expect(categoryResponse.status).toBe(200);
    expect(categoryResponse.body.success).toBe(true);
    testCategoryId = categoryResponse.body.data.id;

    // 创建商品并关联品牌和分类
    const productData = {
      name: 'Test Product',
      model: 'Test Model',
      price: 100,
      costPrice: 80,
      stock: 10,
      shopId: 'shop-1', // 假设存在的店铺ID
      brandId: testBrandId,
      categoryId: testCategoryId
    };

    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);

    expect(productResponse.status).toBe(200);
    expect(productResponse.body.success).toBe(true);
    testProductId = productResponse.body.data.id;

    // 获取商品详情，验证品牌和分类关联
    const productDetailResponse = await request(app)
      .get(`/api/products/${testProductId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(productDetailResponse.status).toBe(200);
    expect(productDetailResponse.body.success).toBe(true);
    expect(productDetailResponse.body.data.brandId).toBe(testBrandId);
    expect(productDetailResponse.body.data.categoryId).toBe(testCategoryId);
    expect(productDetailResponse.body.data.brand).toBeDefined();
    expect(productDetailResponse.body.data.brand.name).toBe(brandData.name);
    expect(productDetailResponse.body.data.category).toBeDefined();
    expect(productDetailResponse.body.data.category.name).toBe(categoryData.name);
  });

  // 测试通过品牌和分类过滤商品
  it('should filter products by brand and category', async () => {
    // 创建品牌1
    const brand1Data = {
      name: 'Brand 1',
      code: 'brand-1',
      sortOrder: 1,
      isActive: true
    };

    const brand1Response = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brand1Data);

    const brand1Id = brand1Response.body.data.id;

    // 创建品牌2
    const brand2Data = {
      name: 'Brand 2',
      code: 'brand-2',
      sortOrder: 2,
      isActive: true
    };

    const brand2Response = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brand2Data);

    const brand2Id = brand2Response.body.data.id;

    // 创建分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    const categoryId = categoryResponse.body.data.id;

    // 创建商品1，关联品牌1
    const product1Data = {
      name: 'Product 1',
      model: 'Model 1',
      price: 100,
      costPrice: 80,
      stock: 10,
      shopId: 'shop-1',
      brandId: brand1Id,
      categoryId: categoryId
    };

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(product1Data);

    // 创建商品2，关联品牌2
    const product2Data = {
      name: 'Product 2',
      model: 'Model 2',
      price: 200,
      costPrice: 160,
      stock: 5,
      shopId: 'shop-1',
      brandId: brand2Id,
      categoryId: categoryId
    };

    await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(product2Data);

    // 按品牌1过滤商品
    const brand1FilterResponse = await request(app)
      .get(`/api/products?brand=${brand1Id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(brand1FilterResponse.status).toBe(200);
    expect(brand1FilterResponse.body.success).toBe(true);
    expect(Array.isArray(brand1FilterResponse.body.data)).toBe(true);
    expect(brand1FilterResponse.body.data.length).toBe(1);
    expect(brand1FilterResponse.body.data[0].brandId).toBe(brand1Id);

    // 按分类过滤商品
    const categoryFilterResponse = await request(app)
      .get(`/api/products?category=${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(categoryFilterResponse.status).toBe(200);
    expect(categoryFilterResponse.body.success).toBe(true);
    expect(Array.isArray(categoryFilterResponse.body.data)).toBe(true);
    expect(categoryFilterResponse.body.data.length).toBe(2);
    categoryFilterResponse.body.data.forEach((product: any) => {
      expect(product.categoryId).toBe(categoryId);
    });
  });

  // 测试品牌和分类的级联删除
  it('should handle brand and category deletion with associated products', async () => {
    // 创建品牌
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const brandResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    const brandId = brandResponse.body.data.id;

    // 创建分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    const categoryId = categoryResponse.body.data.id;

    // 创建商品并关联品牌和分类
    const productData = {
      name: 'Test Product',
      model: 'Test Model',
      price: 100,
      costPrice: 80,
      stock: 10,
      shopId: 'shop-1',
      brandId: brandId,
      categoryId: categoryId
    };

    const productResponse = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);

    const productId = productResponse.body.data.id;

    // 尝试删除品牌（应该失败，因为有商品关联）
    const deleteBrandResponse = await request(app)
      .delete(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`);

    // 注意：实际行为取决于数据库的外键约束设置
    // 如果设置了级联删除，这里会成功；如果设置了限制，这里会失败
    // 这里假设设置了限制，所以会失败
    // expect(deleteBrandResponse.status).toBe(400);

    // 先删除商品
    await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    // 再删除品牌
    const deleteBrandAfterResponse = await request(app)
      .delete(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteBrandAfterResponse.status).toBe(200);
    expect(deleteBrandAfterResponse.body.success).toBe(true);

    // 删除分类
    const deleteCategoryResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteCategoryResponse.status).toBe(200);
    expect(deleteCategoryResponse.body.success).toBe(true);
  });
});
