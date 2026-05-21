const SubCategory = require('../models/subCategory.model');
const Category = require('../models/category.model');
const APPError = require('../utilites/appError.uti');
const { logger } = require('../utilites/logger.uti');
const catchAsync = require('../utilites/catchAsync.uti');
const Product = require('../models/product.model');
const slugify = require('slugify');

exports.addProduct = catchAsync(async (req, res, next) => {
	const {
		name,
		description,
		price,
		stock,
		category: categoryId,
		subCategory: subCategoryId,
		isSeasonal,
	} = req.body;
	if (!name || !price || !categoryId || !subCategoryId) {
		return next(new APPError('Missing required fields!', 400));
	}
	const imgURL = req.file ? req.file.filename : null;
	const slug = slugify(name, {
		lower: true,
		strict: true,
	});
	const existing = await Product.findOne({
		slug,
		subCategory: subCategoryId,
	});

	if (existing) {
		return next(
			new APPError('Product already exists in this subCategory!', 409),
		);
	}
	const category = await Category.findById(categoryId);
	const subCategory = await SubCategory.findById(subCategoryId);
	if (!category || !subCategory) {
		return next(new APPError('category or subCategory is not found!', 404));
	}
	//to check if the subCategory is related to category
	if (subCategory.category.toString() !== category._id.toString()) {
		return next(
			new APPError('SubCategory does not belong to this category!', 400),
		);
	}

	const myProduct = await Product.create({
		name,
		description,
		price,
		stock,
		category: categoryId,
		subCategory: subCategoryId,
		imgURL,
		slug,
		isSeasonal: isSeasonal === 'true' || isSeasonal === true,
	});
	logger.info('Product created!');
	res.status(201).json({ message: 'product created!', data: myProduct });
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
	logger.info('Products listed!');
	res.status(200).json({
		message: 'Product list!',
		...res.paginatedResult,
	});
});

exports.getProductBySlug = catchAsync(async (req, res, next) => {
	const slug = req.params.slug;
	const myProduct = await Product.findOne({ slug, isDeleted: false }).populate(
		'subCategory category',
		'name slug',
	);
	if (!myProduct) {
		return next(new APPError('product not found!', 404));
	}
	logger.info('Product listed!');
	res.status(200).json({ message: 'Product list!', data: myProduct });
});

exports.updateProducts = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const {
		name,
		description,
		price,
		stock,
		category: categoryId,
		subCategory: subCategoryId,
		isActive,
		isSeasonal,
	} = req.body;
	const product = await Product.findById(id);
	if (!product) {
		return next(new APPError('Product not found', 404));
	}
	if (name) {
		product.name = name;
		product.slug = slugify(name, { lower: true, strict: true });
	}
	if (description) product.description = description;
	if (price !== undefined) product.price = price;
	if (stock !== undefined) product.stock = stock;
	if (req.file) {
		product.imgURL = req.file.filename;
	}
	if (categoryId || subCategoryId) {
		const category = categoryId
			? await Category.findById(categoryId)
			: await Category.findById(product.category);

		const subCategory = subCategoryId
			? await SubCategory.findById(subCategoryId)
			: await Category.findById(product.subCategory);

		if (!category || !subCategory) {
			return next(new APPError('Category or SubCategory not found', 404));
		}

		if (subCategory.category.toString() !== category._id.toString()) {
			return next(
				new APPError('SubCategory does not belong to this category!', 400),
			);
		}

		product.category = category._id;
		product.subCategory = subCategory._id;
	}
	//check if they are working with category and sub as well!
	//here we need to pass it like that because unlike category or sub here we take it form data, so we get it as a string most likely
	if (isActive !== undefined) {
		product.isActive =
			typeof isActive === 'string' ? isActive === 'true' : isActive;
	}
	if (isSeasonal !== undefined) {
		product.isSeasonal =
			typeof isSeasonal === 'string' ? isSeasonal === 'true' : isSeasonal;
	}
	const updatedProduct = await product.save();
	logger.info('Product updated successfully!');
	res.status(200).json({
		message: 'product updated successfully',
		data: updatedProduct,
	});
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const product = await Product.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
			isActive: false,
		},
		{
			new: true, // return updated document
		},
	);
	if (!product) {
		return next(new APPError('product not found', 404));
	}
	logger.info('Product deleted successfully!');
	res.status(200).json({
		message: 'Product deleted successfully',
	});
});

exports.restoreProduct = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const product = await Product.findByIdAndUpdate(
		id,
		{
			isDeleted: false,
			isActive: true,
		},
		{
			new: true,
		},
	);
	if (!product) {
		return next(new APPError('product not found', 404));
	}
	logger.info('Product restored successfully!');
	res.status(200).json({
		message: 'Product restored successfully',
		data: product,
	});
});
