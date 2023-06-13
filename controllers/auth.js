const User = require('../models/User')      // 导入schema
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError } = require('../errors')

const register = async (req, res) => {
  const user = await User.create({ ...req.body })
  /* 在数据库中，被添加的data是这样的:
  _id: ObjectId('727358ejad')
  name: "alan"
  email: "lfz0217@sina.com"
  password: "$2a$10$0EAbIU/7jWnse9Q"
  */

  const token = user.createJWT()    // createJWT里的this就是user
  res.status(StatusCodes.CREATED).json({ 
    user: { 
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
     }, 
  });
};
/* 在postman中，send back的data是这样的:
  {
    "user": {
      "name": "alan"
      "email": ...
      ......
    },
    "token": "eyJhbGciOig3fQ.2ue-Xz4rNdjKg..."
  }
  */




const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password')
  }
  const user = await User.findOne({ email })      // 把user从database里用email来找出
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials')
  }
  const isPasswordCorrect = await user.comparePassword(password)    // instance method
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials')
  }
  // compare password
  const token = user.createJWT()
  res.status(StatusCodes.OK).json({ 
    user: { 
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
     }, 
  });
};


const updateUser = async (req, res) => {
  const { email, name, lastName, location } = req.body;
  if (!email || !name || !lastName || !location) {
    throw new BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  await user.save();
  // 到底是否需要有createJWT这一步呢？
  // 因为name可能变化
  const token = user.createJWT();

  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};

module.exports = {
  register,
  login,
  updateUser,
};
