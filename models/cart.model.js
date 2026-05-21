const mongoose = require('mongoose');
const cartItemSchema = require('../models/cartItems.model');

const cartSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
		},
		items: [cartItemSchema],
		totalPrice: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model('Cart', cartSchema);
