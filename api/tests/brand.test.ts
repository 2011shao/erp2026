import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';

// 测试品牌管理API
 describe('Brand API', () => {
  let token: string;
  let testBrandId: string;

  // 登录获取token
  beforeEach(async () => {
    // 先清理测试数据
    await prisma.brand.deleteMany({ where: { name: { contains: 'Test' } } });

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
    await prisma.brand.deleteMany({ where: { name: { contains: 'Test' } } });
  });

  // 测试获取品牌列表
  it('should get brand list', async () => {
    const response = await request(app)
      .get('/api/brands')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // 测试创建品牌
  it('should create a new brand', async () => {
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const response = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(brandData.name);
    expect(response.body.data.code).toBe(brandData.code);

    testBrandId = response.body.data.id;
  });

  // 测试获取品牌详情
  it('should get brand detail', async () => {
    // 先创建一个品牌
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    const brandId = createResponse.body.data.id;

    // 获取品牌详情
    const detailResponse = await request(app)
      .get(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.success).toBe(true);
    expect(detailResponse.body.data.id).toBe(brandId);
    expect(detailResponse.body.data.name).toBe(brandData.name);
  });

  // 测试更新品牌
  it('should update a brand', async () => {
    // 先创建一个品牌
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    const brandId = createResponse.body.data.id;

    // 更新品牌
    const updateData = {
      name: 'Updated Test Brand',
      sortOrder: 2,
      isActive: false
    };

    const updateResponse = await request(app)
      .put(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.name).toBe(updateData.name);
    expect(updateResponse.body.data.sortOrder).toBe(updateData.sortOrder);
    expect(updateResponse.body.data.isActive).toBe(updateData.isActive);
  });

  // 测试删除品牌
  it('should delete a brand', async () => {
    // 先创建一个品牌
    const brandData = {
      name: 'Test Brand',
      code: 'test-brand',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send(brandData);

    const brandId = createResponse.body.data.id;

    // 删除品牌
    const deleteResponse = await request(app)
      .delete(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Brand deleted successfully');

    // 验证品牌已被删除
    const detailResponse = await request(app)
      .get(`/api/brands/${brandId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailResponse.status).toBe(404);
  });
});
