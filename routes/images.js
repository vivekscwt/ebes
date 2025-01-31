const express = require('express');
const imageController = require('../controllers/image.controller');
const imageUploader = require('../helpers/image-uploader');
const checkAuth = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post('/upload', checkAdminMiddleware.checkAdmin, imageUploader.upload.single('image'), imageController.upload);

router.post('/add-image',checkAdminMiddleware.checkAdmin, imageController.addImage);

router.get('/get-images',checkAdminMiddleware.checkAdmin, imageController.getImages);

router.delete('/delete-image',checkAdminMiddleware.checkAdmin, imageController.deleteImage);


module.exports = router;