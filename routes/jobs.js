const express = require('express')

const router = express.Router()      // 从controlled中取函数
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats,
} = require('../controllers/jobs')

router.route('/').post(createJob).get(getAllJobs)
router.route('/stats').get(showStats)
router.route('/:id').get(getJob).delete(deleteJob).patch(updateJob)

module.exports = router
