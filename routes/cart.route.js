const express = require('express');
const router = express.Router();
const {
	addToCart,
	getCart,
	removeItems,
	updateQuantity,
	clearCart,
	mergeCart,
} = require('../controller/cart.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');

router.post('/', authanticate, authorized('user'), addToCart);
router.post('/merge', authanticate, authorized('user'), mergeCart);
router.get('/', authanticate, authorized('user'), getCart);
router.delete('/items', authanticate, authorized('user'), removeItems);
router.patch('/', authanticate, authorized('user'), updateQuantity);
router.delete('/', authanticate, authorized('user'), clearCart);
module.exports = router;
