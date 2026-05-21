const express = require('express');
const router = express.Router();
const { getUser, addUser } = require('../controller/user.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');
const paginate = require('../middlewares/paginate.middleware');
const User = require('../models/user.model');

router.get('/', authanticate, authorized('admin'), paginate(User, '', '-password'), getUser);


module.exports = router;
