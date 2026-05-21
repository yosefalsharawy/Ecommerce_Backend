const { logger } = require('../utilites/logger.uti');
module.exports = (err, req, res, next) => {
	logger.error(`Error | ${req.method} | ${req.originalUrl} : ${err.message}`, {
		stack: err.stack,
		statusCode: err.statusCode,
	});
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';
	if (process.env.NODE_ENV === 'development') {
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack,
		});
	} else {
		if (err.isOperational) {
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});
		}
	}
	res.status(500).json({
		status: 'error',
		message: 'something went wrong!',
	});
};
