const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const addressSchema = require('../models/address.model');

const userSchema = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			minlength: 3,
			maxlength: 50,
			trim: true,
		},
		mobile: {
			type: String,
			unique: true,
			required: true,
			match: /^01[0-2,5]{1}[0-9]{8}$/,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
		},
		email: {
			type: String,
			unique: true,
			sparse: true, //optional!
			lowercase: true,
			trim: true,
			match: /^\S+@\S+\.\S+$/,
		},
		gender: {
			type: String,
			enum: ['male', 'female'],
			required: true,
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		address: [addressSchema],
	},
	{ timestamps: true },
);

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 12);
	}
});

userSchema.methods.correctpassword = async function (inputPassword) {
	return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
