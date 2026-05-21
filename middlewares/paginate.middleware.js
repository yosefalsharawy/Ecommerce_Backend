const mongoose = require('mongoose');

module.exports = (Model, populate, select) => async (req, res, next) => {
	try {
		// 1) Filtering
		const queryObj = { ...req.query };
		const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
		excludedFields.forEach((el) => delete queryObj[el]);

		let filter = {};

		Object.keys(queryObj).forEach((key) => {
			let value = queryObj[key];

			// Handle comma-separated values for $in operator (e.g., category=id1,id2)
			if (
				typeof value === 'string' &&
				value.includes(',') &&
				!key.includes('[')
			) {
				filter[key] = { $in: value.split(',').map((v) => v.trim()) };
			}
			// Handle flattened keys like 'price[gte]'
			else if (key.includes('[') && key.includes(']')) {
				const mainKey = key.split('[')[0];
				const operator = key.split('[')[1].split(']')[0];

				if (!filter[mainKey]) filter[mainKey] = {};
				filter[mainKey][`$${operator}`] = isNaN(value) ? value : Number(value);
			}
			// Handle nested objects if parsed by Express (e.g. { price: { gte: '100' } })
			else if (typeof value === 'object' && value !== null) {
				filter[key] = {};
				Object.keys(value).forEach((op) => {
					const mongoOp = ['gt', 'gte', 'lt', 'lte', 'in', 'ne'].includes(op)
						? `$${op}`
						: op;
					filter[key][mongoOp] = isNaN(value[op])
						? value[op]
						: Number(value[op]);
				});
			}
			// Handle simple keys
			else {
				filter[key] = isNaN(value) || key === 'keyword' ? value : Number(value);
			}
		});

		if (filter.isDeleted === undefined) {
			filter.isDeleted = { $ne: true };
		} else {
			if (filter.isDeleted === 'true' || filter.isDeleted === true) {
				filter.isDeleted = true;
			} else if (filter.isDeleted === 'false' || filter.isDeleted === false) {
				filter.isDeleted = false;
			}
		}

		// 2) Search (Keyword)
		if (req.query.keyword) {
			const keyword = req.query.keyword;
			const searchFilter = [
				{ name: { $regex: keyword, $options: 'i' } },
				{ description: { $regex: keyword, $options: 'i' } },
			];

			// If querying Products, search by category/subcategory name as well
			if (Model.modelName === 'Product') {
				try {
					const Category = mongoose.model('Category');
					const SubCategory = mongoose.model('SubCategory');

					const [matchingCategories, matchingSubCategories] = await Promise.all(
						[
							Category.find({
								name: { $regex: keyword, $options: 'i' },
								isDeleted: { $ne: true },
							}).select('_id'),
							SubCategory.find({
								name: { $regex: keyword, $options: 'i' },
								isDeleted: { $ne: true },
							}).select('_id'),
						],
					);

					if (matchingCategories.length > 0) {
						searchFilter.push({
							category: { $in: matchingCategories.map((c) => c._id) },
						});
					}
					if (matchingSubCategories.length > 0) {
						searchFilter.push({
							subCategory: { $in: matchingSubCategories.map((s) => s._id) },
						});
					}
				} catch (err) {
					console.error('Search expansion failed:', err.message);
				}
			}

			filter.$or = searchFilter;
			delete filter.keyword;
		}

		// Initial Query
		let query = Model.find(filter);

		// 3) Sorting
		if (req.query.sort) {
			const sortBy = req.query.sort.split(',').join(' ');
			query = query.sort(sortBy);
		} else {
			query = query.sort('-createdAt');
		}

		// 4) Field Limiting (Select)
		if (req.query.fields) {
			const fields = req.query.fields.split(',').join(' ');
			query = query.select(fields);
		} else if (select) {
			query = query.select(select);
		} else {
			query = query.select('-__v');
		}

		// 5) Population
		if (populate) {
			query = query.populate(populate);
		}

		// 6) Pagination
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const totalResults = await Model.countDocuments(filter);
		query = query.skip(skip).limit(limit);

		const results = await query;

		res.paginatedResult = {
			page,
			limit,
			totalPages: Math.ceil(totalResults / limit),
			totalResults,
			data: results,
		};
		next();
	} catch (error) {
		next(error);
	}
};
