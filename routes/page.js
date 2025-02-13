const express = require('express');
const pageController = require('../controllers/page.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');

const router = express.Router();

router.post("/home-banner", checkAdminMiddleware.checkAdmin, pageController.saveBanner);
router.get("/home-banner", pageController.getAllBanner);
router.get("/home", pageController.getHomeData);

router.get("/page-data/:id", pageController.getPageData);
router.patch("/page-data/:id", checkAdminMiddleware.checkAdmin, pageController.updatePageData);


module.exports = router;