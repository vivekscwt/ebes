// userRoutes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const checkAuthMiddleware = require('../middleware/check-auth');
const checkAdminMiddleware = require('../middleware/check-admin');
const imageUploader = require('../helpers/image-uploader');
const router = express.Router();

// Route for user registration
router.post("/register", userController.register);

// Route for user login
router.post("/login", userController.login);

//Route for admin login
router.post("/admin-login", userController.adminLogin);

//Route for forgot password
router.post("/forgot-password", userController.forgotPassword);

//Route for Verify OTP 
router.post("/verify-otp", userController.verifyOTP );

//Route for Update Password After Verify OTP
router.post("/update-password", userController.updatePassword );

//Route for change password
router.post("/change-password", checkAuthMiddleware.checkAuth, userController.changePassword);

//Route for total users count
router.get("/user-count", checkAdminMiddleware.checkAdmin, userController.allCount);

//Route for counting users over month
router.get("/users-over-month", checkAdminMiddleware.checkAdmin, userController.usersOverMonth);

//Route for adminEditProfile
router.patch("/admin-edit-profile",checkAdminMiddleware.checkAdmin, userController.adminEditProfile);

//Route for userEditProfile
router.patch("/user-edit-profile", checkAuthMiddleware.checkAuth, userController.userEditProfile);

//Route for userListing
router.get("/user-list/:type",checkAdminMiddleware.checkAdmin, userController.userListing);

//Route for User Profile Image Upload
router.post("/upload-profile-image",  imageUploader.upload.single('profileImage'), userController.uploadOrEditProfileImage);


module.exports = router;
