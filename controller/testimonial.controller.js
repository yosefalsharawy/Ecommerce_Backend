const catchAsync = require('../utilites/catchAsync.uti');
const { logger } = require('../utilites/logger.uti');
const APPError = require('../utilites/appError.uti');
const Testimonial = require('../models/testimonial.model');
const User = require('../models/user.model');

exports.addReview = catchAsync(async (req, res, next) => {
	const { comment, stars } = req.body;
	if (!comment || !stars) {
		return next(new APPError('comment and stars are requried', 400));
	}
	const userId = req.user._id;
	const myReview = await Testimonial.create({
		user: userId,
		comment,
		stars,
	});
	logger.info('Review is sent!');
	res.status(201).json({ message: 'Review is sent!', data: myReview });
});

exports.getApprovedTestimonials = catchAsync(async (req, res, next) => {
	const myReview = await Testimonial.find({ status: 'approved' }).populate(
		'user',
		'name',
	);
	logger.info('Reviews are listed!');
	res.status(200).json({ message: 'Reviews are listed!', data: myReview });
});

exports.getAllTestimonials = catchAsync(async (req, res, next) => {
	const myReview = await Testimonial.find().populate('user', 'name');
	logger.info('Reviews are listed for admin!');
	res
		.status(200)
		.json({ message: 'Reviews are listed for admin!', data: myReview });
});

exports.approveOrRejectTestimonial = catchAsync(async (req, res, next) => {
	const { newStatus } = req.body;
	if (!newStatus) {
		return next(new APPError('status is requried', 400));
	}
	const { id } = req.params;
	const myReview = await Testimonial.findById(id);
	if (!myReview) {
		return next(new APPError('Review is not found!', 404));
	}
	if (myReview.status !== 'pending') {
		return next(new APPError('review is not in pending status!', 400));
	}
	if (!['approved', 'refused'].includes(newStatus)) {
		return next(
			new APPError(
				`Cannot move review from ${myReview.status} to ${newStatus}`,
				400,
			),
		);
	}
	myReview.status = newStatus;
	await myReview.save();
	logger.info('Reviews status have changed!');
	res
		.status(200)
		.json({ message: 'Reviews status have changed!', data: myReview });
});

exports.getMyReview = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const myReview = await Testimonial.findOne({ user: userId }).populate(
		'user',
		'name',
	);
	res.status(200).json({ message: 'My review retrieved successfully', data: myReview });
});
