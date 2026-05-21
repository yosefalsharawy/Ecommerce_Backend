const AppError = require('../utilites/appError.uti');

exports.authorized = (...allowedRules) => {
	return (req, res, next) => {
		if (!allowedRules.includes(req.user.role)) {
			return next(new AppError('Access denied!', 403));
		}
		next();
	};
};
