const express = require('express');
const router = express.Router();
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');
const paginate = require('../middlewares/paginate.middleware');
const SubCategory = require('../models/subCategory.model');
const {
	addSubCategory,
	getAllSubCategories,
	getSubCategoryBySlug,
	deleteSubCategory,
	updateSubCategory,
} = require('../controller/subCategory.controller');

router.post(
	'/addSubCategory',
	authanticate,
	authorized('admin'),
	addSubCategory,
);
router.get('/', paginate(SubCategory, 'category'), getAllSubCategories);
router.get('/:slug', getSubCategoryBySlug);
router.delete('/:id', authanticate, authorized('admin'), deleteSubCategory);
router.put('/:id', authanticate, authorized('admin'), updateSubCategory);

module.exports = router;
