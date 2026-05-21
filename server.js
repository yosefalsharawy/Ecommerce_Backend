const express = require('express');
const dotEnv = require('dotenv');
dotEnv.config();
const corsMiddleware = require('./middlewares/cors.middleware');
const connectDB = require('./config/db.config');
const { log } = require('winston');
connectDB();
const port = process.env.PORT;
const path = require('path');

const app = express();
app.use(express.json());
app.use(corsMiddleware);

app.use('/api/v1/user', require('./routes/user.route'));
app.use('/api/v1/auth', require('./routes/auth.route'));
app.use('/api/v1/category', require('./routes/category.route'));
app.use('/api/v1/subCategory', require('./routes/subCategory.route'));
app.use('/api/v1/product', require('./routes/product.route'));
app.use('/api/v1/cart', require('./routes/cart.route'));
app.use('/api/v1/order', require('./routes/order.route'));
app.use('/api/v1/testimonial', require('./routes/testimonial.route'));
app.use('/api/v1/report', require('./routes/reports.route'));
app.use('/api/files', express.static(path.join(__dirname, 'uploads')));

const AppError = require('./utilites/appError.uti');

app.use((req, res, next) => {
	next(new AppError(`can't find ${req.originalUrl}`, 404));
});

// last middleware to handle the errors!
const errorHandler = require('./middlewares/errorHandler.middleware');
app.use(errorHandler);

app.listen(port, (_) => console.log(`Server started at port ${port}`));
