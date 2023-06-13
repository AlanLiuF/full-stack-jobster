// 这是用来authenticate login/register界面里生成的token的，如果验证成功就能访问job
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')

const auth = async (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new UnauthenticatedError('Authentication invalid')
  }
  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)   // payload就是jwt.sign里的第一个参数
    // attach the user to the job routes
    req.user = { userId: payload.userId, name: payload.name }     // 取出payload里的参数
    next()    // 这样才能顺利进入job route
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid')
  }
}

/* 怎样验证这个auth是否设立成功了？去postman send一个register的post request, 记录下来send back的token,
   之后把createJob调整成这样(为了send back user):
   const createJob = async (req, res) => {
    res.json(req.user)
   }
   之后建立一个createJob的post request, 在Header里添加: {key:Authorization, value:Bearer token_code}，
   点击send, 看看会不会显示 {
    "userId": "6487277b3b04163774c248f2",
    "name": "dave"
   } 显示了就说明对了
*/

module.exports = auth
