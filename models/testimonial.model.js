const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
		},
		comment: {
			type: String,
			required: true,
			minlength: 10,
			maxlength: 500,
		},
		stars: {
			type: Number,
			required: true,
			enum: [1, 2, 3, 4, 5],
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'refused'],
			default: 'pending',
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
