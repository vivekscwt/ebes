// userRoutes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const router = express.Router();

// Route for user registration
router.post("/register", userController.register);

// Route for user login
router.post("/login", userController.login);

//Route for admin login
router.post("/admin-login", userController.adminLogin);

//Route for change password
router.post("/change-password", checkAuthMiddleware.checkAuth, userController.changePassword);


module.exports = router;
