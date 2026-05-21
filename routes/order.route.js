const express = require('express');
const router = express.Router();
const {
	addOrder,
	getAllOrders,
	getOrderById,
	orderCancelledByUser,
	requestRefund,
	updateOrderStatus,
	approveOrRejectRefund,
	getAllOrdersAdmin,
} = require('../controller/order.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');

router.post('/', authanticate, authorized('user'), addOrder);
router.get('/', authanticate, authorized('user'), getAllOrders);
router.get('/allOrders', authanticate, authorized('admin'), getAllOrdersAdmin);
router.get('/:id', authanticate, authorized('user'), getOrderById);
router.patch(
	'/cancel/:id',
	authanticate,
	authorized('user'),
	orderCancelledByUser,
);
router.post(
	'/requestRefund/:id',
	authanticate,
	authorized('user'),
	requestRefund,
);
router.patch(
	'/updateStatus/:id',
	authanticate,
	authorized('admin'),
	updateOrderStatus,
);
router.patch(
	'/updateRefundStatus/:id',
	authanticate,
	authorized('admin'),
	approveOrRejectRefund,
);
module.exports = router;
