const { logger } = require('../utilites/logger.uti');
const catchAsync = require('../utilites/catchAsync.uti');
const APPError = require('../utilites/appError.uti');
const slugify = require('slugify');
const Category = require('../models/category.model');
const SubCategory = require('../models/subCategory.model');

exports.addSubCategory = catchAsync(async (req, res, next) => {
	const { name, category } = req.body;
	if (!name || !category) {
		return next(new APPError('Name and category are required!', 400));
	}
	const categoryExists = await Category.findById(category);
	if (!categoryExists) {
		return next(new APPError('Category not found!', 404));
	}
	const slug = slugify(name, {
		lower: true,
		strict: true,
	});
	const existing = await SubCategory.findOne({ slug, category });
	if (existing) {
		return next(new APPError('subCategory is exsited!', 409));
	}
	const mySubCategory = await SubCategory.create({
		name,
		slug,
		category,
	});
	logger.info('subCategory created!');
	res
		.status(201)
		.json({ message: 'subCategory created!', data: mySubCategory });
});

exports.getAllSubCategories = catchAsync(async (req, res, next) => {
	logger.info('subCategory listed!');
	res.status(200).json({
		message: 'subCategory list!',
		...res.paginatedResult,
	});
});

exports.getSubCategoryBySlug = catchAsync(async (req, res, next) => {
	const slug = req.params.slug;
	if (!slug) {
		return next(new APPError('slug is required!', 400));
	}
	const mySubCategory = await SubCategory.findOne({
		slug,
		isDeleted: false,
	}).populate('category', 'name slug');
	if (!mySubCategory) {
		return next(new APPError('subCategory is not found!', 404));
	}
	res.status(200).json({ message: 'Category Found!', data: mySubCategory });
});

exports.updateSubCategory = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { name, isActive, category } = req.body;
	const subCategory = await SubCategory.findById(id);
	if (!subCategory) {
		return next(new APPError('SubCategory not found', 404));
	}
	if (category) {
		const categoryExists = await Category.findById(category);
		if (!categoryExists) {
			return next(new APPError('Category not found', 404));
		}
		subCategory.category = category;
	}
	if (name) {
		subCategory.name = name;
		subCategory.slug = slugify(name, {
			lower: true,
			strict: true,
		});
	}
	if (typeof isActive === 'boolean') {
		subCategory.isActive = isActive;
	}
	const updatedSubCategory = await subCategory.save();
	logger.info('subCategory updated successfully!');
	res.status(200).json({
		message: 'subCategory updated successfully',
		data: updatedSubCategory,
	});
});

exports.deleteSubCategory = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const subCategory = await SubCategory.findByIdAndUpdate(
		id,
		{
			isDeleted: true,
			isActive: false,
		},
		{
			new: true, // return updated document
		},
	);
	if (!subCategory) {
		return next(new APPError('subCategory not found', 404));
	}
	res.status(200).json({
		message: 'subCategory deleted successfully',
		data: subCategory,
	});
});
