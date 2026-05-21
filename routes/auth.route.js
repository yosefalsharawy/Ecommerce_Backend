const express = require('express');
const router = express.Router();
const { login, addUser } = require('../controller/auth.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');

router.post('/login', login);
router.post('/signup', addUser('user'));
router.post(
	'/createadmin',
	authanticate,
	authorized('admin'),
	addUser('admin'),
);

module.exports = router;
