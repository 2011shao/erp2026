import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';

// 测试分类管理API
 describe('Category API', () => {
  let token: string;
  let testCategoryId: string;

  // 登录获取token
  beforeEach(async () => {
    // 先清理测试数据
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
    await prisma.category.deleteMany({ where: { name: { contains: 'Test' } } });
  });

  // 测试获取分类列表
  it('should get category list', async () => {
    const response = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // 测试获取分类树形结构
  it('should get category tree', async () => {
    const response = await request(app)
      .get('/api/categories/tree')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // 测试创建分类
  it('should create a new category', async () => {
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const response = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(categoryData.name);
    expect(response.body.data.code).toBe(categoryData.code);

    testCategoryId = response.body.data.id;
  });

  // 测试创建子分类
  it('should create a sub category', async () => {
    // 先创建一个父分类
    const parentCategoryData = {
      name: 'Parent Test Category',
      code: 'parent-test-category',
      sortOrder: 1,
      isActive: true
    };

    const parentResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(parentCategoryData);

    const parentId = parentResponse.body.data.id;

    // 创建子分类
    const subCategoryData = {
      name: 'Sub Test Category',
      code: 'sub-test-category',
      parentId,
      sortOrder: 1,
      isActive: true
    };

    const subResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(subCategoryData);

    expect(subResponse.status).toBe(200);
    expect(subResponse.body.success).toBe(true);
    expect(subResponse.body.data.name).toBe(subCategoryData.name);
    expect(subResponse.body.data.parentId).toBe(parentId);
  });

  // 测试获取分类详情
  it('should get category detail', async () => {
    // 先创建一个分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    const categoryId = createResponse.body.data.id;

    // 获取分类详情
    const detailResponse = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.success).toBe(true);
    expect(detailResponse.body.data.id).toBe(categoryId);
    expect(detailResponse.body.data.name).toBe(categoryData.name);
  });

  // 测试获取子分类
  it('should get sub categories', async () => {
    // 先创建一个父分类
    const parentCategoryData = {
      name: 'Parent Test Category',
      code: 'parent-test-category',
      sortOrder: 1,
      isActive: true
    };

    const parentResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(parentCategoryData);

    const parentId = parentResponse.body.data.id;

    // 创建子分类
    const subCategoryData = {
      name: 'Sub Test Category',
      code: 'sub-test-category',
      parentId,
      sortOrder: 1,
      isActive: true
    };

    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(subCategoryData);

    // 获取子分类
    const childrenResponse = await request(app)
      .get(`/api/categories/${parentId}/children`)
      .set('Authorization', `Bearer ${token}`);

    expect(childrenResponse.status).toBe(200);
    expect(childrenResponse.body.success).toBe(true);
    expect(Array.isArray(childrenResponse.body.data)).toBe(true);
    expect(childrenResponse.body.data.length).toBeGreaterThan(0);
  });

  // 测试更新分类
  it('should update a category', async () => {
    // 先创建一个分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    const categoryId = createResponse.body.data.id;

    // 更新分类
    const updateData = {
      name: 'Updated Test Category',
      sortOrder: 2,
      isActive: false
    };

    const updateResponse = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.data.name).toBe(updateData.name);
    expect(updateResponse.body.data.sortOrder).toBe(updateData.sortOrder);
    expect(updateResponse.body.data.isActive).toBe(updateData.isActive);
  });

  // 测试删除分类
  it('should delete a category', async () => {
    // 先创建一个分类
    const categoryData = {
      name: 'Test Category',
      code: 'test-category',
      sortOrder: 1,
      isActive: true
    };

    const createResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryData);

    const categoryId = createResponse.body.data.id;

    // 删除分类
    const deleteResponse = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.message).toBe('Category deleted successfully');

    // 验证分类已被删除
    const detailResponse = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailResponse.status).toBe(404);
  });
});
