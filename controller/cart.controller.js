const CartItems = require('../models/cartItems.model');
const Cart = require('../models/cart.model');
const { logger } = require('../utilites/logger.uti');
const APPError = require('../utilites/appError.uti');
const catchAsync = require('../utilites/catchAsync.uti');
const Product = require('../models/product.model');

exports.addToCart = catchAsync(async (req, res, next) => {
	const { productId, quantity = 1 } = req.body;
	const userId = req.user._id;

	if (!productId) return next(new APPError('Product is required!', 400));

	const product = await Product.findById(productId);
	if (!product || product.isDeleted || !product.isActive) {
		return next(new APPError('Product is not available!', 404));
	}

	// we need to check the stock before we do anything!
	if (product.stock < quantity) {
		return next(new APPError('Not enough stock available!', 400));
	}

	//check if there is a cart or we need to create one for this user
	let myCart = await Cart.findOne({ user: userId });
	if (!myCart) {
		myCart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
	}

	//finding the product is existed on my items or not
	const existingItem = myCart.items.find(
		(item) => item.product.toString() === productId,
	);

	//check if it is there so we need to validate the quantity of what he will add
	if (existingItem) {
		if (product.stock < existingItem.quantity + quantity) {
			return next(new APPError('Not enough stock available!', 400));
		}
		existingItem.quantity += quantity;
	} else {
		// if it is note exsited we push it directly, and we did check the stock before
		myCart.items.push({
			product: productId,
			quantity,
			price: product.price,
			isPriceChanged: false,
		});
	}

	//count the total price with reduce function
	myCart.totalPrice = myCart.items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	//save the cart
	await myCart.save();
	// populate it cuz we will deal it with it with the front! very important
	await myCart.populate({
		path: 'items.product',
		populate: { path: 'category' },
	});
	logger.info('Cart updated!');
	res.status(201).json({ message: 'Cart updated!', data: myCart });
});

exports.getCart = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	let priceChange = false;
	const myCart = await Cart.findOne({ user: userId }).populate({
		path: 'items.product',
		populate: { path: 'category' },
	});
	if (!myCart) {
		return res
			.status(200)
			.json({ message: 'Cart listed!', data: { items: [], totalPrice: 0 } });
	}
	myCart.items.forEach((element) => {
		if (element.price !== element.product.price) {
			element.isPriceChanged = true;
			priceChange = true;
		}
		if (element.isPriceChanged) {
			logger.info(
				`change of price ${element.product.name} is now ${element.product.price} not ${element.price}`,
			);
		}
	});

	// Filter out deleted or inactive products
	const initialItemCount = myCart.items.length;
	myCart.items = myCart.items.filter(
		(item) => item.product && !item.product.isDeleted && item.product.isActive,
	);

	if (myCart.items.length !== initialItemCount || priceChange) {
		myCart.totalPrice = myCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0,
		);
		await myCart.save();
	}
	logger.info('Cart listed!');
	res.status(200).json({ message: 'Cart listed!', data: myCart });
});

exports.removeItems = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const { productId } = req.body;
	if (!productId) return next(new APPError('Product is required!', 400));
	const myCart = await Cart.findOne({ user: userId });
	if (!myCart) {
		return next(new APPError(`no cart found`, 404));
	}
	myCart.items = myCart.items.filter(
		(element) => element.product.toString() !== productId,
	);
	myCart.totalPrice = myCart.items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);
	await myCart.save();
	await myCart.populate({
		path: 'items.product',
		populate: { path: 'category' },
	});
	logger.info('Cart Item is removed!');
	res.status(200).json({ message: 'Cart Item is removed!', data: myCart });
});

exports.updateQuantity = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const { productId, quantity } = req.body;
	if (!productId) return next(new APPError('Product is required!', 400));
	const myCart = await Cart.findOne({ user: userId });
	if (!myCart) {
		return next(new APPError(`no cart found`, 404));
	}
	const myProduct = await Product.findById(productId);
	if (!myProduct || myProduct.isDeleted || !myProduct.isActive) {
		return next(new APPError('Product is no longer available!', 404));
	}
	const item = myCart.items.find(
		(element) => element.product.toString() === productId,
	);
	if (!item) return next(new APPError('Item not found in cart!', 404));

	if (myProduct.stock < quantity) {
		return next(new APPError('Not enough stock available!', 400));
	}
	item.quantity = quantity;

	myCart.totalPrice = myCart.items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);
	await myCart.save();
	await myCart.populate({
		path: 'items.product',
		populate: { path: 'category' },
	});
	logger.info('Cart Item is updated!');
	res.status(200).json({ message: 'Cart Item is updated!', data: myCart });
});

exports.clearCart = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const myCart = await Cart.findOne({ user: userId });
	if (!myCart) {
		return next(new APPError(`no cart found`, 404));
	}
	myCart.items = [];
	myCart.totalPrice = 0;
	await myCart.save();
	logger.info('Cart is cleared!');
	res.status(200).json({ message: 'Cart is cleared!', data: myCart });
});

exports.mergeCart = catchAsync(async (req, res, next) => {
	const userId = req.user._id;
	const { items } = req.body; // array of { productId, quantity }

	if (!items || !Array.isArray(items)) {
		return next(new APPError('Items array is required!', 400));
	}

	let myCart = await Cart.findOne({ user: userId });
	if (!myCart) {
		myCart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
	}

	for (const localItem of items) {
		const product = await Product.findById(localItem.productId);
		if (!product || product.isDeleted || !product.isActive) continue;

		const existingItem = myCart.items.find(
			(item) => item.product.toString() === localItem.productId,
		);

		if (existingItem) {
			if (product.stock >= existingItem.quantity + localItem.quantity) {
				existingItem.quantity += localItem.quantity;
			}
		} else {
			if (product.stock >= localItem.quantity) {
				myCart.items.push({
					product: localItem.productId,
					quantity: localItem.quantity,
					price: product.price,
					isPriceChanged: false,
				});
			}
		}
	}

	myCart.totalPrice = myCart.items.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0,
	);

	await myCart.save();
	await myCart.populate({
		path: 'items.product',
		populate: { path: 'category' },
	});
	logger.info('Cart merged!');
	res.status(200).json({ message: 'Cart merged!', data: myCart });
});
