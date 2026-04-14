# API接口文档

## 基础说明

### 统一响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;        // 状态码，0表示成功，非0表示失败
  message: string;      // 响应消息
  data: T;             // 响应数据
}
```

### 状态码说明

| 状态码 | 说明 |
|-------|------|
| 0 | 成功 |
| -1 | 失败 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 用户认证模块

### 1.1 用户登录

**接口地址**: `user.login`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应数据**:

```typescript
{
  code: 0,
  message: '登录成功',
  data: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    userInfo: {
      _id: 'xxx',
      username: 'admin',
      realName: '管理员',
      role: 'super_admin',
      shopId: 'xxx',
      permissions: ['shop:read', 'shop:write', ...]
    }
  }
}
```

---

### 1.2 获取当前用户信息

**接口地址**: `user.getInfo`

**请求方式**: GET

**请求头**: `Authorization: Bearer {token}`

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    username: 'admin',
    realName: '管理员',
    role: 'super_admin',
    shopId: 'xxx',
    permissions: [...]
  }
}
```

---

### 1.3 修改密码

**接口地址**: `user.changePassword`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码 |

**响应数据**:

```typescript
{
  code: 0,
  message: '密码修改成功'
}
```

---

## 2. 店铺管理模块

### 2.1 获取店铺列表

**接口地址**: `shop.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| keyword | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        name: '总店',
        address: '北京市朝阳区xxx',
        phone: '010-12345678',
        status: 'active',
        createTime: 1680000000000
      }
    ],
    total: 100
  }
}
```

---

### 2.2 获取店铺详情

**接口地址**: `shop.getDetail`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 店铺ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    name: '总店',
    address: '北京市朝阳区xxx',
    phone: '010-12345678',
    contact: '张三',
    status: 'active',
    createTime: 1680000000000,
    updateTime: 1680000000000
  }
}
```

---

### 2.3 创建店铺

**接口地址**: `shop.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| name | string | 是 | 店铺名称 |
| address | string | 否 | 店铺地址 |
| phone | string | 否 | 联系电话 |
| contact | string | 否 | 联系人 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx'
  }
}
```

---

### 2.4 更新店铺

**接口地址**: `shop.update`

**请求方式**: PUT

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 店铺ID |
| name | string | 否 | 店铺名称 |
| address | string | 否 | 店铺地址 |
| phone | string | 否 | 联系电话 |
| contact | string | 否 | 联系人 |
| status | string | 否 | 状态 |

**响应数据**:

```typescript
{
  code: 0,
  message: '更新成功'
}
```

---

## 3. 用户管理模块

### 3.1 获取用户列表

**接口地址**: `user.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 否 | 店铺ID |
| role | string | 否 | 角色筛选 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| keyword | string | 否 | 搜索关键词 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        shopId: 'xxx',
        shopName: '总店',
        username: 'cashier01',
        realName: '李四',
        role: 'cashier',
        status: 'active',
        createTime: 1680000000000
      }
    ],
    total: 50
  }
}
```

---

### 3.2 创建用户

**接口地址**: `user.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 所属店铺ID |
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| realName | string | 是 | 真实姓名 |
| phone | string | 否 | 手机号 |
| role | string | 是 | 角色 |
| permissions | array | 否 | 权限列表 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx'
  }
}
```

---

### 3.3 更新用户

**接口地址**: `user.update`

**请求方式**: PUT

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 用户ID |
| realName | string | 否 | 真实姓名 |
| phone | string | 否 | 手机号 |
| role | string | 否 | 角色 |
| permissions | array | 否 | 权限列表 |
| status | string | 否 | 状态 |

**响应数据**:

```typescript
{
  code: 0,
  message: '更新成功'
}
```

---

### 3.4 重置用户密码

**接口地址**: `user.resetPassword`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 用户ID |
| newPassword | string | 是 | 新密码 |

**响应数据**:

```typescript
{
  code: 0,
  message: '密码重置成功'
}
```

---

## 4. 商品管理模块

### 4.1 获取商品分类列表

**接口地址**: `category.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| parentId | string | 否 | 父分类ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: [
    {
      _id: 'xxx',
      name: '手机',
      parentId: null,
      sort: 1,
      status: 'active',
      children: [
        {
          _id: 'yyy',
          name: 'iPhone',
          parentId: 'xxx',
          sort: 1,
          status: 'active'
        }
      ]
    }
  ]
}
```

---

### 4.2 获取商品列表

**接口地址**: `product.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| categoryId | string | 否 | 分类ID |
| keyword | string | 否 | 搜索关键词（名称/条码） |
| status | string | 否 | 状态筛选 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        shopId: 'xxx',
        categoryId: 'xxx',
        categoryName: 'iPhone',
        name: 'iPhone 15 Pro Max',
        barcode: '6901234567890',
        spec: '256GB 黑色',
        unit: '台',
        purchasePrice: 8999,
        salePrice: 9999,
        memberPrice: 9599,
        stock: 50,
        warningStock: 10,
        image: 'https://...',
        status: 'on_sale',
        createTime: 1680000000000
      }
    ],
    total: 200
  }
}
```

---

### 4.3 获取商品详情

**接口地址**: `product.getDetail`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 商品ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    shopId: 'xxx',
    categoryId: 'xxx',
    name: 'iPhone 15 Pro Max',
    barcode: '6901234567890',
    spec: '256GB 黑色',
    unit: '台',
    brand: 'Apple',
    purchasePrice: 8999,
    salePrice: 9999,
    memberPrice: 9599,
    stock: 50,
    warningStock: 10,
    image: 'https://...',
    images: ['https://...'],
    description: '商品描述...',
    status: 'on_sale',
    createTime: 1680000000000,
    updateTime: 1680000000000
  }
}
```

---

### 4.4 通过条码搜索商品

**接口地址**: `product.getByBarcode`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| barcode | string | 是 | 商品条码 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    name: 'iPhone 15 Pro Max',
    barcode: '6901234567890',
    spec: '256GB 黑色',
    salePrice: 9999,
    memberPrice: 9599,
    stock: 50
  }
}
```

---

### 4.5 创建商品

**接口地址**: `product.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| categoryId | string | 是 | 分类ID |
| name | string | 是 | 商品名称 |
| barcode | string | 否 | 商品条码 |
| spec | string | 否 | 规格型号 |
| unit | string | 否 | 计量单位 |
| purchasePrice | number | 是 | 进货价 |
| salePrice | number | 是 | 销售价 |
| memberPrice | number | 否 | 会员价 |
| warningStock | number | 否 | 预警库存 |
| image | string | 否 | 商品图片 |
| description | string | 否 | 商品描述 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx'
  }
}
```

---

### 4.6 更新商品

**接口地址**: `product.update`

**请求方式**: PUT

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 商品ID |
| categoryId | string | 否 | 分类ID |
| name | string | 否 | 商品名称 |
| barcode | string | 否 | 商品条码 |
| spec | string | 否 | 规格型号 |
| purchasePrice | number | 否 | 进货价 |
| salePrice | number | 否 | 销售价 |
| memberPrice | number | 否 | 会员价 |
| warningStock | number | 否 | 预警库存 |
| status | string | 否 | 状态 |

**响应数据**:

```typescript
{
  code: 0,
  message: '更新成功'
}
```

---

### 4.7 批量导入商品

**接口地址**: `product.batchImport`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| products | array | 是 | 商品数组 |

**响应数据**:

```typescript
{
  code: 0,
  message: '导入成功',
  data: {
    successCount: 50,
    failCount: 2,
    failList: [
      {
        index: 10,
        name: '商品名称',
        reason: '条码已存在'
      }
    ]
  }
}
```

---

## 5. 库存管理模块

### 5.1 获取入库单列表

**接口地址**: `stockIn.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| status | string | 否 | 状态筛选 |
| startDate | number | 否 | 开始时间 |
| endDate | number | 否 | 结束时间 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        shopId: 'xxx',
        orderNo: 'SI202404140001',
        supplierId: 'xxx',
        supplierName: '供应商A',
        totalQuantity: 100,
        totalAmount: 50000,
        status: 'completed',
        operatorName: '张三',
        createTime: 1680000000000
      }
    ],
    total: 100
  }
}
```

---

### 5.2 创建入库单

**接口地址**: `stockIn.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| supplierId | string | 否 | 供应商ID |
| items | array | 是 | 商品明细 |
| remark | string | 否 | 备注 |

**item对象**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| productId | string | 是 | 商品ID |
| productName | string | 是 | 商品名称 |
| barcode | string | 否 | 商品条码 |
| quantity | number | 是 | 数量 |
| price | number | 是 | 单价 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx',
    orderNo: 'SI202404140001'
  }
}
```

---

### 5.3 审核入库单

**接口地址**: `stockIn.audit`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 入库单ID |
| status | string | 是 | 审核结果：completed-通过，cancelled-拒绝 |
| remark | string | 否 | 审核备注 |

**响应数据**:

```typescript
{
  code: 0,
  message: '审核成功'
}
```

---

### 5.4 获取库存变动记录

**接口地址**: `inventory.getRecords`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| productId | string | 否 | 商品ID |
| type | string | 否 | 变动类型 |
| startDate | number | 否 | 开始时间 |
| endDate | number | 否 | 结束时间 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        productId: 'xxx',
        productName: 'iPhone 15 Pro Max',
        barcode: '6901234567890',
        type: 'in',
        quantity: 50,
        beforeStock: 0,
        afterStock: 50,
        relatedNo: 'SI202404140001',
        operatorName: '张三',
        createTime: 1680000000000
      }
    ],
    total: 500
  }
}
```

---

### 5.5 创建盘点单

**接口地址**: `check.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| title | string | 是 | 盘点标题 |
| categoryId | string | 否 | 盘点分类 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx',
    orderNo: 'PC202404140001'
  }
}
```

---

### 5.6 提交盘点结果

**接口地址**: `check.submit`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 盘点单ID |
| items | array | 是 | 盘点明细 |

**item对象**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| productId | string | 是 | 商品ID |
| systemStock | number | 是 | 系统库存 |
| actualStock | number | 是 | 实盘库存 |

**响应数据**:

```typescript
{
  code: 0,
  message: '提交成功'
}
```

---

## 6. 销售管理模块

### 6.1 创建销售订单

**接口地址**: `sales.createOrder`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| memberId | string | 否 | 会员ID |
| items | array | 是 | 商品明细 |
| totalAmount | number | 是 | 商品总额 |
| discountAmount | number | 否 | 优惠金额 |
| actualAmount | number | 是 | 实付金额 |
| paymentMethod | string | 是 | 支付方式 |
| paymentDetails | object | 否 | 混合支付详情 |
| remark | string | 否 | 备注 |

**item对象**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| productId | string | 是 | 商品ID |
| productName | string | 是 | 商品名称 |
| barcode | string | 否 | 商品条码 |
| spec | string | 否 | 规格 |
| quantity | number | 是 | 数量 |
| price | number | 是 | 单价 |
| totalPrice | number | 是 | 小计 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    orderId: 'xxx',
    orderNo: 'SL202404140001'
  }
}
```

---

### 6.2 获取销售订单列表

**接口地址**: `sales.getOrderList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| status | string | 否 | 状态筛选 |
| startDate | number | 否 | 开始时间 |
| endDate | number | 否 | 结束时间 |
| cashierId | string | 否 | 收银员ID |
| keyword | string | 否 | 搜索关键词（订单号/会员手机号） |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        orderNo: 'SL202404140001',
        memberName: '李四',
        memberPhone: '13800138000',
        totalAmount: 9999,
        actualAmount: 9999,
        paymentMethod: 'wechat',
        status: 'completed',
        cashierName: '张三',
        createTime: 1680000000000
      }
    ],
    total: 500
  }
}
```

---

### 6.3 获取销售订单详情

**接口地址**: `sales.getOrderDetail`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 订单ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    orderNo: 'SL202404140001',
    shopId: 'xxx',
    memberId: 'xxx',
    memberName: '李四',
    memberPhone: '13800138000',
    items: [
      {
        productId: 'xxx',
        productName: 'iPhone 15 Pro Max',
        barcode: '6901234567890',
        spec: '256GB 黑色',
        quantity: 1,
        price: 9999,
        totalPrice: 9999
      }
    ],
    totalAmount: 9999,
    discountAmount: 0,
    actualAmount: 9999,
    paymentMethod: 'wechat',
    status: 'completed',
    cashierName: '张三',
    payTime: 1680000000000,
    createTime: 1680000000000
  }
}
```

---

### 6.4 创建销售退货

**接口地址**: `sales.createReturn`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| orderId | string | 是 | 原订单ID |
| items | array | 是 | 退货商品明细 |
| reason | string | 是 | 退货原因 |
| refundMethod | string | 是 | 退款方式 |
| remark | string | 否 | 备注 |

**item对象**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| productId | string | 是 | 商品ID |
| productName | string | 是 | 商品名称 |
| quantity | number | 是 | 退货数量 |
| price | number | 是 | 单价 |
| totalPrice | number | 是 | 退款金额 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    returnId: 'xxx',
    returnNo: 'SR202404140001'
  }
}
```

---

### 6.5 审核销售退货

**接口地址**: `sales.auditReturn`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 退货单ID |
| status | string | 是 | 审核结果：completed-通过，rejected-拒绝 |
| remark | string | 否 | 审核备注 |

**响应数据**:

```typescript
{
  code: 0,
  message: '审核成功'
}
```

---

## 7. 会员管理模块

### 7.1 获取会员列表

**接口地址**: `member.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| levelId | string | 否 | 等级筛选 |
| keyword | string | 否 | 搜索关键词（姓名/手机号/会员号） |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        memberNo: 'M202404140001',
        name: '李四',
        phone: '13800138000',
        levelId: 'xxx',
        levelName: 'VIP会员',
        points: 1000,
        balance: 500,
        totalConsumeAmount: 10000,
        status: 'active',
        createTime: 1680000000000
      }
    ],
    total: 1000
  }
}
```

---

### 7.2 通过手机号获取会员

**接口地址**: `member.getByPhone`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| phone | string | 是 | 手机号 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    _id: 'xxx',
    memberNo: 'M202404140001',
    name: '李四',
    phone: '13800138000',
    levelId: 'xxx',
    levelName: 'VIP会员',
    discount: 0.95,
    points: 1000,
    balance: 500
  }
}
```

---

### 7.3 创建会员

**接口地址**: `member.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| name | string | 是 | 会员姓名 |
| phone | string | 是 | 手机号 |
| gender | string | 否 | 性别 |
| birthday | number | 否 | 生日 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx',
    memberNo: 'M202404140001'
  }
}
```

---

### 7.4 会员充值

**接口地址**: `member.recharge`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| memberId | string | 是 | 会员ID |
| amount | number | 是 | 充值金额 |
| paymentMethod | string | 是 | 支付方式 |
| remark | string | 否 | 备注 |

**响应数据**:

```typescript
{
  code: 0,
  message: '充值成功',
  data: {
    beforeBalance: 500,
    rechargeAmount: 1000,
    afterBalance: 1500
  }
}
```

---

## 8. 统计报表模块

### 8.1 获取工作台统计数据

**接口地址**: `stats.getDashboard`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    today: {
      salesAmount: 50000,
      orderCount: 50,
      memberCount: 10
    },
    week: {
      salesAmount: 350000,
      orderCount: 350,
      memberCount: 70
    },
    month: {
      salesAmount: 1500000,
      orderCount: 1500,
      memberCount: 300
    },
    salesTrend: [
      {
        date: '2024-04-01',
        amount: 10000
      }
    ],
    topProducts: [
      {
        productName: 'iPhone 15 Pro Max',
        salesQuantity: 100,
        salesAmount: 999900
      }
    ],
    lowStockProducts: [
      {
        productName: 'iPhone 15',
        stock: 5,
        warningStock: 10
      }
    ]
  }
}
```

---

### 8.2 获取销售统计

**接口地址**: `stats.getSalesStats`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| startDate | number | 是 | 开始时间 |
| endDate | number | 是 | 结束时间 |
| groupBy | string | 否 | 分组方式：day/week/month |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    total: {
      salesAmount: 1000000,
      orderCount: 1000,
      productCount: 500,
      averagePrice: 1000
    },
    list: [
      {
        date: '2024-04-01',
        salesAmount: 50000,
        orderCount: 50
      }
    ],
    paymentMethodStats: [
      {
        paymentMethod: 'wechat',
        amount: 500000,
        count: 500
      }
    ],
    cashierStats: [
      {
        cashierName: '张三',
        salesAmount: 300000,
        orderCount: 300
      }
    ]
  }
}
```

---

### 8.3 获取库存统计

**接口地址**: `stats.getInventoryStats`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    totalProducts: 500,
    totalStock: 5000,
    totalValue: 2000000,
    lowStockCount: 50,
    categoryStats: [
      {
        categoryName: 'iPhone',
        productCount: 100,
        stock: 1000,
        value: 1000000
      }
    ]
  }
}
```

---

## 9. 供应商管理模块

### 9.1 获取供应商列表

**接口地址**: `supplier.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        name: '供应商A',
        contact: '王五',
        phone: '13900139000',
        status: 'active',
        createTime: 1680000000000
      }
    ],
    total: 50
  }
}
```

---

### 9.2 创建供应商

**接口地址**: `supplier.create`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| name | string | 是 | 供应商名称 |
| contact | string | 否 | 联系人 |
| phone | string | 否 | 联系电话 |
| address | string | 否 | 地址 |
| remark | string | 否 | 备注 |

**响应数据**:

```typescript
{
  code: 0,
  message: '创建成功',
  data: {
    id: 'xxx'
  }
}
```

---

### 9.3 更新供应商

**接口地址**: `supplier.update`

**请求方式**: PUT

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| id | string | 是 | 供应商ID |
| name | string | 否 | 供应商名称 |
| contact | string | 否 | 联系人 |
| phone | string | 否 | 联系电话 |
| address | string | 否 | 地址 |
| status | string | 否 | 状态 |

**响应数据**:

```typescript
{
  code: 0,
  message: '更新成功'
}
```

---

## 10. 操作日志模块

### 10.1 获取操作日志列表

**接口地址**: `log.getList`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|-----|------|
| shopId | string | 是 | 店铺ID |
| userId | string | 否 | 用户ID |
| module | string | 否 | 模块筛选 |
| action | string | 否 | 动作筛选 |
| status | string | 否 | 状态筛选 |
| startDate | number | 否 | 开始时间 |
| endDate | number | 否 | 结束时间 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |

**响应数据**:

```typescript
{
  code: 0,
  message: '获取成功',
  data: {
    list: [
      {
        _id: 'xxx',
        userId: 'xxx',
        username: 'admin',
        realName: '管理员',
        module: 'product',
        action: 'create',
        description: '创建商品iPhone 15 Pro Max',
        status: 'success',
        createTime: 1680000000000
      }
    ],
    total: 10000
  }
}
```

---

## 附录：枚举值定义

### 用户角色 (role)

| 值 | 说明 |
|-----|------|
| super_admin | 超级管理员 |
| shop_admin | 店铺管理员 |
| cashier | 收银员 |
| warehouse | 仓库管理员 |

### 状态 (status) - 通用

| 值 | 说明 |
|-----|------|
| active | 正常/启用 |
| disabled | 禁用 |

### 商品状态 (product.status)

| 值 | 说明 |
|-----|------|
| on_sale | 在售 |
| off_sale | 下架 |

### 入库单状态 (stock_in_order.status)

| 值 | 说明 |
|-----|------|
| draft | 草稿 |
| pending | 待审核 |
| completed | 已完成 |
| cancelled | 已取消 |

### 库存变动类型 (inventory_record.type)

| 值 | 说明 |
|-----|------|
| in | 入库 |
| out | 出库 |
| check | 盘点 |
| transfer | 调拨 |
| adjust | 调整 |

### 销售订单状态 (sales_order.status)

| 值 | 说明 |
|-----|------|
| pending | 待支付 |
| completed | 已完成 |
| cancelled | 已取消 |
| refunded | 已退款 |

### 支付方式 (paymentMethod)

| 值 | 说明 |
|-----|------|
| cash | 现金 |
| wechat | 微信支付 |
| alipay | 支付宝 |
| card | 刷卡 |
| mixed | 混合支付 |

### 销售退货状态 (sales_return.status)

| 值 | 说明 |
|-----|------|
| pending | 待审核 |
| completed | 已完成 |
| rejected | 已拒绝 |
