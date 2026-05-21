const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utilites/catchAsync.uti');
const APPError = require('../utilites/appError.uti');
const { logger } = require('../utilites/logger.uti');

const signToken = (user) => {
	return jwt.sign(
		{ id: user._id, role: user.role, name: user.name, email: user.email, mobile: user.mobile },
		process.env.SECRET_KEY,
		{ expiresIn: process.env.JWT_EXPIRES_IN },
	);
};

exports.login = catchAsync(async (req, res, next) => {
	const { mobile, password } = req.body;
	const myUser = await User.findOne({ mobile });
	if (myUser && (await myUser.correctpassword(password))) {
		const token = signToken(myUser);
		return res.status(200).json({ message: 'login completed!', token: token });
	}
	next(new APPError('Invalid mobile or Password!', 401));
});

exports.addUser = (role) => {
	return catchAsync(async (req, res) => {
		logger.info('users created!');
		const { name, mobile, password, email, gender, addresses } = req.body;
		const myUser = await User.create({
			name,
			mobile,
			password,
			email,
			gender,
			role,
			addresses,
		});
		myUser.password = undefined;
		const token = signToken(myUser);
		res.status(200).json({ message: 'User created!', token: token });
	});
};
