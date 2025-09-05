const express = require('express');
const strodetailController = require('../controllers/strodetail.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/", checkAdminMiddleware.checkAdmin, strodetailController.saveAddress);
router.get("/:id", strodetailController.getAddress);
router.patch("/:id", checkAdminMiddleware.checkAdmin, strodetailController.updateAddress);



module.exports = router;