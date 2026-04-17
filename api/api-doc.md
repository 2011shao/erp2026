# API 文档

## 品牌和分类关联结构

### 数据模型

#### Brand 模型
```prisma
model Brand {
  id         String    @id @default(cuid())
  name       String
  code       String    @unique
  logo       String?
  sortOrder  Int       @default(0)
  isActive   Boolean   @default(true)
  products   Product[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

#### Category 模型
```prisma
model Category {
  id          String      @id @default(cuid())
  name        String
  code        String      @unique
  parentId    String?
  parent      Category?   @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[]  @relation("CategoryHierarchy")
  products    Product[]
  sortOrder   Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

#### Product 模型（关联部分）
```prisma
model Product {
  id         String    @id @default(cuid())
  name       String
  model      String
  price      Decimal   @db.Decimal(10, 2)
  costPrice  Decimal   @db.Decimal(10, 2)
  stock      Int
  shopId     String
  categoryId String?
  brandId    String?
  category   Category? @relation(fields: [categoryId], references: [id])
  brand      Brand?    @relation(fields: [brandId], references: [id])
  // 其他字段...
}
```

### API 接口

#### 品牌管理 API

| 方法 | 路径 | 描述 | 请求体 (JSON) | 响应体 (JSON) |
|------|------|------|---------------|----------------|
| GET | /brands | 获取品牌列表 | N/A | `{"success": true, "data": [{"id": "...", "name": "...", "code": "...", ...}]}` |
| GET | /brands/:id | 获取品牌详情 | N/A | `{"success": true, "data": {"id": "...", "name": "...", "code": "...", ...}}` |
| POST | /brands | 创建品牌 | `{"name": "...", "code": "...", "logo": "...", "sortOrder": 0, "isActive": true}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| PUT | /brands/:id | 更新品牌 | `{"name": "...", "code": "...", "logo": "...", "sortOrder": 0, "isActive": true}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| DELETE | /brands/:id | 删除品牌 | N/A | `{"success": true, "message": "Brand deleted successfully"}` |

#### 分类管理 API

| 方法 | 路径 | 描述 | 请求体 (JSON) | 响应体 (JSON) |
|------|------|------|---------------|----------------|
| GET | /categories | 获取分类列表 | N/A | `{"success": true, "data": [{"id": "...", "name": "...", "code": "...", ...}]}` |
| GET | /categories/tree | 获取分类树形结构 | N/A | `{"success": true, "data": [{"id": "...", "name": "...", "children": [...]}]}` |
| GET | /categories/:id | 获取分类详情 | N/A | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| GET | /categories/:id/children | 获取子分类 | N/A | `{"success": true, "data": [{"id": "...", "name": "...", ...}]}` |
| POST | /categories | 创建分类 | `{"name": "...", "code": "...", "parentId": "...", "sortOrder": 0, "isActive": true}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| PUT | /categories/:id | 更新分类 | `{"name": "...", "code": "...", "parentId": "...", "sortOrder": 0, "isActive": true}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| DELETE | /categories/:id | 删除分类 | N/A | `{"success": true, "message": "Category deleted successfully"}` |

#### 商品管理 API（品牌和分类相关）

| 方法 | 路径 | 描述 | 请求体 (JSON) | 响应体 (JSON) |
|------|------|------|---------------|----------------|
| GET | /products | 获取商品列表（支持品牌和分类过滤） | N/A | `{"success": true, "data": [{"id": "...", "name": "...", "brand": {"id": "...", "name": "..."}, "category": {"id": "...", "name": "..."}, ...}]}` |
| GET | /products/:id | 获取商品详情 | N/A | `{"success": true, "data": {"id": "...", "name": "...", "brand": {"id": "...", "name": "..."}, "category": {"id": "...", "name": "..."}, ...}}` |
| POST | /products | 创建商品 | `{"name": "...", "model": "...", "price": 100, "costPrice": 80, "stock": 10, "shopId": "...", "categoryId": "...", "brandId": "..."}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |
| PUT | /products/:id | 更新商品 | `{"name": "...", "model": "...", "price": 100, "costPrice": 80, "stock": 10, "shopId": "...", "categoryId": "...", "brandId": "..."}` | `{"success": true, "data": {"id": "...", "name": "...", ...}}` |

### 前端使用示例

#### 获取品牌列表
```javascript
import { brandApi } from './api';

const brands = await brandApi.getAll();
console.log(brands.data); // [{ id: "...", name: "...", ... }]
```

#### 获取分类树形结构
```javascript
import { categoryApi } from './api';

const categories = await categoryApi.getTree();
console.log(categories.data); // [{ id: "...", name: "...", children: [...] }]
```

#### 创建商品时选择品牌和分类
```javascript
import { productApi } from './api';

const newProduct = await productApi.create({
  name: "iPhone 15",
  model: "Pro Max",
  price: 9999,
  costPrice: 8000,
  stock: 50,
  shopId: "shop123",
  categoryId: "cat123", // 分类ID
  brandId: "brand123"   // 品牌ID
});
```

#### 显示商品的品牌和分类
```javascript
// 商品数据结构
const product = {
  id: "prod123",
  name: "iPhone 15",
  model: "Pro Max",
  brand: { id: "brand123", name: "Apple" },
  category: { id: "cat123", name: "手机" }
};

// 显示品牌和分类
console.log(`品牌: ${product.brand?.name}`); // 品牌: Apple
console.log(`分类: ${product.category?.name}`); // 分类: 手机
```

### 注意事项

1. **品牌和分类关联**：商品通过 `brandId` 和 `categoryId` 字段关联到品牌和分类，而不是直接存储品牌和分类名称。

2. **数据结构**：前端获取商品数据时，会包含品牌和分类的完整信息（通过 include 关联查询）。

3. **API 响应**：所有 API 响应都采用统一的格式：`{"success": true, "data": ...}`。

4. **错误处理**：API 错误会返回 `{"success": false, "error": "错误信息"}`。

5. **权限控制**：所有 API 都需要进行身份验证，部分 API 需要特定权限。
