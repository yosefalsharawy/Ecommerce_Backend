const multer = require('multer');
const path = require('path');

//to limit what get uploaded!
const fileFilter = (req, file, cb) => {
	const ext = path.extname(file.originalname).toLowerCase();
	const allowed = ['.jpg', '.png', '.jpeg', '.webp']; // only what can be uploaded
	if (!allowed.includes(ext)) {
		return cb(new Error('Only images allowed'), false);
	}
	//cb throw an error or null
	cb(null, true); //true or false, so it can continue or not!
};
//the previous way is not that safe! it still can thrown a file with any other ext and virus your device!

//another way of safety upload but it still not that safe!
// mimeType ['img/jpeg','img/png']

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads');
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + '-' + file.originalname);
	},
});

const MB = 1024 * 1024;

exports.upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 2 * MB },
});
