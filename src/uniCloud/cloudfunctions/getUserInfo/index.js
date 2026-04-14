'use strict';
const uniID = require('uni-id')

exports.main = async (event, context) => {
  const { token } = event
  
  try {
    const res = await uniID.checkToken({
      token
    })
    
    if (res.code === 0) {
      return {
        code: 0,
        message: '获取用户信息成功',
        data: res
      }
    } else {
      return {
        code: 1,
        message: res.message || '获取用户信息失败',
        data: null
      }
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message || '获取用户信息失败',
      data: null
    }
  }
};