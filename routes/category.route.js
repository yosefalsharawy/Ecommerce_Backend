const express = require('express');
const router = express.Router();
const {
	addCategory,
	getAllCategories,
	getCategoryByslug,
	deleteCategory,
	updateGategory,
	restoreCategory,
} = require('../controller/category.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');
const paginate = require('../middlewares/paginate.middleware');
const Category = require('../models/category.model');

router.post('/addGategory', authanticate, authorized('admin'), addCategory);
router.get('/', paginate(Category), getAllCategories);
router.get('/:slug', getCategoryByslug);
router.delete('/:id', authanticate, authorized('admin'), deleteCategory);
router.put('/:id', authanticate, authorized('admin'), updateGategory);
router.patch('/:id', authanticate, authorized('admin'), restoreCategory);

module.exports = router;
