const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS;

const corsOptions = {
	origin: function (origin, callback) {
		if (!origin) {
			return callback(null, true);
		} else {
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			} else {
				return callback(new Error('cors policy: origin not allowed'), false);
			}
		}
	},
	credential: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	allowedHeaders: ['Content-type', 'Authorization'],
};

module.exports = cors(corsOptions);
