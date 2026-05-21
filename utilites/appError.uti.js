class APPError extends Error {
	constructor(messagee, statusCode) {
		super(messagee);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = APPError;
