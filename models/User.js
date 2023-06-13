const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')      // 用来hash password: 万一有人闯进了DB, 看见的也只是hash过的valu
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({      // 建立user schema
  name: {
    type: String,
    required: [true, 'Please provide name'],
    maxlength: 50,
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    match: [
      // 邮箱的输入必须符合特定的pattern
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email',
    ], 
    unique: true,     // unique index
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 20,
    default: 'lastName',
  },
  location: {
    type: String,
    trim: true,
    maxlength: 20,
    default: 'my city',
  },
})


// 用来hash password的
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10)         // 用salt来hash生成random complex pw
  this.password = await bcrypt.hash(this.password, salt)
})


// Mongoose自带的instance method (和schema有关的函数可以封装起来)
// 用来generate token的函数
UserSchema.methods.createJWT = function () {     // createJWT这个名字是我自己定义的
  return jwt.sign(
    { userId: this._id, name: this.name },  // this代指被引文件里的user变量
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  )
}

// 用来login时比较密码的函数(password和encoded pw没法直接比较)
UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password)
  return isMatch
}

module.exports = mongoose.model('User', UserSchema)
