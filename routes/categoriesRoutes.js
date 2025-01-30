const express = require('express');
const categoryController = require('../controllers/categories.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();


//Category
router.post("/category", checkAdminMiddleware.checkAdmin, categoryController.saveCategory);
router.patch("/category/updatecategory", checkAdminMiddleware.checkAdmin, categoryController.updateCategory);
router.get("/", checkAdminMiddleware.checkAdmin, categoryController.categoryListing);
router.delete("/:id", checkAdminMiddleware.checkAdmin, categoryController.destroy);

module.exports = router;