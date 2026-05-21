const express = require('express');
const router = express.Router();
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');
const { getSalesReport } = require('../controller/reports.controller');

router.get('/sales', authanticate, authorized('admin'), getSalesReport);

module.exports = router;
