const express = require('express');
const router = express.Router();
const {
	addReview,
	getApprovedTestimonials,
	getAllTestimonials,
	approveOrRejectTestimonial,
	getMyReview,
} = require('../controller/testimonial.controller');
const { authanticate } = require('../middlewares/auth.middleware');
const { authorized } = require('../middlewares/role.middleware');

router.post('/', authanticate, authorized('user'), addReview);
router.get('/', getApprovedTestimonials);
router.get('/my-review', authanticate, getMyReview);
router.get('/all', authanticate, authorized('admin'), getAllTestimonials);
router.patch(
	'/:id',
	authanticate,
	authorized('admin'),
	approveOrRejectTestimonial,
);
module.exports = router;
