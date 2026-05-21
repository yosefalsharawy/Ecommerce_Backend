const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utilites/appError.uti');

exports.authanticate = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return next(new AppError('unauthorized, no token provided!', 401));
	}
	const token = authHeader.split(' ')[1];
	const decode = jwt.verify(token, process.env.SECRET_KEY);
	const myUser = await User.findById(decode.id).select('-password');
	if (!myUser) {
		return next(new AppError('unauthorized', 401));
	}
	req.user = myUser;
	next();
};
