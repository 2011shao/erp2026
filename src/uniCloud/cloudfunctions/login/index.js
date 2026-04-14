'use strict';
const uniID = require('uni-id')

exports.main = async (event, context) => {
  const { username, password } = event
  
  try {
    const res = await uniID.login({
      username,
      password
    })
    
    return {
      code: 0,
      message: '登录成功',
      data: res
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message || '登录失败',
      data: null
    }
  }
};