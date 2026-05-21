const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
	addresses: {
		_id: false,
		label: {
			type: String,
			enum: ['home', 'work', 'other'],
			required: true,
		},
		addressText: {
			type: String,
			required: true,
			minlength: 10,
		},
		isDefault: {
			type: Boolean,
			default: false,
		},
	},
});

module.exports = addressSchema;
