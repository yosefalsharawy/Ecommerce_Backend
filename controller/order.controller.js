const Order = require('../models/order.model');
const catchAsync = require('../utilites/catchAsync.uti');
const { logger } = require('../utilites/logger.uti');
const APPError = require('../utilites/appError.uti');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');
const mongoose = require('mongoose');

exports.addOrder = catchAsync(async (req, res, next) => {
	const { address, phone } = req.body;
	const userId = req.user._id;
	if (!address || !phone) {
		return next(new APPError('address and phone number are requried', 400));
	}
	const myCart = await Cart.findOne({ user: userId }).populate('items.product');
	if (!myCart || myCart.items.length === 0) {
		return next(new APPError('Cart is empty!', 400));
	}

	for (const item of myCart.items) {
		if (!item.product || item.product.isDeleted || !item.product.isActive) {
			return next(
				new APPError(
					`Product ${item.product?.name || 'unknown'} is no longer available`,
					400,
				),
			);
		}
		if (item.product.stock < item.quantity) {
			return next(
				new APPError(`Not enough stock for ${item.product.name}`, 400),
			);
		}
	}

	// Start transaction
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Build product snapshots
		const orderProducts = myCart.items.map((item) => ({
			product: item.product._id,
			title: item.product.name,
			price: item.price,
			quantity: item.quantity,
		}));

		// Create order
		const myOrder = await Order.create(
			[
				{
					user: userId,
					phone,
					address,
					products: orderProducts,
					totalPrice: myCart.totalPrice,
				},
			],
			{ session },
		);

		// Loop 2 — decrease stock
		for (const item of myCart.items) {
			await Product.findByIdAndUpdate(
				item.product._id,
				{ $inc: { stock: -item.quantity } },
				{ session },
			);
		}

		// Clear cart
		myCart.items = [];
		myCart.totalPrice = 0;
		await myCart.save({ session });

		await session.commitTransaction();
		logger.info('Order is placed!');
		res.status(201).json({ message: 'Order is placed!', data: myOrder });
	} catch (err) {
		await session.abortTransaction();
		return next(err);
	} finally {
		session.endSession();
	}
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const myOrder = await Order.find({ user: userId }).populate('user', 'name email');
	logger.info('Orders is listed!');
	res.status(200).json({ message: 'Orders is listed!', data: myOrder });
});

exports.getAllOrdersAdmin = catchAsync(async (req, res, next) => {
	const myOrder = await Order.find().populate('user', 'name email');
	logger.info('Orders is listed!');
	res.status(200).json({ message: 'Orders is listed!', data: myOrder });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	if (!id) {
		return next(new APPError('order id is not found!', 404));
	}
	const userId = req.user._id;
	const myOrder = await Order.findOne({ _id: id, user: userId });
	if (!myOrder) {
		return next(new APPError('order is not found!', 404));
	}
	logger.info('Order by id is listed!');
	res.status(200).json({ message: 'Order by id is listed!', data: myOrder });
});

exports.orderCancelledByUser = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const userId = req.user._id;
	if (!id) {
		return next(new APPError('order id is not found!', 404));
	}
	const myOrder = await Order.findOne({ _id: id, user: userId });
	if (!myOrder) {
		return next(new APPError('order is not found!', 404));
	}
	if (myOrder.status !== 'pending' && myOrder.status !== 'preparing') {
		return next(new APPError('Order is shipped and cant be cancelled!', 400));
	}
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		myOrder.status = 'cancelledByUser';

		for (const item of myOrder.products) {
			await Product.findByIdAndUpdate(
				item.product,
				{ $inc: { stock: item.quantity } },
				{ session },
			);
		}

		await myOrder.save({ session });
		await session.commitTransaction();
		logger.info('order is cancelled by user!');
		res
			.status(200)
			.json({ message: 'order is cancelled by user!', data: myOrder });
	} catch (err) {
		await session.abortTransaction();
		return next(err);
	} finally {
		session.endSession();
	}
});

exports.requestRefund = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { reason } = req.body;
	if (!reason) return next(new APPError('Refund reason is required!', 400));
	const userId = req.user._id;
	if (!id) {
		return next(new APPError('order id is not found!', 404));
	}
	const myOrder = await Order.findOne({ _id: id, user: userId });
	if (!myOrder) {
		return next(new APPError('order is not found!', 404));
	}
	if (myOrder.status !== 'received') {
		return next(new APPError('Order is not received yet!', 400));
	}
	//check if he requested before and got approved!
	if (myOrder.refund.status === 'approved') {
		return next(new APPError('Refund already approved!', 400));
	}

	myOrder.refund.status = 'pending';
	myOrder.refund.reason = reason;
	await myOrder.save();
	logger.info('user requested a refund!');
	res.status(200).json({ message: 'user requested a refund!', data: myOrder });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	if (!id) {
		return next(new APPError('order id is not found!', 404));
	}
	const { newStatus } = req.body;
	if (!newStatus) return next(new APPError('new status is required!', 400));
	const myOrder = await Order.findById(id);
	if (!myOrder) {
		return next(new APPError('order is not found!', 404));
	}
	//will get the current status and do a map of the allowed transitions for the admin
	const currentStatus = myOrder.status;
	const allowedTransitions = {
		pending: ['preparing', 'cancelledByAdmin', 'refused'],
		preparing: ['shipped', 'cancelledByAdmin'],
		shipped: ['received'],
		received: [],
		refused: [],
		cancelledByUser: [],
		cancelledByAdmin: [],
	};
	//get what alloed for the currentStatus
	const allowed = allowedTransitions[currentStatus];
	//if it is not allowed will throw an error
	if (!allowed.includes(newStatus)) {
		return next(
			new APPError(
				`Cannot move order from ${currentStatus} to ${newStatus}`,
				400,
			),
		);
	}

	//handling the rstore stock when refused by admin or being cancelled
	const restoreStock = ['cancelledByAdmin', 'refused'].includes(newStatus);
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		myOrder.status = newStatus;

		if (restoreStock) {
			for (const item of myOrder.products) {
				await Product.findByIdAndUpdate(
					item.product,
					{ $inc: { stock: item.quantity } },
					{ session },
				);
			}
		}

		await myOrder.save({ session });
		await session.commitTransaction();

		logger.info('Order status updated!');
		res.status(200).json({ message: 'Order status updated!', data: myOrder });
	} catch (err) {
		await session.abortTransaction();
		return next(err);
	} finally {
		session.endSession();
	}
});

exports.approveOrRejectRefund = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	if (!id) {
		return next(new APPError('order id is not found!', 404));
	}
	const { newStatus } = req.body;
	if (!newStatus) return next(new APPError('new status is required!', 400));
	const myOrder = await Order.findById(id);
	if (!myOrder) {
		return next(new APPError('order is not found!', 404));
	}
	if (myOrder.status !== 'received') {
		return next(
			new APPError('Refund can only be requested on received orders!', 400),
		);
	}
	const currentStatus = myOrder.refund.status;
	if (currentStatus !== 'pending') {
		return next(new APPError('order has not requested a refund!', 404));
	}
	//if it is not allowed will throw an error
	if (!['approved', 'refused'].includes(newStatus)) {
		return next(
			new APPError(
				`Cannot move order from ${currentStatus} to ${newStatus}`,
				400,
			),
		);
	}
	const restoreStock = ['approved'].includes(newStatus);
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		myOrder.refund.status = newStatus;

		if (restoreStock) {
			for (const item of myOrder.products) {
				await Product.findByIdAndUpdate(
					item.product,
					{ $inc: { stock: item.quantity } },
					{ session },
				);
			}
		}

		await myOrder.save({ session });
		await session.commitTransaction();

		logger.info('Order update request refund status!');
		res
			.status(200)
			.json({ message: 'Order update request refund status!', data: myOrder });
	} catch (err) {
		await session.abortTransaction();
		return next(err);
	} finally {
		session.endSession();
	}
});
