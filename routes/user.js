// userRoutes.js
const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Route for user registration
router.post("/register", userController.register);

// Route for user login
router.post("/login", userController.login);


module.exports = router;
