const Job = require('../models/Job')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')
const mongoose = require('mongoose')
const moment = require('moment')



// get method
const getAllJobs = async (req, res) => {
  const {search, status, jobType, sort} = req.query
  const queryObject = {      // 查找筛选都是针对特定user的
    createdBy: req.user.userId   // 后端的逻辑其实不是all the jobs，而是某user下的jobs
  }
  if (search) {     // 如果search栏里用户输入了，就返回filter的结果
    queryObject.position = { $regex: search, $options: 'i'}
  }
  if (status && status !== 'all') {    // 解决status栏输入
    queryObject.status = status;
  }
  if (jobType && jobType !== 'all') {   // 解决jobType栏输入
    queryObject.jobType = jobType;
  }

  let result = Job.find(queryObject)

  // 解决sort栏输入：
  if (sort === 'latest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'oldest') {
    result = result.sort('createdAt');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }
  if (sort === 'z-a') {
    result = result.sort('-position');
  };
  
  const page = Number(req.query.page) || 1;   // if page not provided, then = 1
  const limit = Number(req.query.limit) || 10;   // limit of items per page
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const jobs = await result;

  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages })
}



// get method
const getJob = async (req, res) => {
  const {        // req.user.userId里是用户id, req.params.id是job id
    user: { userId },
    params: { id: jobId },    // job id在params里因为routes是/jobs/:id
  } = req

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}


// post method
const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId     // 从req.user中取出userid, 变成req.body里的新attribute
  const job = await Job.create(req.body)     // 把数据放进schema
  res.status(StatusCodes.CREATED).json({ job })
}



// patch method
const updateJob = async (req, res) => {
  const {
    body: { company, position },    // 还要从req.body中获取user input的要修改成的信息
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },     // find by id
    req.body,       // update into these values
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}



// delete method
const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).send()
}



const showStats = async (req, res) => {
  // 用aggregation pipeline来group by status
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  /* 当我们console.log stats的时候，是这样的:
  [{_id:'declined', count:22},{_id:'interview', count:25},{_id:'pending', count:31}]
  */
  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});
  // 用了reducer之后，stats是这样的：
  // {interview: 25, declined: 22, pending: 31}
  
  const defaultStats = {      // 有了reducer之后的stats，就可以定义defaultStats了
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };
  
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {    // group based on year and month
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },   // -1是descending order
    { $limit: 6 },
  ]);
  /* 如果console.log，得到的是这样的:
  [{_id:{year:2022, month:8}, count:8},
   {_id:{year:2022, month:7}, count:4}
   {......}]   */
  monthlyApplications = monthlyApplications
   .map((item) => {
     const {
       _id: { year, month },
       count,
     } = item;
     const date = moment()
       .month(month - 1)
       .year(year)
       .format('MMM Y');
     return { date, count };
   })
   .reverse();
  /* 这样我们就可以得到这样的格式:
  [{date: 'Aug 2022', count: 8},
   {date: 'Jul 2022', count: 4},
   {......},]     */

  res
    .status(StatusCodes.OK)
    .json({ defaultStats, monthlyApplications});
};




module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
}
