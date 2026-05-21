const Category = require('../models/category.model');
const catchAsync = require('../utilites/catchAsync.uti');
const { logger } = require('../utilites/logger.uti');
const APPError = require('../utilites/appError.uti');
const slugify = require('slugify');

exports.addCategory = catchAsync(async (req, res, next) => {
	const { name } = req.body;
	if (!name) {
		return next(new APPError('Category name is required!', 400));
	}
	//we will slugify the category name with a library!
	const slug = slugify(name, {
		lower: true,
		strict: true,
	});
	const category = await Category.findOne({ slug });
	if (category) {
		return next(new APPError('Category is exsited!', 409));
	}
	const myCategory = await Category.create({
		name,
		slug,
	});
	logger.info('Category created!');
	res.status(201).json({ message: 'Category created!', data: myCategory });
});

exports.getAllCategories = catchAsync(async (req, res) => {
	logger.info('Category listed!');
	res.status(200).json({
		message: 'Category list!',
		...res.paginatedResult,
	});
});

exports.getCategoryByslug = catchAsync(async (req, res, next) => {
	const slug = req.params.slug;
	if (!slug) {
		return next(new APPError('slug is required!', 400));
	}
	const myCategory = await Category.findOne({ slug, isDeleted: false });
	if (!myCategory) {
		return next(new APPError('Category is not found!', 404));
	}
	res.status(200).json({ message: 'Category Found!', data: myCategory });
});

exports.updateGategory = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { name, isActive } = req.body;
	const category = await Category.findById(id);
	if (!category) {
		return next(new APPError('Category not found', 404));
	}
	category.name = name;
	category.slug = slugify(name, {
		lower: true,
		strict: true,
	});
	if (typeof isActive === 'boolean') {
		category.isActive = isActive;
	}
	//we used .save() because we did slugify and did some checks
	const updatedCategory = await category.save();
	res.status(200).json({
		message: 'Category updated successfully',
		data: updatedCategory,
	});
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const category = await Category.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
			isActive: false,
		},
		{
			new: true, // return updated document
		},
	);
	if (!category) {
		return next(new APPError('Category not found', 404));
	}
	res.status(200).json({
		message: 'Category deleted successfully',
	});
});
