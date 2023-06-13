// With dotenv, you can define environment variables in a .env file, 
// and then use the process.env object in your nodejs code to access those values.
require('dotenv').config();
// a middleware for Express applications that simplifies error handling 
// for asynchronous routes and middleware functions, without needing to write try ... catch ...
require('express-async-errors');

// extra security packages
const helmet = require('helmet');
const xss = require('xss-clean');

const express = require('express');
const app = express();
const path = require('path');
const connectDB = require('./db/connect');    // 连接数据库

// 用来验证用户来进一步access job routes的middleware:
const authenticateUser = require('./middleware/authentication');
// routers
const authRouter = require('./routes/auth'); 
const jobsRouter = require('./routes/jobs');
// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);

// 连接前端
app.use(express.static(path.resolve(__dirname, './client/build')));  
// 为什么会出现build文件，因为已经是production ready application
// we can create build folder by running "npm run build"
/* client文件夹就是我们的前端project 'jobster', 只不过这里改变了：
const customFetch = axios.create({
  baseURL: '/api/v1',
});   */



app.use(express.json());

// extra security packages的调用
app.use(helmet());
app.use(xss());



// routes
app.use('/api/v1/auth', authRouter);    // 完整路径是domain/api/v1/auth/login或register
app.use('/api/v1/jobs', authenticateUser, jobsRouter);   // 完整路径是domain/api/v1/jobs/...；加middleware来验证user

// serve index.html, 之后由前端的react接管
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);     // 连接数据库
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
