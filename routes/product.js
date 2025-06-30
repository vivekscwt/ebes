const express = require('express');
const productController = require('../controllers/product.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/", checkAdminMiddleware.checkAdmin, productController.save);
router.get("/", productController.index);
router.get("/:id", productController.show);
router.get("/search/:keyword", productController.searchProduct);
router.patch("/:id", checkAdminMiddleware.checkAdmin, productController.update);
router.delete("/:id", checkAdminMiddleware.checkAdmin, productController.destroy);



module.exports = router;