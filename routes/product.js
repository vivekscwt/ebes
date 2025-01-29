const express = require('express');
const productController = require('../controllers/product.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/", checkAdminMiddleware.checkAdmin, productController.save);
router.get("/", productController.index);
router.get("/:id", productController.show);
router.patch("/:id", checkAdminMiddleware.checkAdmin, productController.update);
router.delete("/:id", checkAdminMiddleware.checkAdmin, productController.destroy);

//Category
router.post("/category", checkAdminMiddleware.checkAdmin, productController.saveCategory);
router.patch("/category/updatecategory", checkAdminMiddleware.checkAdmin, productController.updateCategory);
router.patch("/category-listing", checkAdminMiddleware.checkAdmin, productController.categoryListing);


module.exports = router;