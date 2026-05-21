const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		imgURL: {
			type: String,
			required: true,
		},
		stock: {
			type: Number,
			default: 0,
			min: 0,
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			required: true,
		},
		subCategory: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SubCategory',
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		isSeasonal: {
			type: Boolean,
			default: false,
		},
		slug: {
			type: String,
			unique: true,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Product', productSchema);
