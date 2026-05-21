const mongoose = require('mongoose');

const orderShema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		phone: {
			type: String,
			required: true,
		},
		address: {
			label: { type: String, required: true },
			addressText: { type: String, required: true },
		},
		status: {
			type: String,
			enum: [
				'pending',
				'preparing',
				'shipped',
				'received',
				'refused',
				'cancelledByUser',
				'cancelledByAdmin',
			],
			default: 'pending',
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
					required: true,
				},
				title: { type: String, required: true },
				price: { type: Number, required: true },
				quantity: { type: Number, required: true, min: 1 },
			},
		],
		totalPrice: {
			type: Number,
			required: true,
			default: 0,
		},
		refund: {
			status: { type: String, enum: ['pending', 'approved', 'refused'] },
			reason: { type: String },
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('order', orderShema);
