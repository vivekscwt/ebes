// userRoutes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');
const router = express.Router();

// Route for user registration
router.post("/register", userController.register);

// Route for user login
router.post("/login", userController.login);

//Route for admin login
router.post("/admin-login", userController.adminLogin);

//Route for change password
router.post("/change-password", checkAuthMiddleware.checkAuth, userController.changePassword);

//Route for total users count
router.get("/user-count", checkAdminMiddleware.checkAdmin, userController.allCount);

module.exports = router;
