const Order = require('../models/order.model');
const mongoose = require('mongoose');
const catchAsync = require('../utilites/catchAsync.uti');

exports.getSalesReport = catchAsync(async (req, res, next) => {
	const { startDate, endDate } = req.query;

	// match stage — filter by date and only received orders
	const matchStage = { status: 'received' };
	if (startDate || endDate) {
		matchStage.createdAt = {};
		if (startDate) matchStage.createdAt.$gte = new Date(startDate);
		if (endDate) matchStage.createdAt.$lte = new Date(endDate);
	}

	const summary = await Order.aggregate([
		// step 1 — filter orders
		{ $match: matchStage },

		// step 2 — bring in user data
		{
			$lookup: {
				from: 'users',
				localField: 'user',
				foreignField: '_id',
				as: 'user',
			},
		},
		{ $unwind: '$user' },

		// step 3 — unwind products array so each product is its own document
		{ $unwind: '$products' },

		// step 4 — calculate total price per product line
		{
			$addFields: {
				lineTotal: {
					$multiply: ['$products.price', '$products.quantity'],
				},
			},
		},

		// step 5 — run all reports in parallel
		{
			$facet: {
				overallStats: [
					{
						$group: {
							_id: null,
							totalRevenue: { $sum: '$lineTotal' },
							totalItemsSold: { $sum: '$products.quantity' },
							totalOrders: { $sum: 1 },
						},
					},
				],

				topProducts: [
					{
						$group: {
							_id: '$products.product',
							title: { $first: '$products.title' },
							revenue: { $sum: '$lineTotal' },
							quantitySold: { $sum: '$products.quantity' },
						},
					},
					{ $sort: { revenue: -1 } },
					{ $limit: 5 },
				],

				topClients: [
					{
						$group: {
							_id: '$user._id',
							name: { $first: '$user.name' },
							totalSpent: { $sum: '$lineTotal' },
							totalOrders: { $sum: 1 },
						},
					},
					{ $sort: { totalSpent: -1 } },
					{ $limit: 5 },
				],

				monthlySales: [
					{
						$group: {
							_id: {
								year: { $year: '$createdAt' },
								month: { $month: '$createdAt' },
							},
							totalRevenue: { $sum: '$lineTotal' },
							totalItemsSold: { $sum: '$products.quantity' },
						},
					},
					{ $sort: { '_id.year': 1, '_id.month': 1 } },
				],
			},
		},
	]);

	res.status(200).json({
		message: `Sales report from: ${startDate ?? 'beginning'} to: ${endDate ?? 'now'}`,
		data: summary[0],
	});
});
