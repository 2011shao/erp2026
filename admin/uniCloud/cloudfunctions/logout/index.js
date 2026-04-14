'use strict';
const uniID = require('uni-id')

exports.main = async (event, context) => {
  const { token } = event
  
  try {
    const res = await uniID.logout({
      token
    })
    
    return {
      code: 0,
      message: '登出成功',
      data: res
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message || '登出失败',
      data: null
    }
  }
};