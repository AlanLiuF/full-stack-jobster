const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authentication')

// 限制用户尝试登录的次数
const rateLimiter = require('express-rate-limit')
const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,    // 最多10次
    message: {
      msg: 'Too many requests from this IP, please try again after 15 minutes',
    },
});



const { register, login, updateUser } = require('../controllers/auth')
router.post('/register', apiLimiter, register)    // 限制登录次数的middleware
router.post('/login', apiLimiter, login)
router.patch('/updateUser', authenticateUser, updateUser)


module.exports = router
