const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'SubCategory name is required'],
			trim: true,
		},

		slug: {
			type: String,
			lowercase: true,
		},

		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
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
	},
	{
		timestamps: true,
	},
);

module.exports = mongoose.model('SubCategory', subCategorySchema);
