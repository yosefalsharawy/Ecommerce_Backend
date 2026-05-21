const express = require('express');
const router = express.Router();
const {
	addProduct,
	getAllProducts,
	getProductBySlug,
	updateProducts,
	deleteProduct,
	restoreProduct,
} = require('../controller/product.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const paginate = require('../middlewares/paginate.middleware');
const Product = require('../models/product.model');

router.post(
	'/addProduct',
	authanticate,
	authorized('admin'),
	upload.single('imgURL'),
	addProduct,
);
router.get('/', paginate(Product, 'subCategory category'), getAllProducts);
router.get('/:slug', getProductBySlug);
router.put(
	'/:id',
	authanticate,
	authorized('admin'),
	upload.single('imgURL'),
	updateProducts,
);
router.delete('/:id', authanticate, authorized('admin'), deleteProduct);
router.patch('/:id', authanticate, authorized('admin'), restoreProduct);

module.exports = router;
