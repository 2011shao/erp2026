# 数据库设计文档

## 数据库表清单

| 表名 | 说明 | 备注 |
|-----|------|------|
| shop | 店铺表 | 存储店铺基本信息 |
| user | 用户表 | 存储系统用户信息 |
| category | 商品分类表 | 商品分类数据 |
| product | 商品表 | 商品档案信息 |
| supplier | 供应商表 | 供应商信息 |
| stock_in_order | 入库单表 | 商品入库记录 |
| stock_out_order | 出库单表 | 商品出库记录 |
| inventory_record | 库存变动记录表 | 库存流水记录 |
| check_order | 盘点单表 | 库存盘点记录 |
| sales_order | 销售订单表 | 销售订单记录 |
| sales_return | 销售退货表 | 退货记录 |
| member | 会员表 | 会员信息 |
| member_level | 会员等级表 | 会员等级配置 |
| member_points_log | 会员积分记录表 | 积分变动记录 |
| income_expense | 收支记录表 | 财务收支记录 |
| operation_log | 操作日志表 | 系统操作记录 |

## 详细表结构

### 1. 店铺表 (shop)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| name | String | 是 | - | 店铺名称 |
| address | String | 否 | - | 店铺地址 |
| phone | String | 否 | - | 联系电话 |
| contact | String | 否 | - | 联系人 |
| status | String | 是 | active | 状态：active-正常，disabled-禁用 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 2. 用户表 (user)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| username | String | 是 | - | 用户名 |
| password | String | 是 | - | 密码（加密存储） |
| realName | String | 否 | - | 真实姓名 |
| avatar | String | 否 | - | 头像URL |
| phone | String | 否 | - | 手机号 |
| email | String | 否 | - | 邮箱 |
| role | String | 是 | - | 角色：super_admin/shop_admin/cashier/warehouse |
| permissions | Array | 否 | [] | 权限列表 |
| status | String | 是 | active | 状态：active-正常，disabled-禁用 |
| lastLoginTime | Timestamp | 否 | - | 最后登录时间 |
| lastLoginIp | String | 否 | - | 最后登录IP |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `username` - 用户名唯一索引
- `role` - 角色索引
- `status` - 状态索引

---

### 3. 商品分类表 (category)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| parentId | String | 否 | - | 父分类ID，顶级分类为空 |
| name | String | 是 | - | 分类名称 |
| icon | String | 否 | - | 分类图标 |
| sort | Number | 是 | 0 | 排序号，数字越小越靠前 |
| status | String | 是 | active | 状态：active-启用，disabled-禁用 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `parentId` - 父分类索引
- `sort` - 排序索引

---

### 4. 商品表 (product)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| categoryId | String | 是 | - | 分类ID |
| name | String | 是 | - | 商品名称 |
| barcode | String | 否 | - | 商品条码 |
| spec | String | 否 | - | 规格型号 |
| unit | String | 是 | 台 | 计量单位 |
| brand | String | 否 | - | 品牌 |
| model | String | 否 | - | 型号 |
| color | String | 否 | - | 颜色 |
| purchasePrice | Decimal | 是 | 0 | 进货价 |
| salePrice | Decimal | 是 | 0 | 销售价 |
| memberPrice | Decimal | 否 | 0 | 会员价 |
| costPrice | Decimal | 否 | 0 | 成本价 |
| stock | Number | 是 | 0 | 当前库存 |
| warningStock | Number | 是 | 10 | 预警库存 |
| image | String | 否 | - | 商品主图 |
| images | Array | 否 | [] | 商品图片列表 |
| description | String | 否 | - | 商品描述 |
| status | String | 是 | on_sale | 状态：on_sale-在售，off_sale-下架 |
| isHot | Boolean | 否 | false | 是否热销 |
| isRecommend | Boolean | 否 | false | 是否推荐 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `categoryId` - 分类索引
- `barcode` - 条码索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 5. 供应商表 (supplier)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| name | String | 是 | - | 供应商名称 |
| contact | String | 否 | - | 联系人 |
| phone | String | 否 | - | 联系电话 |
| address | String | 否 | - | 地址 |
| email | String | 否 | - | 邮箱 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | active | 状态：active-正常，disabled-禁用 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `status` - 状态索引

---

### 6. 入库单表 (stock_in_order)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| orderNo | String | 是 | - | 入库单号 |
| supplierId | String | 否 | - | 供应商ID |
| supplierName | String | 否 | - | 供应商名称（冗余） |
| items | Array | 是 | [] | 入库商品明细 |
| totalQuantity | Number | 是 | 0 | 总数量 |
| totalAmount | Decimal | 是 | 0 | 总金额 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | draft | 状态：draft-草稿，pending-待审核，completed-已完成，cancelled-已取消 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| auditorId | String | 否 | - | 审核人ID |
| auditorName | String | 否 | - | 审核人姓名 |
| auditTime | Timestamp | 否 | - | 审核时间 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `orderNo` - 单号唯一索引
- `supplierId` - 供应商索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 7. 出库单表 (stock_out_order)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| orderNo | String | 是 | - | 出库单号 |
| type | String | 是 | - | 出库类型：sale-销售出库，transfer-调拨出库，other-其他 |
| items | Array | 是 | [] | 出库商品明细 |
| totalQuantity | Number | 是 | 0 | 总数量 |
| totalAmount | Decimal | 是 | 0 | 总金额 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | draft | 状态：draft-草稿，pending-待审核，completed-已完成，cancelled-已取消 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| auditorId | String | 否 | - | 审核人ID |
| auditorName | String | 否 | - | 审核人姓名 |
| auditTime | Timestamp | 否 | - | 审核时间 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `orderNo` - 单号唯一索引
- `type` - 类型索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 8. 库存变动记录表 (inventory_record)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| productId | String | 是 | - | 商品ID |
| productName | String | 是 | - | 商品名称 |
| barcode | String | 否 | - | 商品条码 |
| type | String | 是 | - | 变动类型：in-入库，out-出库，check-盘点，transfer-调拨，adjust-调整 |
| quantity | Number | 是 | 0 | 变动数量（正数增加，负数减少） |
| beforeStock | Number | 是 | 0 | 变动前库存 |
| afterStock | Number | 是 | 0 | 变动后库存 |
| relatedType | String | 否 | - | 关联单据类型 |
| relatedId | String | 否 | - | 关联单据ID |
| relatedNo | String | 否 | - | 关联单据号 |
| remark | String | 否 | - | 备注 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `productId` - 商品ID索引
- `type` - 变动类型索引
- `createTime` - 创建时间索引

---

### 9. 盘点单表 (check_order)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| orderNo | String | 是 | - | 盘点单号 |
| title | String | 是 | - | 盘点标题 |
| categoryId | String | 否 | - | 盘点分类（为空表示全部） |
| items | Array | 是 | [] | 盘点明细 |
| totalProductCount | Number | 是 | 0 | 商品总数 |
| diffProductCount | Number | 是 | 0 | 差异商品数 |
| diffQuantity | Number | 是 | 0 | 差异总数量 |
| diffAmount | Decimal | 是 | 0 | 差异总金额 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | draft | 状态：draft-草稿，pending-盘点中，completed-已完成 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| checkTime | Timestamp | 否 | - | 盘点完成时间 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `orderNo` - 单号唯一索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 10. 销售订单表 (sales_order)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| orderNo | String | 是 | - | 订单号 |
| memberId | String | 否 | - | 会员ID |
| memberName | String | 否 | - | 会员姓名 |
| memberPhone | String | 否 | - | 会员手机号 |
| items | Array | 是 | [] | 订单商品明细 |
| totalQuantity | Number | 是 | 0 | 商品总数量 |
| totalAmount | Decimal | 是 | 0 | 商品总额 |
| discountAmount | Decimal | 是 | 0 | 优惠金额 |
| actualAmount | Decimal | 是 | 0 | 实付金额 |
| paymentMethod | String | 是 | - | 支付方式：cash/wechat/alipay/card/mixed |
| paymentDetails | Object | 否 | {} | 混合支付详情 |
| changeAmount | Decimal | 否 | 0 | 找零金额 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | pending | 状态：pending-待支付，completed-已完成，cancelled-已取消，refunded-已退款 |
| cashierId | String | 是 | - | 收银员ID |
| cashierName | String | 否 | - | 收银员姓名 |
| payTime | Timestamp | 否 | - | 支付时间 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `orderNo` - 订单号唯一索引
- `memberId` - 会员索引
- `status` - 状态索引
- `cashierId` - 收银员索引
- `createTime` - 创建时间索引

---

### 11. 销售退货表 (sales_return)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| returnNo | String | 是 | - | 退货单号 |
| orderId | String | 是 | - | 原订单ID |
| orderNo | String | 是 | - | 原订单号 |
| memberId | String | 否 | - | 会员ID |
| items | Array | 是 | [] | 退货商品明细 |
| totalQuantity | Number | 是 | 0 | 退货总数量 |
| totalAmount | Decimal | 是 | 0 | 退货总金额 |
| refundAmount | Decimal | 是 | 0 | 退款金额 |
| refundMethod | String | 是 | - | 退款方式：原路退回/现金 |
| reason | String | 否 | - | 退货原因 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | pending | 状态：pending-待审核，completed-已完成，rejected-已拒绝 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| auditorId | String | 否 | - | 审核人ID |
| auditorName | String | 否 | - | 审核人姓名 |
| auditTime | Timestamp | 否 | - | 审核时间 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `returnNo` - 退货单号唯一索引
- `orderId` - 原订单索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 12. 会员表 (member)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| memberNo | String | 是 | - | 会员号 |
| name | String | 是 | - | 会员姓名 |
| phone | String | 是 | - | 手机号 |
| gender | String | 否 | - | 性别：male/female |
| birthday | Date | 否 | - | 生日 |
| avatar | String | 否 | - | 头像 |
| levelId | String | 是 | - | 等级ID |
| levelName | String | 是 | - | 等级名称 |
| points | Number | 是 | 0 | 当前积分 |
| totalPoints | Number | 是 | 0 | 累计积分 |
| balance | Decimal | 是 | 0 | 储值余额 |
| totalConsumeAmount | Decimal | 是 | 0 | 累计消费金额 |
| totalConsumeCount | Number | 是 | 0 | 累计消费次数 |
| lastConsumeTime | Timestamp | 否 | - | 最后消费时间 |
| remark | String | 否 | - | 备注 |
| status | String | 是 | active | 状态：active-正常，disabled-禁用 |
| createTime | Timestamp | 是 | - | 创建时间 |
| updateTime | Timestamp | 否 | - | 更新时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `memberNo` - 会员号唯一索引
- `phone` - 手机号索引
- `levelId` - 等级索引
- `status` - 状态索引
- `createTime` - 创建时间索引

---

### 13. 会员等级表 (member_level)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| name | String | 是 | - | 等级名称 |
| icon | String | 否 | - | 等级图标 |
| minPoints | Number | 是 | 0 | 最低积分要求 |
| minAmount | Decimal | 是 | 0 | 最低消费金额要求 |
| discount | Decimal | 是 | 1 | 会员折扣（0-1） |
| pointsRate | Number | 是 | 1 | 积分倍率 |
| sort | Number | 是 | 0 | 排序号 |
| privileges | Array | 否 | [] | 特权列表 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `sort` - 排序索引

---

### 14. 会员积分记录表 (member_points_log)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| memberId | String | 是 | - | 会员ID |
| memberName | String | 是 | - | 会员姓名 |
| type | String | 是 | - | 类型：consume-消费获取，exchange-积分兑换，adjust-积分调整，refund-退货扣减 |
| points | Number | 是 | 0 | 变动积分（正数增加，负数减少） |
| beforePoints | Number | 是 | 0 | 变动前积分 |
| afterPoints | Number | 是 | 0 | 变动后积分 |
| relatedType | String | 否 | - | 关联类型 |
| relatedId | String | 否 | - | 关联ID |
| relatedNo | String | 否 | - | 关联单号 |
| remark | String | 否 | - | 备注 |
| operatorId | String | 否 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `memberId` - 会员ID索引
- `type` - 类型索引
- `createTime` - 创建时间索引

---

### 15. 收支记录表 (income_expense)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| type | String | 是 | - | 类型：income-收入，expense-支出 |
| category | String | 是 | - | 收支分类 |
| amount | Decimal | 是 | 0 | 金额 |
| account | String | 否 | - | 账户 |
| relatedType | String | 否 | - | 关联类型 |
| relatedId | String | 否 | - | 关联ID |
| relatedNo | String | 否 | - | 关联单号 |
| remark | String | 否 | - | 备注 |
| operatorId | String | 是 | - | 操作员ID |
| operatorName | String | 否 | - | 操作员姓名 |
| recordTime | Timestamp | 是 | - | 记账时间 |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `type` - 类型索引
- `category` - 分类索引
- `recordTime` - 记账时间索引

---

### 16. 操作日志表 (operation_log)

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|-------|-----|-----|--------|------|
| _id | String | 是 | - | 主键ID |
| shopId | String | 是 | - | 所属店铺ID |
| userId | String | 是 | - | 用户ID |
| username | String | 是 | - | 用户名 |
| realName | String | 否 | - | 真实姓名 |
| module | String | 是 | - | 操作模块 |
| action | String | 是 | - | 操作动作 |
| description | String | 否 | - | 操作描述 |
| requestData | Object | 否 | {} | 请求数据 |
| responseData | Object | 否 | {} | 响应数据 |
| ip | String | 否 | - | 操作IP |
| userAgent | String | 否 | - | 用户代理 |
| status | String | 是 | success | 状态：success-成功，fail-失败 |
| errorMessage | String | 否 | - | 错误信息 |
| duration | Number | 否 | 0 | 耗时（毫秒） |
| createTime | Timestamp | 是 | - | 创建时间 |

**索引建议**：
- `shopId` - 店铺ID索引
- `userId` - 用户ID索引
- `module` - 模块索引
- `action` - 动作索引
- `status` - 状态索引
- `createTime` - 创建时间索引

## 编号规则

### 单据编号规则

| 单据类型 | 前缀 | 格式 | 示例 |
|---------|------|------|------|
| 入库单 | SI | SI+年月日+4位序号 | SI202404140001 |
| 出库单 | SO | SO+年月日+4位序号 | SO202404140001 |
| 盘点单 | PC | PC+年月日+4位序号 | PC202404140001 |
| 销售订单 | SL | SL+年月日+4位序号 | SL202404140001 |
| 销售退货 | SR | SR+年月日+4位序号 | SR202404140001 |
| 会员号 | M | M+年月日+4位序号 | M202404140001 |

### 编号生成逻辑

```javascript
function generateOrderNo(prefix, shopId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const todayPrefix = `${prefix}${dateStr}`;
  
  // 查询今日最大序号
  // ...
  
  const sequence = String(maxSequence + 1).padStart(4, '0');
  
  return `${todayPrefix}${sequence}`;
}
```
