const express = require('express');
const productController = require('../controllers/product.controller');
const checkAuthMiddleware = require('../middleware/check-auth');

const router = express.Router();

router.post("/", checkAuthMiddleware.checkAuth, productController.save);
router.get("/", productController.index);
router.get("/:id", productController.show);
router.patch("/:id", checkAuthMiddleware.checkAuth, productController.update);
router.delete("/:id", checkAuthMiddleware.checkAuth, productController.destroy);

//Category
router.post("/category", checkAuthMiddleware.checkAuth, productController.saveCategory);
router.patch("/category/updatecategory", checkAuthMiddleware.checkAuth, productController.updateCategory);

module.exports = router;