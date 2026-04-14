'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const { shopId, userId, role } = context.CLIENT_CONTEXT || {};

  switch (action) {
    case 'getUserList':
      return await getUserList(shopId, data);
    case 'getUserDetail':
      return await getUserDetail(data.userId);
    case 'createUser':
      return await createUser(shopId, role, data);
    case 'updateUser':
      return await updateUser(shopId, role, data);
    case 'deleteUser':
      return await deleteUser(shopId, role, data.userId);
    case 'updateUserStatus':
      return await updateUserStatus(shopId, role, data);
    default:
      return {
        code: -1,
        message: '未知操作'
      };
  }
};

async function getUserList(shopId, params) {
  try {
    const { page = 1, pageSize = 20, keyword = '', status = '' } = params;
    
    let query = db.collection('user');
    
    if (shopId && role !== 'super_admin') {
      query = query.where({ shopId });
    }
    
    if (keyword) {
      query = query.where({
        username: new RegExp(keyword)
      });
    }
    
    if (status) {
      query = query.where({ status });
    }
    
    const result = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    const countResult = await query.count();
    
    return {
      code: 0,
      message: '查询成功',
      data: {
        list: result.data,
        total: countResult.total
      }
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '查询失败'
    };
  }
}

async function getUserDetail(userId) {
  try {
    const result = await db.collection('user').doc(userId).get();
    
    if (result.data.length === 0) {
      return {
        code: 1,
        message: '用户不存在'
      };
    }
    
    return {
      code: 0,
      message: '查询成功',
      data: result.data[0]
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '查询失败'
    };
  }
}

async function createUser(shopId, currentRole, data) {
  try {
    if (currentRole !== 'super_admin' && currentRole !== 'shop_admin') {
      return {
        code: 1,
        message: '权限不足'
      };
    }
    
    const collection = db.collection('user');
    
    const existingUser = await collection.where({ username: data.username }).get();
    if (existingUser.data.length > 0) {
      return {
        code: 1,
        message: '用户名已存在'
      };
    }
    
    const userData = {
      shopId: data.shopId || shopId,
      username: data.username,
      password: data.password,
      realName: data.realName || '',
      role: data.role,
      permissions: data.permissions || [],
      status: data.status || 'active',
      createTime: Date.now()
    };
    
    const result = await collection.add(userData);
    
    return {
      code: 0,
      message: '创建成功',
      data: { userId: result.id }
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '创建失败'
    };
  }
}

async function updateUser(shopId, currentRole, data) {
  try {
    if (currentRole !== 'super_admin' && currentRole !== 'shop_admin') {
      return {
        code: 1,
        message: '权限不足'
      };
    }
    
    const collection = db.collection('user');
    
    const updateData = {};
    if (data.realName !== undefined) updateData.realName = data.realName;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.password !== undefined) updateData.password = data.password;
    updateData.updateTime = Date.now();
    
    await collection.doc(data.userId).update(updateData);
    
    return {
      code: 0,
      message: '更新成功'
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '更新失败'
    };
  }
}

async function deleteUser(shopId, currentRole, userId) {
  try {
    if (currentRole !== 'super_admin' && currentRole !== 'shop_admin') {
      return {
        code: 1,
        message: '权限不足'
      };
    }
    
    await db.collection('user').doc(userId).remove();
    
    return {
      code: 0,
      message: '删除成功'
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '删除失败'
    };
  }
}

async function updateUserStatus(shopId, currentRole, data) {
  try {
    if (currentRole !== 'super_admin' && currentRole !== 'shop_admin') {
      return {
        code: 1,
        message: '权限不足'
      };
    }
    
    await db.collection('user').doc(data.userId).update({
      status: data.status,
      updateTime: Date.now()
    });
    
    return {
      code: 0,
      message: '状态更新成功'
    };
  } catch (error) {
    return {
      code: 1,
      message: error.message || '状态更新失败'
    };
  }
}
