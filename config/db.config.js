const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		await mongoose.connect(`${process.env.DB_URL}?replicaSet=rs0`);
	} catch (err) {
		console.error(`Error: ${err.message}`);
		process.exit(1);
	}
};

module.exports = connectDB;
