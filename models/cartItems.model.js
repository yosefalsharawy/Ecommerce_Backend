const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			default: 1,
			min: 1,
		},
		price: {
			type: Number,
			required: true,
		},
		isPriceChanged: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{
		_id: false,
	},
);

module.exports = cartItemSchema;
