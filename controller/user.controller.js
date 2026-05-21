const User = require('../models/user.model');
const catchAsync = require('../utilites/catchAsync.uti');
const { logger } = require('../utilites/logger.uti');
const AppError = require('../utilites/appError.uti');

exports.getUser = catchAsync(async (req, res) => {
	logger.info('users listed!');
	res.status(200).json({
		message: 'User list',
		...res.paginatedResult,
	});
});


